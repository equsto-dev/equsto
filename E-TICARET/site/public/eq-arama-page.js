/**
 * /arama?q= — Meilisearch sonuç sayfası + istemci filtreleri
 */
;(function () {
  "use strict";

  var PAGE_SIZE = 96;
  var sourceHits = [];
  var loadMoreBusy = false;
  var CATALOG_V = (function () {
    var el = document.querySelector("[data-eq-shop-chrome-v]");
    return (el && el.getAttribute("data-eq-shop-chrome-v")) || "20260529-9890-imgs";
  })();
  var lastRender = { q: "", total: 0, err: null, warning: "", hasMore: false };
  var serverFacets = null;
  var catalogImgById = null;
  var catalogImgInflight = null;
  var uiBound = false;
  var facetsBound = false;
  var lastBootQ = null;
  var searchFetchCtrl = null;
  var renderAllRaf = 0;
  var CATALOG_MAP_TIMEOUT_MS = 6000;

  var filterState = {
    depts: [],
    brands: [],
    kuvetGn: [],
    buzdolapTip: [],
    pisirmeTip: [],
    sort: "",
    priceMin: "",
    priceMax: "",
  };

  var DEPT_LABELS = {
    pisirme: { key: "nav.pisirme", fb: "Pişirme" },
    sogutma: { key: "nav.sogutma", fb: "Soğutma" },
    kahve: { key: "nav.kahve", fb: "Kahve" },
    yikama: { key: "nav.yikama", fb: "Yıkama" },
    hazirlik: { key: "nav.hazirlik", fb: "Hazırlık" },
    icecek: { key: "nav.icecek", fb: "İçecek" },
    tezgah: { key: "nav.tezgah", fb: "Tezgah" },
    dolap: { key: "nav.dolap", fb: "Dolap" },
    davlumbaz: { key: "nav.davlumbaz", fb: "Davlumbaz" },
    tasima: { key: "nav.tasima", fb: "Taşıma" },
    araba: { key: "nav.araba", fb: "Servis Arabaları" },
    istif: { key: "nav.istif", fb: "İstif" },
    "set-ustu-mutfak": { key: "nav.set_ustu", fb: "Set Üstü Mutfak" },
    kuvetler: { key: "nav.kuvetler", fb: "Küvetler" },
    "market-reyonlari": { key: "nav.market_reyonlari", fb: "Market Reyonları" },
    "market-reyon": { key: "nav.market_reyonlari", fb: "Market Reyonları" },
  };

  function __searchT(k, fb, vars) {
    var s = fb || k;
    try {
      if (typeof window.eqT === "function") {
        var v = window.eqT(k, null);
        if (v != null && v !== k) s = v;
      }
    } catch (_) {}
    if (vars) {
      Object.keys(vars).forEach(function (kk) {
        s = String(s).replace(new RegExp("\\{" + kk + "\\}", "g"), vars[kk]);
      });
    }
    return s;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function dimLabelFromMm(g, d, y) {
    if (typeof window.eqDimLabelFromMm === "function") return window.eqDimLabelFromMm(g, d, y);
    if (!g || !d || !y) return "";
    return g + "×" + d + "×" + y;
  }

  function isInoksanCatalogRow(raw) {
    if (!raw) return false;
    var sku = String(raw.sku || raw.urun_kodu || raw.model || "")
      .trim()
      .toUpperCase();
    if (/^INO-/.test(sku)) return true;
    var id = String(raw.id || "");
    if (id.indexOf("inoksan__") === 0) return true;
    var b = lc(raw.brand || raw.oem_brand || "");
    return b.indexOf("inoksan") >= 0;
  }

  function parseLenToMm(raw) {
    var s = String(raw || "")
      .trim()
      .split("+")[0]
      .trim();
    var m = s.match(/([\d.,]+)\s*(mm|cm|m)?/i);
    if (!m) return 0;
    var v = parseFloat(String(m[1]).replace(",", "."));
    if (!v) return 0;
    var u = String(m[2] || "").toLowerCase();
    if (u === "cm") return Math.round(v * 10);
    if (u === "m") return Math.round(v * 1000);
    if (u === "mm") return Math.round(v);
    return v >= 300 ? Math.round(v) : Math.round(v * 10);
  }

  function dimLabelTezgahFromMm(g, d, y) {
    if (!g || !d || !y) return "";
    return Math.round(g / 10) + "×" + Math.round(d / 10) + "×" + Math.round(y / 10) + " cm";
  }

  function specLinesFromRaw(raw) {
    if (raw && raw.teknik_ozellikler && raw.teknik_ozellikler.length) {
      return raw.teknik_ozellikler;
    }
    if (raw && raw.specs) return String(raw.specs).split("\n");
    return [];
  }

  function parseDimsFromSpecsOlcu(raw) {
    var lines = specLinesFromRaw(raw);
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i] || "");
      var mCm = t.match(
        /Ölçü\s*\(cm\):\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})/i
      );
      if (mCm) {
        return dimLabelTezgahFromMm(+mCm[1] * 10, +mCm[2] * 10, +mCm[3] * 10);
      }
      var mMm = t.match(
        /Ebat\s*\(mm\):\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})/i
      );
      if (mMm) return dimLabelFromMm(+mMm[1], +mMm[2], +mMm[3]);
    }
    return "";
  }

  function parseOztiEnBoyDims(raw) {
    var lines = specLinesFromRaw(raw);
    var g = 0;
    var d = 0;
    var y = 0;
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i] || "");
      var me = t.match(/En\s*\(mm\):\s*([\d.,]+)/i);
      var mb = t.match(/Boy\s*\(mm\):\s*([\d.,]+)/i);
      var my = t.match(/Yükseklik\s*\(mm\):\s*([\d.,]+)/i);
      if (me) g = parseLenToMm(me[1] + " mm") || g;
      if (mb) d = parseLenToMm(mb[1] + " mm") || d;
      if (my) y = parseLenToMm(my[1] + " mm") || y;
    }
    if (g && d && y) return dimLabelFromMm(g, d, y);
    return "";
  }

  function parseDimsFromTeknik(raw) {
    var lines = specLinesFromRaw(raw);
    var g = 0;
    var d = 0;
    var y = 0;
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i] || "");
      var mg = t.match(/Genişlik:\s*([^,\n]+)/i);
      var md = t.match(/Derinlik:\s*([^,\n]+)/i);
      var my = t.match(/Yükseklik:\s*([^,\n]+)/i);
      if (mg) g = parseLenToMm(mg[1]) || g;
      if (md) d = parseLenToMm(md[1]) || d;
      if (my) y = parseLenToMm(my[1]) || y;
    }
    if (g && d && y) return dimLabelTezgahFromMm(g, d, y);
    return "";
  }

  function isOztiRow(raw) {
    if (!raw) return false;
    var k = String(raw.kaynak || raw.kaynak_fiyat_listesi || "");
    if (/^ozti/i.test(k)) return true;
    if (String(raw.dept || "") === "set-ustu-mutfak") return true;
    return false;
  }

  function isOztiBrandRow(raw) {
    if (!raw) return false;
    var b = lc(raw.brand || raw.oem_brand || "");
    return b.indexOf("oztiryakiler") >= 0 || b.indexOf("öztiryakiler") >= 0;
  }

  function formatOlculerLine(raw) {
    if (!raw) return "";
    if (raw.olcu_etiket) {
      return typeof window.eqStripDimUnitSuffix === "function"
        ? window.eqStripDimUnitSuffix(raw.olcu_etiket)
        : String(raw.olcu_etiket).replace(/\s*(?:mm|cm)\b\.?/gi, "").trim();
    }
    if (isInoksanCatalogRow(raw)) {
      var o = raw.olculer;
      if (o) {
        var u = Number(o.uzunluk_mm);
        var g = Number(o.genislik_mm);
        var y = Number(o.yukseklik_mm);
        if (u && g && y) return dimLabelFromMm(u, g, y);
      }
    }
    var o2 = raw.olculer;
    if (o2) {
      var g2 = Number(o2.genislik_mm);
      var d2 = Number(o2.derinlik_mm);
      var y2 = Number(o2.yukseklik_mm);
      if (g2 && d2 && y2) return dimLabelFromMm(g2, d2, y2);
    }
    var fromSpecsOlcu = parseDimsFromSpecsOlcu(raw);
    if (fromSpecsOlcu) return fromSpecsOlcu;
    if (isOztiRow(raw) || isOztiBrandRow(raw)) {
      var oztiWeb = parseOztiEnBoyDims(raw);
      if (oztiWeb) return oztiWeb;
      var oztiTeknik = parseDimsFromTeknik(raw);
      if (oztiTeknik) return oztiTeknik;
    }
    return "";
  }

  function trimQ(q) {
    return String(q == null ? "" : q).trim();
  }

  function deptLabel(dept) {
    var meta = DEPT_LABELS[dept];
    if (!meta) return dept;
    return __searchT(meta.key, meta.fb);
  }

  function hitDeptKey(h) {
    var d = String((h && h.dept) || "").trim().toLowerCase();
    if (d === "market-reyon") return "market-reyonlari";
    return d || "pisirme";
  }

  function hitBrandKey(h) {
    return String((h && h.brand) || "").trim();
  }

  function plpBrandForHit(h) {
    if (window.EqDeptCmFacets && typeof window.EqDeptCmFacets.plpCardBrandLabel === "function") {
      return window.EqDeptCmFacets.plpCardBrandLabel({
        brand: h.brand,
        b: h.brand,
        name: h.name,
        n: h.name,
        raw: h,
      });
    }
    return String((h && h.brand) || "").trim();
  }

  function parsePriceFromHit(h) {
    if (!h) return 0;
    if (h.satis_eur_indirimli != null && Number(h.satis_eur_indirimli) > 0) {
      return Number(h.satis_eur_indirimli);
    }
    if (h.liste_fiyati_eur != null && Number(h.liste_fiyati_eur) > 0) {
      return Number(h.liste_fiyati_eur);
    }
    var s = String(h.price || "")
      .split("\n")[0]
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^\d.]/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function catalogSlugFromHit(hit) {
    if (!hit) return "";
    var slug = String(hit.slug || "").trim().toLowerCase().replace(/_/g, "-");
    if (slug && slug.indexOf("__") < 0 && slug.indexOf("oztiryakiler") < 0) {
      return slug.replace(/\//g, "-");
    }
    var id = String(hit.id || "").trim().toLowerCase();
    if (id.indexOf("__") >= 0) {
      var tail = id.split("__").pop();
      if (tail) return tail.replace(/\//g, "-");
    }
    if (typeof window.eqProductSlug === "function") {
      var fromRow = window.eqProductSlug(hit);
      if (fromRow) return fromRow;
    }
    if (id) return id.replace(/\//g, "-");
    return slug.replace(/\//g, "-");
  }

  function dedupeHits(hits) {
    if (!Array.isArray(hits) || hits.length < 2) return hits || [];
    var seen = Object.create(null);
    var out = [];
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      if (!h) continue;
      var key = String(h.id || h.slug || h.name || i);
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(h);
    }
    return out;
  }

  function resetFilters() {
    filterState.depts = [];
    filterState.brands = [];
    filterState.kuvetGn = [];
    filterState.buzdolapTip = [];
    filterState.pisirmeTip = [];
    filterState.sort = "";
    filterState.priceMin = "";
    filterState.priceMax = "";
    serverFacets = null;
    var sortEl = document.getElementById("eq-arama-sort");
    if (sortEl) sortEl.value = "";
  }

  function buildFacetQueryParams() {
    var parts = ["facets=1"];
    if (filterState.depts.length) {
      parts.push("dept=" + encodeURIComponent(filterState.depts.join(",")));
    }
    if (filterState.brands.length) {
      parts.push("brand=" + encodeURIComponent(filterState.brands.join(",")));
    }
    if (filterState.pisirmeTip.length) {
      parts.push("pisirmeTip=" + encodeURIComponent(filterState.pisirmeTip.join(",")));
    }
    if (filterState.priceMin !== "") {
      parts.push("priceMin=" + encodeURIComponent(filterState.priceMin));
    }
    if (filterState.priceMax !== "") {
      parts.push("priceMax=" + encodeURIComponent(filterState.priceMax));
    }
    return parts.join("&");
  }

  function refetchWithFilters() {
    var q = lastRender.q || getQuery();
    if (!q) {
      renderAll();
      return;
    }
    fetchPage(q, 0, true);
  }

  function hasKuvetGnFacets() {
    return !!(window.EqKuvetGnFacets && sourceHits.some(window.EqKuvetGnFacets.isGnKuvetProduct));
  }

  function hasBuzdolapFacets() {
    return !!(window.EqBuzdolapFacets && sourceHits.some(window.EqBuzdolapFacets.isBuzdolapProduct));
  }

  function hasPisirmeFacets() {
    if (serverFacets && serverFacets.hasPisirmeFacets) return true;
    return !!(window.EqPisirmeFacets && sourceHits.some(window.EqPisirmeFacets.isPisirmeProduct));
  }

  function hasActiveFilters() {
    return (
      filterState.depts.length > 0 ||
      filterState.brands.length > 0 ||
      filterState.kuvetGn.length > 0 ||
      filterState.buzdolapTip.length > 0 ||
      filterState.pisirmeTip.length > 0 ||
      filterState.priceMin !== "" ||
      filterState.priceMax !== "" ||
      !!filterState.sort
    );
  }

  function poolForCounts(exclude) {
    var list = sourceHits.slice();
    if (filterState.depts.length && exclude !== "dept") {
      list = list.filter(function (h) {
        return filterState.depts.indexOf(hitDeptKey(h)) >= 0;
      });
    }
    if (filterState.brands.length && exclude !== "brand") {
      list = list.filter(function (h) {
        return filterState.brands.indexOf(hitBrandKey(h)) >= 0;
      });
    }
    if (filterState.kuvetGn.length && exclude !== "kuvetGn" && window.EqKuvetGnFacets) {
      list = list.filter(function (h) {
        return window.EqKuvetGnFacets.hitMatchesAnyFacet(h, filterState.kuvetGn);
      });
    }
    if (filterState.buzdolapTip.length && exclude !== "buzdolapTip" && window.EqBuzdolapFacets) {
      list = list.filter(function (h) {
        return window.EqBuzdolapFacets.hitMatchesAnyFacet(h, filterState.buzdolapTip);
      });
    }
    if (filterState.pisirmeTip.length && exclude !== "pisirmeTip" && window.EqPisirmeFacets) {
      list = list.filter(function (h) {
        return window.EqPisirmeFacets.hitMatchesAnyFacet(h, filterState.pisirmeTip);
      });
    }
    if (filterState.priceMin !== "" && exclude !== "price") {
      var lo = Number(filterState.priceMin);
      list = list.filter(function (h) {
        return parsePriceFromHit(h) >= lo;
      });
    }
    if (filterState.priceMax !== "" && exclude !== "price") {
      var hi = Number(filterState.priceMax);
      list = list.filter(function (h) {
        var n = parsePriceFromHit(h);
        return !n || n <= hi;
      });
    }
    return list;
  }

  function filteredHits() {
    var list = serverFacets ? sourceHits.slice() : poolForCounts(null);
    if (!serverFacets) {
      list = list.slice();
    } else {
      if (filterState.kuvetGn.length && window.EqKuvetGnFacets) {
        list = list.filter(function (h) {
          return window.EqKuvetGnFacets.hitMatchesAnyFacet(h, filterState.kuvetGn);
        });
      }
      if (filterState.buzdolapTip.length && window.EqBuzdolapFacets) {
        list = list.filter(function (h) {
          return window.EqBuzdolapFacets.hitMatchesAnyFacet(h, filterState.buzdolapTip);
        });
      }
    }
    if (filterState.sort === "name") {
      list.sort(function (a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""), "tr");
      });
    } else if (filterState.sort === "name-desc") {
      list.sort(function (a, b) {
        return String(b.name || "").localeCompare(String(a.name || ""), "tr");
      });
    } else if (filterState.sort === "price-asc") {
      list.sort(function (a, b) {
        return parsePriceFromHit(a) - parsePriceFromHit(b);
      });
    } else if (filterState.sort === "price-desc") {
      list.sort(function (a, b) {
        return parsePriceFromHit(b) - parsePriceFromHit(a);
      });
    }
    return list;
  }

  function productHref(hit) {
    if (!hit) return "#";
    if (hit.url) {
      try {
        if (typeof window.eqProductPath === "function" && hit.dept && hit.slug) {
          var dept0 = String(hit.dept).replace(/^\/+|\/+$/g, "");
          if (dept0 === "market-reyon") dept0 = "market-reyonlari";
          return window.eqProductPath(dept0, catalogSlugFromHit(hit));
        }
      } catch (_) {}
      return hit.url;
    }
    var dept = String(hit.dept || "pisirme").replace(/^\/+|\/+$/g, "");
    if (dept === "market-reyon") dept = "market-reyonlari";
    var slug = catalogSlugFromHit(hit);
    if (!slug) return "#";
    try {
      if (typeof window.eqProductPath === "function") {
        return window.eqProductPath(dept, slug);
      }
    } catch (_) {}
    return "/shop/" + encodeURIComponent(dept) + "/" + encodeURIComponent(slug);
  }

  function loadCatalogImageMap() {
    if (catalogImgById) return Promise.resolve(catalogImgById);
    if (catalogImgInflight) return catalogImgInflight;

    function buildMap(rows) {
      var map = Object.create(null);
      if (Array.isArray(rows)) {
        rows.forEach(function (row) {
          if (!row || !row.id) return;
          map[String(row.id)] = {
            images: row.images || [],
            sku: row.sku || row.model || row.urun_kodu || "",
            brand: row.brand || "",
            olculer: row.olculer || null,
            olcu_etiket: row.olcu_etiket || "",
          };
        });
      }
      catalogImgById = map;
      return map;
    }

    var loader = null;
    if (window.EqustoShopCatalog && typeof window.EqustoShopCatalog.loadMergedCatalog === "function") {
      loader = window.EqustoShopCatalog.loadMergedCatalog().then(buildMap);
    } else if (window.EqustoEcomData && typeof window.EqustoEcomData.loadEkipmanlar === "function") {
      loader = window.EqustoEcomData.loadEkipmanlar().then(buildMap);
    } else {
      loader = Promise.resolve(Object.create(null));
    }

    var timeout = new Promise(function (resolve) {
      setTimeout(function () {
        resolve(catalogImgById || Object.create(null));
      }, CATALOG_MAP_TIMEOUT_MS);
    });

    catalogImgInflight = Promise.race([loader, timeout])
      .catch(function () {
        catalogImgById = catalogImgById || Object.create(null);
        return catalogImgById;
      })
      .finally(function () {
        catalogImgInflight = null;
      });
    return catalogImgInflight;
  }

  function hitsNeedCatalogEnrich(hits) {
    if (!Array.isArray(hits) || !hits.length) return false;
    for (var i = 0; i < hits.length; i++) {
      var h = hits[i];
      if (h && (!h.image || !h.olculer)) return true;
    }
    return false;
  }

  function enrichHitsAsync(hits, replace) {
    if (!hitsNeedCatalogEnrich(hits)) return;
    loadCatalogImageMap().then(function () {
      var enriched = enrichHits(hits);
      if (replace) {
        sourceHits = sortHitsWithImagesFirst(enriched);
      } else {
        var idMap = Object.create(null);
        sourceHits.forEach(function (h, idx) {
          if (h && h.id) idMap[h.id] = idx;
        });
        enriched.forEach(function (h) {
          if (h && h.id && idMap[h.id] != null) sourceHits[idMap[h.id]] = h;
          else sourceHits.push(h);
        });
        sourceHits = dedupeHits(sourceHits);
      }
      renderAll();
    });
  }

  function isCatalogRenderRel(rel) {
    return /\/catalog\/ozti\/(?:web|p287|pdf|katalog)\//i.test(String(rel || ""));
  }

  function slugOzti(kod) {
    return (
      "ozti-" +
      String(kod || "")
        .toLowerCase()
        .replace(/\./g, "-")
        .replace(/[^a-z0-9-]/g, "")
    );
  }

  function pickCatalogImage(row, mapped) {
    var imgs = (row && row.images) || [];
    var i;
    for (i = 0; i < imgs.length; i++) {
      if (/cafemarkt/i.test(imgs[i])) return String(imgs[i]).replace(/\\/g, "/");
    }
    for (i = 0; i < imgs.length; i++) {
      if (!isCatalogRenderRel(imgs[i])) return String(imgs[i]).replace(/\\/g, "/");
    }
    var rel = String(mapped || imgs[0] || "").replace(/\\/g, "/");
    if (rel && isCatalogRenderRel(rel)) {
      var kod = row && (row.sku || row.model || row.urun_kodu);
      if (kod) return "images/catalog/ozti/cafemarkt/" + slugOzti(kod) + ".jpg";
      return rel.replace("/ozti/web/", "/ozti/cafemarkt/");
    }
    return rel;
  }

  function enrichHits(hits) {
    if (!catalogImgById || !Array.isArray(hits)) return hits || [];
    return hits.map(function (h) {
      if (!h) return h;
      var cat = catalogImgById[h.id];
      var row = cat
        ? {
            images: cat.images || [],
            sku: cat.sku || h.sku || h.model,
            brand: cat.brand || h.brand,
            olculer: cat.olculer || h.olculer || null,
            olcu_etiket: cat.olcu_etiket || h.olcu_etiket || "",
          }
        : {
            images: h.image ? [h.image] : [],
            sku: h.sku || h.model,
            brand: h.brand,
            olculer: h.olculer || null,
            olcu_etiket: h.olcu_etiket || "",
          };
      var img = pickCatalogImage(row, cat && cat.images && cat.images[0]);
      var next = Object.assign({}, h, {
        olculer: row.olculer || h.olculer || null,
        olcu_etiket: row.olcu_etiket || h.olcu_etiket || "",
      });
      if (img) next.image = img;
      return next;
    });
  }

  function sortHitsWithImagesFirst(hits) {
    if (!Array.isArray(hits) || hits.length < 2) return hits || [];
    return hits.slice().sort(function (a, b) {
      var ai = a && a.image ? 1 : 0;
      var bi = b && b.image ? 1 : 0;
      return bi - ai;
    });
  }

  function imgSrc(hit) {
    var img = hit && hit.image;
    if (!img) return "";
    img = String(img).replace(/\\/g, "/");
    if (typeof window.eqProductImgSrc === "function") {
      try {
        var eq = window.eqProductImgSrc(img);
        if (eq) return eq;
      } catch (_) {}
    }
    if (typeof window.catalogImageCandidates === "function") {
      try {
        var tries = window.catalogImageCandidates(img);
        if (tries && tries.length) return tries[0];
      } catch (_) {}
    }
    if (typeof window.equstoDataAssetHref === "function") {
      try {
        var href = window.equstoDataAssetHref(img);
        if (href) return href;
      } catch (_) {}
    }
    if (/^images\//i.test(img)) {
      var root =
        typeof window.equstoCatalogImagesWebRoot === "function"
          ? window.equstoCatalogImagesWebRoot()
          : "/data/images/";
      return root + img.replace(/^images\//i, "");
    }
    if (img.charAt(0) === "/") return img;
    return "/data/" + img.replace(/^data\//, "");
  }

  function parseKdvDahilTlFromHit(hit) {
    if (!hit) return 0;
    if (Number(hit.fiyat_tl) > 0) return Number(hit.fiyat_tl);
    var full = String(hit.price || "");
    var dahil = full.match(/K\s*D\s*V\s*[Dd]ahil[^\d]*([\d.,]+)/i);
    if (dahil) {
      var v = parsePriceFromHit({ price: dahil[1] });
      if (v > 0) return v;
    }
    var line0 = full.split("\n")[0] || "";
    if (/\+?\s*K\s*D\s*V/i.test(line0)) {
      var net = parsePriceFromHit({ price: line0 });
      if (net > 0) return Math.round(net * 1.2 * 100) / 100;
    }
    return parsePriceFromHit(hit);
  }

  function formatPrice(hit) {
    if (!hit) return "";
    if (hit.price_display) return hit.price_display;
    if (window.EqustoPriceDisplay && typeof window.EqustoPriceDisplay.formatCard === "function") {
      return window.EqustoPriceDisplay.formatCard(hit);
    }
    var n = parseKdvDahilTlFromHit(hit);
    if (n > 0) {
      return (
        "₺" +
        n.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) +
        " KDV dahil"
      );
    }
    return String(hit.price || "").split("\n")[0];
  }

  function getQuery() {
    try {
      return trimQ(new URLSearchParams(location.search).get("q") || "");
    } catch (_) {
      return "";
    }
  }

  function syncPageTitle(q) {
    try {
      document.title = q
        ? __searchT("search.title_q", "Arama: «{q}»", { q: q }) + " · Equsto"
        : __searchT("search.page_title", "Arama — Equsto");
    } catch (_) {}
  }

  function renderMoreButton(q, hasMore) {
    var host = document.getElementById("eq-arama-more");
    if (!host) return;
    if (!hasMore || !q) {
      host.innerHTML = "";
      return;
    }
    var shown = sourceHits.length;
    host.innerHTML =
      '<button type="button" class="eq-arama-more__btn" id="eq-arama-more-btn">' +
      esc(
        __searchT("search.load_more", "{shown} / {total} — daha fazla göster", {
          shown: String(shown),
          total: String(lastRender.total != null ? lastRender.total : shown),
        })
      ) +
      "</button>";
    var btn = document.getElementById("eq-arama-more-btn");
    if (btn) {
      btn.onclick = function () {
        fetchPage(q, shown, false);
      };
    }
  }

  function renderSelectedChips() {
    var host = document.getElementById("eq-arama-selected");
    var chips = document.getElementById("eq-arama-chips");
    if (!host || !chips) return;
    var html = "";
    filterState.depts.forEach(function (d) {
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="dept" data-value="' +
        esc(d) +
        '">' +
        esc(deptLabel(d)) +
        " ×</button>";
    });
    filterState.brands.forEach(function (b) {
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="brand" data-value="' +
        esc(b) +
        '">' +
        esc(b) +
        " ×</button>";
    });
    filterState.kuvetGn.forEach(function (k) {
      var lbl =
        window.EqKuvetGnFacets && window.EqKuvetGnFacets.labelFromKey
          ? window.EqKuvetGnFacets.labelFromKey(k)
          : k;
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="kuvetGn" data-value="' +
        esc(k) +
        '">' +
        esc(lbl) +
        " ×</button>";
    });
    filterState.buzdolapTip.forEach(function (k) {
      var blbl =
        window.EqBuzdolapFacets && window.EqBuzdolapFacets.labelFromKey
          ? window.EqBuzdolapFacets.labelFromKey(k)
          : k;
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="buzdolapTip" data-value="' +
        esc(k) +
        '">' +
        esc(blbl) +
        " ×</button>";
    });
    filterState.pisirmeTip.forEach(function (k) {
      var plbl =
        window.EqPisirmeFacets && window.EqPisirmeFacets.labelFromKey
          ? window.EqPisirmeFacets.labelFromKey(k)
          : k;
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="pisirmeTip" data-value="' +
        esc(k) +
        '">' +
        esc(plbl) +
        " ×</button>";
    });
    if (filterState.priceMin !== "") {
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="priceMin">min ' +
        esc(filterState.priceMin) +
        " ×</button>";
    }
    if (filterState.priceMax !== "") {
      html +=
        '<button type="button" class="eq-cm-chip" data-kind="priceMax">max ' +
        esc(filterState.priceMax) +
        " ×</button>";
    }
    chips.innerHTML = html;
    host.hidden = !html;
    chips.querySelectorAll(".eq-cm-chip").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var kind = btn.getAttribute("data-kind");
        var val = btn.getAttribute("data-value");
        if (kind === "dept") {
          filterState.depts = filterState.depts.filter(function (d) {
            return d !== val;
          });
          refetchWithFilters();
        } else if (kind === "brand") {
          filterState.brands = filterState.brands.filter(function (b) {
            return b !== val;
          });
          refetchWithFilters();
        } else if (kind === "kuvetGn") {
          filterState.kuvetGn = filterState.kuvetGn.filter(function (k) {
            return k !== val;
          });
          renderAll();
        } else if (kind === "buzdolapTip") {
          filterState.buzdolapTip = filterState.buzdolapTip.filter(function (k) {
            return k !== val;
          });
          renderAll();
        } else if (kind === "pisirmeTip") {
          filterState.pisirmeTip = filterState.pisirmeTip.filter(function (k) {
            return k !== val;
          });
          refetchWithFilters();
        } else if (kind === "priceMin") {
          filterState.priceMin = "";
          refetchWithFilters();
        } else if (kind === "priceMax") {
          filterState.priceMax = "";
          refetchWithFilters();
        }
      });
    });
  }

  function renderFacets() {
    var host = document.getElementById("eq-arama-facets");
    if (!host || (!sourceHits.length && !serverFacets)) {
      if (host) host.innerHTML = "";
      return;
    }

    var deptCounts = Object.create(null);
    var brandCounts = Object.create(null);
    var priceMinAll = Infinity;
    var priceMaxAll = 0;

    if (serverFacets) {
      Object.keys(serverFacets.depts || {}).forEach(function (k) {
        deptCounts[k] = serverFacets.depts[k];
      });
      Object.keys(serverFacets.brands || {}).forEach(function (k) {
        brandCounts[k] = serverFacets.brands[k];
      });
      priceMinAll = Number(serverFacets.priceMin) || 0;
      priceMaxAll = Number(serverFacets.priceMax) || 0;
    } else {
      var deptPool = poolForCounts("dept");
      var brandPool = poolForCounts("brand");
      var pricePool = poolForCounts("price");
      deptPool.forEach(function (h) {
        var d = hitDeptKey(h);
        deptCounts[d] = (deptCounts[d] || 0) + 1;
      });
      brandPool.forEach(function (h) {
        var b = hitBrandKey(h);
        if (b) brandCounts[b] = (brandCounts[b] || 0) + 1;
      });
      pricePool.forEach(function (h) {
        var pr = parsePriceFromHit(h);
        if (pr > 0) {
          if (pr < priceMinAll) priceMinAll = pr;
          if (pr > priceMaxAll) priceMaxAll = pr;
        }
      });
    }
    if (!isFinite(priceMinAll)) priceMinAll = 0;

    var depts = Object.keys(deptCounts).sort(function (a, b) {
      return deptCounts[b] - deptCounts[a];
    });
    filterState.depts.forEach(function (d) {
      if (depts.indexOf(d) < 0) depts.push(d);
    });

    var brands = Object.keys(brandCounts).sort(function (a, b) {
      return brandCounts[b] - brandCounts[a];
    });
    filterState.brands.forEach(function (b) {
      if (b && brands.indexOf(b) < 0) brands.push(b);
    });

    var html = "";

    if (depts.length > 1) {
      html +=
        '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
        esc(__searchT("search.filter_dept", "Departman")) +
        '</summary><div class="eq-cm-facet__body"><ul class="eq-cm-facet__list">';
      depts.forEach(function (d) {
        var checked = filterState.depts.indexOf(d) >= 0 ? " checked" : "";
        html +=
          '<li class="eq-cm-facet__item"><label class="eq-cm-facet__label">' +
          '<input type="checkbox" name="eq-arama-dept" value="' +
          esc(d) +
          '"' +
          checked +
          "><span>" +
          esc(deptLabel(d)) +
          '</span><span class="eq-cm-facet__count">(' +
          deptCounts[d] +
          ")</span></label></li>";
      });
      html += "</ul></div></details>";
    }

    html +=
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      esc(__searchT("search.filter_brand", "Marka")) +
      '</summary><div class="eq-cm-facet__body">' +
      '<input type="search" class="eq-cm-facet__search" id="eq-arama-brand-q" placeholder="' +
      esc(__searchT("search.brand_search_ph", "Marka ara")) +
      '" autocomplete="off">' +
      '<ul class="eq-cm-facet__list" id="eq-arama-brand-list">';
    brands.slice(0, 80).forEach(function (b) {
      var checked = filterState.brands.indexOf(b) >= 0 ? " checked" : "";
      html +=
        '<li class="eq-cm-facet__item" data-brand-label="' +
        esc(lc(b)) +
        '"><label class="eq-cm-facet__label">' +
        '<input type="checkbox" name="eq-arama-brand" value="' +
        esc(b) +
        '"' +
        checked +
        "><span>" +
        esc(b) +
        '</span><span class="eq-cm-facet__count">(' +
        brandCounts[b] +
        ")</span></label></li>";
    });
    html += "</ul></div></details>";

    if (window.EqKuvetGnFacets && hasKuvetGnFacets()) {
      var kuvetGnPool = poolForCounts("kuvetGn");
      var gnCounts = window.EqKuvetGnFacets.countFacets(kuvetGnPool);
      html += window.EqKuvetGnFacets.renderFacetListHtml({
        counts: gnCounts,
        selected: filterState.kuvetGn,
        inputName: "eq-arama-kuvet-gn",
        title: __searchT("search.filter_gn_size", "GN ölçü"),
      });
    }

    if (window.EqBuzdolapFacets && hasBuzdolapFacets()) {
      var buzdolapTipPool = poolForCounts("buzdolapTip");
      var buzCounts = window.EqBuzdolapFacets.countFacets(buzdolapTipPool);
      html += window.EqBuzdolapFacets.renderFacetListHtml({
        counts: buzCounts,
        selected: filterState.buzdolapTip,
        inputName: "eq-arama-buzdolap-tip",
        title: __searchT("search.filter_buzdolap_type", "Buzdolabı tipi"),
      });
    }

    if (window.EqPisirmeFacets && hasPisirmeFacets()) {
      var pisCounts = serverFacets
        ? serverFacets.pisirmeTip || {}
        : window.EqPisirmeFacets.countFacets(poolForCounts("pisirmeTip"));
      html += window.EqPisirmeFacets.renderFacetListHtml({
        counts: pisCounts,
        selected: filterState.pisirmeTip,
        inputName: "eq-arama-pisirme-tip",
        title: __searchT("search.filter_pisirme_type", "Pişirme tipi"),
      });
    }

    html +=
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      esc(__searchT("search.filter_price", "Fiyat")) +
      '</summary><div class="eq-cm-facet__body">' +
      '<div class="eq-cm-facet__price-row">' +
      '<input type="number" id="eq-arama-price-min" min="0" step="1" placeholder="' +
      esc(__searchT("search.price_min", "Min")) +
      '" value="' +
      esc(filterState.priceMin) +
      '">' +
      '<span>—</span>' +
      '<input type="number" id="eq-arama-price-max" min="0" step="1" placeholder="' +
      esc(__searchT("search.price_max", "Max")) +
      '" value="' +
      esc(filterState.priceMax) +
      '">' +
      "</div>" +
      '<button type="button" class="eq-cm-facet__apply" id="eq-arama-price-apply">' +
      esc(__searchT("search.price_apply", "Uygula")) +
      "</button>";
    if (priceMaxAll > 0) {
      html +=
        '<p class="eq-cm-facet__range-hint">' +
        esc(
          __searchT("search.price_range_hint", "Aralık: {min} – {max} EUR", {
            min: String(Math.floor(priceMinAll)),
            max: String(Math.ceil(priceMaxAll)),
          })
        ) +
        "</p>";
    }
    html += "</div></details>";

    host.innerHTML = html;
  }

  function bindFacetEvents() {
    if (facetsBound) return;
    var host = document.getElementById("eq-arama-facets");
    if (!host) return;
    facetsBound = true;

    host.addEventListener("change", function (ev) {
      var t = ev.target;
      if (!t || !t.name) return;
      if (t.name === "eq-arama-dept") {
        var deptVals = [];
        host.querySelectorAll('input[name="eq-arama-dept"]:checked').forEach(function (el) {
          deptVals.push(el.value);
        });
        filterState.depts = deptVals;
        refetchWithFilters();
        return;
      }
      if (t.name === "eq-arama-brand") {
        var brandVals = [];
        host.querySelectorAll('input[name="eq-arama-brand"]:checked').forEach(function (el) {
          brandVals.push(el.value);
        });
        filterState.brands = brandVals;
        refetchWithFilters();
        return;
      }
      if (t.name === "eq-arama-kuvet-gn") {
        var gnVals = [];
        host.querySelectorAll('input[name="eq-arama-kuvet-gn"]:checked').forEach(function (el) {
          gnVals.push(el.value);
        });
        filterState.kuvetGn = gnVals;
        renderAll();
        return;
      }
      if (t.name === "eq-arama-buzdolap-tip") {
        var buzVals = [];
        host.querySelectorAll('input[name="eq-arama-buzdolap-tip"]:checked').forEach(function (el) {
          buzVals.push(el.value);
        });
        filterState.buzdolapTip = buzVals;
        renderAll();
        return;
      }
      if (t.name === "eq-arama-pisirme-tip") {
        var pisVals = [];
        host.querySelectorAll('input[name="eq-arama-pisirme-tip"]:checked').forEach(function (el) {
          pisVals.push(el.value);
        });
        filterState.pisirmeTip = pisVals;
        refetchWithFilters();
      }
    });

    host.addEventListener("input", function (ev) {
      var t = ev.target;
      if (!t || t.id !== "eq-arama-brand-q") return;
      var q = lc(t.value);
      host.querySelectorAll("#eq-arama-brand-list .eq-cm-facet__item").forEach(function (li) {
        var lab = li.getAttribute("data-brand-label") || "";
        li.style.display = !q || lab.indexOf(q) >= 0 ? "" : "none";
      });
    });

    host.addEventListener("click", function (ev) {
      var t = ev.target;
      if (!t || t.id !== "eq-arama-price-apply") return;
      var minEl = document.getElementById("eq-arama-price-min");
      var maxEl = document.getElementById("eq-arama-price-max");
      filterState.priceMin = minEl && minEl.value !== "" ? minEl.value : "";
      filterState.priceMax = maxEl && maxEl.value !== "" ? maxEl.value : "";
      refetchWithFilters();
    });
  }

  function renderGrid(hits, q, err) {
    var grid = document.getElementById("eq-arama-grid");
    if (!grid) return;

    if (err) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status eq-dept-plp-status--err">' + esc(err) + "</p>";
      return;
    }
    if (!q) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status">' +
        esc(__searchT("search.use_top_bar", "Üst çubuktan arama yapın.")) +
        "</p>";
      return;
    }
    if (!sourceHits.length) {
      grid.innerHTML =
        '<p class="eq-dept-plp-empty">' +
        esc(__searchT("search.no_products", "Bu aramaya uygun ürün yok.")) +
        "</p>";
      return;
    }
    if (!hits.length) {
      grid.innerHTML =
        '<p class="eq-dept-plp-empty">' +
        esc(__searchT("search.no_filter_match", "Seçili filtrelere uygun ürün yok.")) +
        "</p>";
      return;
    }

    var addLbl = __searchT("plp.add_to_cart", "SEPETE EKLE");
    var imgPh = __searchT("search.image_ph", "Görsel");

    grid.innerHTML = hits
      .map(function (h) {
        var href = productHref(h);
        var rawImg = h.image ? String(h.image).replace(/\\/g, "/") : "";
        var src = imgSrc(h);
        var cartBtn =
          window.EqustoCart && window.EqustoCart.cartAddButtonAttrs
            ? '<button class="eq-dept-plp-card__btn" ' +
              window.EqustoCart.cartAddButtonAttrs({
                b: h.brand,
                n: h.name,
                p: h.price,
                c: h.dept || "",
                img: src,
              }) +
              ' data-eq-cart-toast="1"' +
              ">" +
              esc(addLbl) +
              "</button>"
            : "";
        return (
          '<article class="eq-dept-plp-card">' +
          '<a class="eq-dept-plp-card__img" href="' +
          esc(href) +
          '">' +
          (src
            ? '<img src="' +
              esc(src) +
              '"' +
              (rawImg
                ? ' data-eq-img-raw="' + esc(rawImg) + '" data-eq-img-step="0"'
                : "") +
              ' alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
            : '<span class="eq-dept-plp-card__ph">' + esc(imgPh) + "</span>") +
          "</a>" +
          '<a class="eq-dept-plp-card__name" href="' +
          esc(href) +
          '">' +
          esc(h.name || "") +
          "</a>" +
          (function () {
            var brandLab = plpBrandForHit(h);
            return brandLab
              ? '<div class="eq-dept-plp-card__brand">' + esc(brandLab) + "</div>"
              : "";
          })() +
          (function () {
            var dim = formatOlculerLine(h);
            return dim ? '<div class="eq-dept-plp-card__dims">' + esc(dim) + "</div>" : "";
          })() +
          (h.price || h.satis_eur_indirimli
            ? '<div class="eq-dept-plp-card__price">' + esc(formatPrice(h)) + "</div>"
            : "") +
          cartBtn +
          "</article>"
        );
      })
      .join("");

    try {
      if (window.EqustoProductTint && typeof window.EqustoProductTint.refreshPlp === "function") {
        window.EqustoProductTint.refreshPlp(grid);
      } else {
        document.dispatchEvent(new CustomEvent("equsto:plp-grid-updated", { detail: { root: grid } }));
      }
    } catch (_) {}
  }

  function renderAllNow() {
    var q = lastRender.q;
    var hits = filteredHits();
    var title = document.getElementById("eq-arama-title");
    var count = document.getElementById("eq-arama-count");
    var filterCount = document.getElementById("eq-arama-filter-count");

    syncPageTitle(q);

    if (title) {
      title.textContent = q
        ? __searchT("search.results_for", "Arama sonuçları")
        : __searchT("search.title", "Arama");
    }
    if (count) {
      if (lastRender.err) count.textContent = lastRender.err;
      else if (!q) count.textContent = __searchT("search.enter_keyword", "Anahtar kelime girin.");
      else if (!sourceHits.length)
        count.textContent = __searchT("search.no_results_for", "«{q}» için sonuç bulunamadı.", { q: q });
      else {
        count.textContent = __searchT("search.results_count_q", "«{q}» — {n} sonuç", {
          q: q,
          n: lastRender.total != null ? lastRender.total : sourceHits.length,
        });
        if (lastRender.warning) count.textContent += " — " + lastRender.warning;
      }
    }
    if (filterCount) {
      if (!q || !sourceHits.length) {
        filterCount.textContent = "";
      } else if (hasActiveFilters()) {
        filterCount.innerHTML =
          "<strong>" +
          hits.length +
          "</strong> / " +
          (lastRender.total != null ? lastRender.total : sourceHits.length) +
          " " +
          esc(__searchT("search.filtered_shown", "gösteriliyor"));
      } else {
        filterCount.innerHTML =
          "<strong>" +
          (lastRender.total != null ? lastRender.total : sourceHits.length) +
          "</strong> " +
          esc(__searchT("search.products", "ürün"));
      }
    }

    renderFacets();
    renderSelectedChips();
    renderGrid(hits, q, lastRender.err);
    renderMoreButton(q, lastRender.hasMore);
  }

  function renderAll() {
    if (renderAllRaf) cancelAnimationFrame(renderAllRaf);
    renderAllRaf = requestAnimationFrame(function () {
      renderAllRaf = 0;
      renderAllNow();
    });
  }

  function fetchPage(q, offset, replace) {
    if (loadMoreBusy) {
      if (!replace) return;
      if (lastBootQ === q && sourceHits.length > 0) return;
      if (searchFetchCtrl) {
        try {
          searchFetchCtrl.abort();
        } catch (_) {}
      }
      loadMoreBusy = false;
    }
    if (searchFetchCtrl) {
      try {
        searchFetchCtrl.abort();
      } catch (_) {}
    }
    searchFetchCtrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    loadMoreBusy = true;
    var grid = document.getElementById("eq-arama-grid");
    if (replace && grid) {
      grid.innerHTML =
        '<p class="eq-dept-plp-status">' +
        esc(__searchT("search.searching", "Aranıyor…")) +
        "</p>";
    } else {
      var btn = document.getElementById("eq-arama-more-btn");
      if (btn) btn.disabled = true;
    }

    var fetchOpts = { headers: { Accept: "application/json" } };
    if (searchFetchCtrl) fetchOpts.signal = searchFetchCtrl.signal;

    fetch(
      "/api/search?q=" +
        encodeURIComponent(q) +
        "&limit=" +
        PAGE_SIZE +
        "&offset=" +
        offset +
        "&" +
        buildFacetQueryParams(),
      fetchOpts
    )
      .then(function (r) {
        return r.json().then(function (data) {
          return { ok: r.ok, data: data };
        });
      })
      .then(function (res) {
        if (!res.ok || res.data.error) {
          lastRender = {
            q: q,
            total: 0,
            err: res.data.error || __searchT("search.service_unavailable", "Arama servisi kullanılamıyor."),
            warning: "",
            hasMore: false,
          };
          if (replace) {
            sourceHits = [];
            serverFacets = null;
            resetFilters();
          }
          renderAll();
          return;
        }

        var rawHits = res.data.hits || [];
        var warn = res.data.warning ? String(res.data.warning) : "";
        var total = res.data.estimatedTotalHits;
        var hasMore = !!res.data.hasMore;

        if (replace) {
          if (!hasActiveFilters()) {
            resetFilters();
          }
          sourceHits = sortHitsWithImagesFirst(rawHits);
        } else {
          sourceHits = dedupeHits(sourceHits.concat(rawHits));
        }
        serverFacets = res.data.facets || serverFacets;

        lastRender = { q: q, total: total, err: null, warning: warn, hasMore: hasMore };
        renderAll();
        enrichHitsAsync(rawHits, replace);
      })
      .catch(function (e) {
        if (e && e.name === "AbortError") return;
        lastRender = {
          q: q,
          total: 0,
          err: e && e.message ? e.message : __searchT("search.connection_error", "Bağlantı hatası"),
          warning: "",
          hasMore: false,
        };
        if (replace) {
          sourceHits = [];
          serverFacets = null;
          resetFilters();
        }
        renderAll();
      })
      .finally(function () {
        loadMoreBusy = false;
      });
  }

  function bindUi() {
    if (uiBound) return;
    uiBound = true;
    bindFacetEvents();

    var sortEl = document.getElementById("eq-arama-sort");
    if (sortEl) {
      sortEl.addEventListener("change", function () {
        filterState.sort = sortEl.value || "";
        renderAll();
      });
    }

    var mob = document.getElementById("eq-arama-filter-mob");
    var bd = document.getElementById("eq-arama-filter-backdrop");
    if (mob) {
      mob.addEventListener("click", function () {
        document.body.classList.toggle("eq-dept-filter-open");
      });
    }
    if (bd) {
      bd.addEventListener("click", function () {
        document.body.classList.remove("eq-dept-filter-open");
      });
    }

    var clearAll = document.getElementById("eq-arama-clear-all");
    if (clearAll) {
      clearAll.addEventListener("click", function () {
        resetFilters();
        refetchWithFilters();
      });
    }
  }

  function isAramaPath() {
    var p = String(location.pathname || "").replace(/\/$/, "");
    return p === "/arama" || p === "/en/search";
  }

  function waitForGrid(cb, attempt) {
    attempt = attempt || 0;
    if (document.getElementById("eq-arama-grid")) {
      cb();
      return;
    }
    if (attempt >= 240) return;
    requestAnimationFrame(function () {
      waitForGrid(cb, attempt + 1);
    });
  }

  function load() {
    bindUi();
    var q = getQuery();
    if (typeof window.eqClearHeaderSearchInput === "function") {
      window.eqClearHeaderSearchInput();
    }

    if (!q) {
      lastRender = { q: "", total: 0, err: null, warning: "", hasMore: false };
      sourceHits = [];
      resetFilters();
      renderAll();
      return;
    }

    var queryChanged = lastBootQ !== q;
    if (queryChanged) {
      loadMoreBusy = false;
      sourceHits = [];
      resetFilters();
      lastBootQ = q;
      fetchPage(q, 0, true);
      return;
    }

    if (sourceHits.length > 0 && lastRender.q === q && !lastRender.err) {
      renderAll();
      return;
    }

    fetchPage(q, 0, true);
  }

  function bootAramaPage() {
    /* KİLİT: arama-history-KILIT.txt — popstate + lastBootQ */
    if (!isAramaPath()) {
      lastBootQ = null;
      try {
        sessionStorage.removeItem("eq_hdr_search_q");
      } catch (_) {}
      window.__eqHdrLastQ = "";
      return;
    }
    waitForGrid(load);
  }

  window.__eqAramaBoot = bootAramaPage;

  document.addEventListener("equsto:kur-updated", function () {
    if (lastRender.q) renderAll();
  });

  window.addEventListener("equsto:i18n-ready", function () {
    if (lastRender.q || sourceHits.length || getQuery()) renderAll();
  });

  window.addEventListener("popstate", bootAramaPage);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAramaPage);
  } else {
    bootAramaPage();
  }
})();
