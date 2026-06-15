/**
 * Ürün / marka / sepet — katalog yükleyici (EqustoShopCatalog).
 * PDP: /shop/{dept}/{slug} → yalnızca data/dept/{dept}.json (hızlı).
 * Tam liste: EqustoShopCatalog.loadMergedCatalog() → data/dept/*.json
 */
;(function () {
  "use strict";

  var CATALOG_V = "20260615-brand-order-v2";
  var __fullMem = null;
  var __fullInflight = null;
  var __deptMem = Object.create(null);
  var __deptInflight = Object.create(null);

  var DEPT_IDS = [
    "pisirme",
    "sogutma",
    "kahve",
    "yikama",
    "hazirlik",
    "icecek",
    "tezgah",
    "dolap",
    "davlumbaz",
    "tasima",
    "araba",
    "istif",
    "set-ustu-mutfak",
    "market-reyon",
    "kuvetler",
    "servis",
  ];

  function mergeCatalogRows(parts) {
    var seen = Object.create(null);
    var out = [];
    (parts || []).forEach(function (arr) {
      (arr || []).forEach(function (row) {
        if (!row) return;
        var key = String(row.id || row.sku || row.model || row.name || "").trim();
        if (!key) return;
        if (seen[key]) return;
        seen[key] = 1;
        out.push(row);
      });
    });
    return out;
  }

  function urlDeptToCatalogDept(seg) {
    var d = String(seg || "").trim();
    if (d === "market-reyonlari") return "market-reyon";
    if (d === "kuvetler") return "set-ustu-mutfak";
    return d;
  }

  function parseProductPath() {
    try {
      var path = location.pathname || "";
      var m = path.match(/\/shop\/([^/]+)\/([^/?#]+)/i);
      if (!m) return null;
      return {
        dept: urlDeptToCatalogDept(decodeURIComponent(m[1])),
        urlDept: decodeURIComponent(m[1]),
        slug: decodeURIComponent(m[2]),
      };
    } catch (_) {
      return null;
    }
  }

  function fetchDeptJson(dept) {
    dept = String(dept || "").trim();
    if (!dept) return Promise.reject(new Error("dept yok"));
    if (__deptMem[dept]) return Promise.resolve(__deptMem[dept]);
    if (__deptInflight[dept]) return __deptInflight[dept];

    var url = "/data/dept/" + encodeURIComponent(dept) + ".json?v=" + CATALOG_V;
    __deptInflight[dept] = fetch(url, {
      cache: "default",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("dept " + dept + " HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error("dept " + dept + " geçersiz");
        }
        __deptMem[dept] = data;
        return data;
      })
      .finally(function () {
        delete __deptInflight[dept];
      });

    return __deptInflight[dept];
  }

  /** Tüm departman JSON birleşimi (public ekipmanlar.json yok) */
  function loadMergedCatalog() {
    var jobs = [];
    DEPT_IDS.forEach(function (d) {
      jobs.push(
        fetchDeptJson(d).catch(function () {
          return [];
        })
      );
    });
    return Promise.all(jobs).then(mergeCatalogRows);
  }

  function loadFullCatalog() {
    if (__fullMem) return Promise.resolve(__fullMem);
    if (__fullInflight) return __fullInflight;

    __fullInflight = loadMergedCatalog()
      .then(function (data) {
        __fullMem = data;
        return data;
      })
      .finally(function () {
        __fullInflight = null;
      });
    return __fullInflight;
  }

  function loadForProductPage() {
    var parsed = parseProductPath();
    if (parsed && parsed.dept && DEPT_IDS.indexOf(parsed.dept) >= 0) {
      return fetchDeptJson(parsed.dept);
    }
    return loadFullCatalog();
  }

  function load() {
    return loadFullCatalog();
  }

  window.EqustoShopCatalog = {
    load: load,
    loadMergedCatalog: loadMergedCatalog,
    loadForProductPage: loadForProductPage,
    loadDept: fetchDeptJson,
    catalogVersion: CATALOG_V,
    clearCache: function () {
      __fullMem = null;
      __fullInflight = null;
      __deptMem = Object.create(null);
      __deptInflight = Object.create(null);
    },
  };
})();
