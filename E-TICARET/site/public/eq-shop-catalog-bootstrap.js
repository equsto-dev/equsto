/**
 * Ürün / marka / sepet — katalog yükleyici (EqustoShopCatalog).
 * PDP: /shop/{dept}/{slug} → yalnızca data/dept/{dept}.json (hızlı).
 * Tam liste: EqustoEcomData.loadEkipmanlar() → data/ekipmanlar.json
 */
;(function () {
  "use strict";

  var CATALOG_V = "20260527caglayan-gallery11";
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
  ];

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

  function loadFullCatalog() {
    if (__fullMem) return Promise.resolve(__fullMem);
    if (__fullInflight) return __fullInflight;

    if (window.EqustoEcomData && typeof window.EqustoEcomData.loadEkipmanlar === "function") {
      __fullInflight = window.EqustoEcomData.loadEkipmanlar()
        .then(function (data) {
          __fullMem = data;
          return data;
        })
        .finally(function () {
          __fullInflight = null;
        });
      return __fullInflight;
    }

    var url = "/data/ekipmanlar.json?v=" + CATALOG_V;
    __fullInflight = fetch(url, {
      cache: "default",
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("ekipmanlar HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) {
          throw new Error("ekipmanlar boş");
        }
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
