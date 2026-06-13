/**
 * Buzdolabı / derin dondurucu — tip filtreleri (arama + /shop/sogutma PLP).
 */
(function (global) {
  "use strict";

  var FACET_ORDER = [
    "tezgah-cekmeceli",
    "dik-derin-dondurucu",
    "dik-buzdolabi",
    "tezgah-tipi",
    "yatay-derin-dondurucu",
    "yatay-buzdolabi",
  ];

  var FACET_LABELS = {
    "tezgah-cekmeceli": "Tezgah tipi çekmeceli",
    "dik-derin-dondurucu": "Dik tip derin dondurucu",
    "dik-buzdolabi": "Dik tip buzdolabı",
    "tezgah-tipi": "Tezgah tipi buzdolabı",
    "yatay-derin-dondurucu": "Yatay / set altı derin dondurucu",
    "yatay-buzdolabi": "Yatay / set altı buzdolabı",
  };

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function productHaystack(hit) {
    if (!hit) return "";
    return lc(
      [
        hit.name,
        hit.n,
        hit.category,
        hit.c,
        hit.brand,
        hit.b,
        hit.specs,
        hit.raw && hit.raw.name,
        hit.raw && hit.raw.category,
        hit.raw && hit.raw.specs,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  function productName(hit) {
    if (!hit) return "";
    return String(hit.name || hit.n || "").trim();
  }

  function isExcludedBuzdolapNoise(hay) {
    if (/buz\s*makin|ice\s*maker|küp\s*buz|kup\s*buz|buz\s*konteyner|nugget\s*buz/.test(hay)) {
      return true;
    }
    if (/panel\s*tip\s*(soğuk|soguk|derin)|soğuk\s*oda|soguk\s*oda|split\s*soğut|split\s*sogut/.test(hay)) {
      return true;
    }
    if (/blast\s*chill|şok\s*soğut|sok\s*sogut|dry\s*age|şarap\s*dolab|sarap\s*dolab|wine\s*cool/.test(hay)) {
      return true;
    }
    if (/servis\s*raf/.test(hay) && !/buzdolab|derin|donduruc/.test(hay)) return true;
    return false;
  }

  function isBuzdolapProduct(hit) {
    var hay = productHaystack(hit);
    if (!hay || isExcludedBuzdolapNoise(hay)) return false;
    if (/buzdolab|buzdolap/.test(hay)) return true;
    if (/derin\s*dondurucu/.test(hay)) return true;
    if (/tezgah\s*tip.*buzdolab|make\s*up.*buzdolab|soğutmalı\s*tezgah|sogutmali\s*tezgah/.test(hay)) {
      return true;
    }
    if (/\bdik\s*tip\b/.test(hay) && /buzdolab|derin|dondurucu/.test(hay)) return true;
    if (/\byatay\s*tip\b/.test(hay) && /buzdolab|derin|dondurucu/.test(hay)) return true;
    return false;
  }

  function classifyFacet(hit) {
    if (!isBuzdolapProduct(hit)) return null;
    var hay = productHaystack(hit);

    if (/çekmece|cekmeceli|cekmece/.test(hay)) return "tezgah-cekmeceli";

    if (
      /dik\s*tip.*derin|dik\s*tip.*donduruc|derin\s*dondurucu.*dik\s*tip/.test(hay) ||
      (/\bdik\s*tip\b/.test(hay) && /derin|dondurucu/.test(hay) && !/buzdolab/.test(hay))
    ) {
      return "dik-derin-dondurucu";
    }

    if (
      /dik\s*tip.*buzdolab/.test(hay) ||
      (/\bdik\s*tip\b/.test(hay) && /buzdolab/.test(hay) && !/derin|dondurucu/.test(hay)) ||
      (/\bgn\s*\d+\s*nmv\b/.test(hay) && /buzdolab/.test(hay))
    ) {
      return "dik-buzdolabi";
    }

    if (
      /tezgah\s*tip|tezgahalt|tezgah\s*alt|make\s*up|saladette|pizza\s*haz|soğutmalı\s*tezgah|sogutmali\s*tezgah|hazırlık\s*dolab|hazirlik\s*dolab/.test(
        hay,
      )
    ) {
      return "tezgah-tipi";
    }

    if (
      /yatay\s*tip.*derin|yatay\s*tip.*donduruc|(\btag\s*\d+\s*lmv\b|\bta\s*\d+\s*lmv\b).*(derin|dondurucu)/.test(
        hay,
      )
    ) {
      return "yatay-derin-dondurucu";
    }

    if (/yatay\s*tip.*buzdolab|(\btag\s*\d+\s*nmv\b|\bta\s*\d+\s*nmv\b)/.test(hay)) {
      return "yatay-buzdolabi";
    }

    if (/buzdolab/.test(hay) && !/derin|dondurucu/.test(hay)) return "dik-buzdolabi";
    if (/derin|dondurucu/.test(hay)) return "yatay-derin-dondurucu";
    return null;
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
    var inputName = opts.inputName || "eq-buzdolap-tip";
    var keys = sortKeys(
      Object.keys(counts).filter(function (k) {
        return counts[k] > 0;
      }),
    );
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "Buzdolabı tipi") +
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

  global.EqBuzdolapFacets = {
    classifyFacet: classifyFacet,
    facetKeyFromHit: facetKeyFromHit,
    labelFromKey: labelFromKey,
    hitMatchesFacet: hitMatchesFacet,
    hitMatchesAnyFacet: hitMatchesAnyFacet,
    isBuzdolapProduct: isBuzdolapProduct,
    countFacets: countFacets,
    sortKeys: sortKeys,
    renderFacetListHtml: renderFacetListHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
