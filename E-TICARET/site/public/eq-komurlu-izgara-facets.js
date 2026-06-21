/**
 * Kömürlü Izgaralar (?tip=kati-yakitli-izgaralar) — ürün grubu filtreleri.
 */
(function (global) {
  "use strict";

  var FACET_ORDER = [
    "barbekuler",
    "davlumbazli-barbekuler",
    "setustu-barbekuler",
    "multi-set-barbekuler",
    "komurlu-firinlar",
    "tutsuleme-firinlari",
    "yakitori",
    "asansorlu-mangal",
    "kebap-steak",
    "robata",
    "elektrikli-gazli-izgaralar",
    "diger",
  ];

  var FACET_LABELS = {
    barbekuler: "Barbeküler",
    "davlumbazli-barbekuler": "Davlumbazlı Barbeküler",
    "setustu-barbekuler": "Setüstü Barbeküler",
    "multi-set-barbekuler": "Multi Set Barbeküler",
    "komurlu-firinlar": "Kömürlü Fırınlar",
    "tutsuleme-firinlari": "Tütsüleme Fırınları",
    yakitori: "Yakitori",
    "asansorlu-mangal": "Asansörlü Mangal",
    "kebap-steak": "Kebap & Steak",
    robata: "Robata",
    "elektrikli-gazli-izgaralar": "Elektrikli & Gazlı Izgaralar",
    diger: "Diğer",
  };

  var NPICCO_CAT_MAP = {
    Barbeküler: "barbekuler",
    "Davlumbazlı Barbeküler": "davlumbazli-barbekuler",
    "Kömürlü Fırınlar": "komurlu-firinlar",
    "Setüstü Barbeküler": "setustu-barbekuler",
    "Tütsüleme Fırınları": "tutsuleme-firinlari",
    Yakitori: "yakitori",
    "Multi Set Barbeküler": "multi-set-barbekuler",
    "Elektrikli & Gazlı Izgaralar": "elektrikli-gazli-izgaralar",
  };

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function productCategory(hit) {
    if (!hit) return "";
    return String(hit.category || hit.c || (hit.raw && hit.raw.category) || "").trim();
  }

  function isKomurluIzgaraProduct(hit) {
    return productCategory(hit) === "kati-yakitli-izgaralar";
  }

  function classifySparo(hit) {
    var n = lc(
      [hit.name, hit.n, hit.raw && hit.raw.name, hit.raw && hit.raw.specs].filter(Boolean).join(" "),
    );
    if (/smoker|tütsü|tutsu/.test(n)) return "tutsuleme-firinlari";
    if (/robata/.test(n)) return "robata";
    if (/asansör|asansor/.test(n)) return "asansorlu-mangal";
    if (/kebap|steak/.test(n)) return "kebap-steak";
    if (/fırın|firin/.test(n)) return "komurlu-firinlar";
    if (/yakitori/.test(n)) return "yakitori";
    if (/barbek|bbq|mangal|asado/.test(n)) return "barbekuler";
    return "diger";
  }

  function classifyFacet(hit) {
    if (!isKomurluIzgaraProduct(hit)) return null;
    var raw = hit.raw || hit;
    var npiccoKat = raw.npicco_kategori ? String(raw.npicco_kategori).trim() : "";
    if (npiccoKat && NPICCO_CAT_MAP[npiccoKat]) return NPICCO_CAT_MAP[npiccoKat];
    if (raw.kaynak === "sparo-web") return classifySparo(hit);
    return "diger";
  }

  function facetKeyFromHit(hit) {
    return classifyFacet(hit);
  }

  function labelFromKey(key) {
    return FACET_LABELS[key] || key;
  }

  function hitMatchesFacet(hit, key) {
    return facetKeyFromHit(hit) === key;
  }

  function hitMatchesAnyFacet(hit, keys) {
    if (!keys || !keys.length) return true;
    var k = facetKeyFromHit(hit);
    return k ? keys.indexOf(k) >= 0 : false;
  }

  function countFacets(hits) {
    var out = Object.create(null);
    if (!Array.isArray(hits)) return out;
    hits.forEach(function (h) {
      var k = facetKeyFromHit(h);
      if (k) out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  function sortKeys(keys) {
    return (keys || []).slice().sort(function (a, b) {
      var ia = FACET_ORDER.indexOf(a);
      var ib = FACET_ORDER.indexOf(b);
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      if (ia !== ib) return ia - ib;
      return String(a).localeCompare(String(b), "tr");
    });
  }

  function renderFacetListHtml(opts) {
    opts = opts || {};
    var counts = opts.counts || {};
    var selected = opts.selected || [];
    var inputName = opts.inputName || "eq-dept-cm-komurlu-grup";
    var keys = sortKeys(
      Object.keys(counts).filter(function (k) {
        return counts[k] > 0;
      }),
    );
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "Ürün grubu") +
      '</summary><div class="eq-cm-facet__body"><ul class="eq-cm-facet__list">';
    keys.forEach(function (k) {
      var checked = selected.indexOf(k) >= 0 ? " checked" : "";
      html +=
        '<li class="eq-cm-facet__item"><label class="eq-cm-facet__label">' +
        '<input type="checkbox" name="' +
        escHtml(inputName) +
        '" value="' +
        escHtml(k) +
        '"' +
        checked +
        "><span>" +
        escHtml(labelFromKey(k)) +
        '</span><span class="eq-cm-facet__count">(' +
        counts[k] +
        ")</span></label></li>";
    });
    html += "</ul></div></details>";
    return html;
  }

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function activeKomurluIzgaraTip(state) {
    var active = (state && state.activeTiles) || [];
    return active.indexOf("kati-yakitli-izgaralar") >= 0;
  }

  function isKomurluIzgaraKaynak(hit) {
    var k = hit && hit.raw && hit.raw.kaynak;
    return k === "sparo-web" || k === "npicco-web";
  }

  function isKomurluIzgaraBrand(brand) {
    var b = String(brand || "").trim();
    return b === "Sparo" || b === "Npicco";
  }

  global.EqKomurluIzgaraFacets = {
    classifyFacet: classifyFacet,
    facetKeyFromHit: facetKeyFromHit,
    labelFromKey: labelFromKey,
    hitMatchesFacet: hitMatchesFacet,
    hitMatchesAnyFacet: hitMatchesAnyFacet,
    isKomurluIzgaraProduct: isKomurluIzgaraProduct,
    countFacets: countFacets,
    sortKeys: sortKeys,
    renderFacetListHtml: renderFacetListHtml,
    activeKomurluIzgaraTip: activeKomurluIzgaraTip,
    isKomurluIzgaraKaynak: isKomurluIzgaraKaynak,
    isKomurluIzgaraBrand: isKomurluIzgaraBrand,
  };
})(typeof window !== "undefined" ? window : globalThis);
