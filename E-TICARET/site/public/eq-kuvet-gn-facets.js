/**
 * Gastronorm küvet — GN ölçü filtreleri (arama + /shop/kuvetler PLP).
 */
(function (global) {
  "use strict";

  var GN_ORDER = ["2/1", "1/1", "2/3", "2/4", "1/2", "1/3", "1/4", "1/6", "1/9"];
  var DEPTH_ORDER = [20, 40, 55, 65, 100, 150, 200];
  var VARIANT_ORDER = [
    "standart",
    "delikli",
    "sapli",
    "yapismaz",
    "kose",
    "kose-delikli",
    "kose-sapli",
    "polipropilen",
    "polikarbonat",
    "kapak-pp",
    "kapak-pc",
  ];
  var VARIANT_SUFFIX = {
    standart: "",
    delikli: " delikli",
    sapli: " saplı",
    kose: " köşe",
    "kose-delikli": " delikli köşe",
    "kose-sapli": " saplı köşe",
    yapismaz: " yapışmaz",
    polipropilen: " PP",
    polikarbonat: " PC",
    "kapak-pp": " kapak PP",
    "kapak-pc": " kapak PC",
  };

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function gnRank(gn) {
    var i = GN_ORDER.indexOf(gn);
    return i >= 0 ? i : 99;
  }

  function depthRank(d) {
    var i = DEPTH_ORDER.indexOf(d);
    return i >= 0 ? i : 99;
  }

  function variantRank(v) {
    var i = VARIANT_ORDER.indexOf(v);
    return i >= 0 ? i : 99;
  }

  function parseGnSize(t) {
    var m = t.match(/gn\s*(\d)\s*\/\s*(\d)/i);
    if (m) return m[1] + "/" + m[2];
    m = t.match(/(?:^|[\s\-])(\d)\s*\/\s*(\d)(?:\s|-)/);
    return m ? m[1] + "/" + m[2] : null;
  }

  function parseDepth(t) {
    var m = t.match(/[\s\-]0?(20|40|55|65|100|150|200)(?:\s|$|[^0-9])/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function parseVariant(t) {
    if (/kapak/.test(t) && /polipropilen|poliprop/.test(t)) return "kapak-pp";
    if (/kapak/.test(t) && /policarbon|polikarbon/.test(t)) return "kapak-pc";
    if (/polipropilen/.test(t) && !/kapak/.test(t)) return "polipropilen";
    if (/policarbon|polikarbon/.test(t) && !/kapak/.test(t)) return "polikarbonat";
    if (/yapismaz|yapışmaz/.test(t)) return "yapismaz";
    if (/delikli/.test(t) && /kose|köşe/.test(t)) return "kose-delikli";
    if (/sapl[ıi]/.test(t) && /kose|köşe/.test(t)) return "kose-sapli";
    if (/delikli/.test(t)) return "delikli";
    if (/sapl[ıi]/.test(t)) return "sapli";
    if (/kose|köşe/.test(t)) return "kose";
    return "standart";
  }

  function productName(hit) {
    if (!hit) return "";
    return String(hit.name || hit.n || "").trim();
  }

  function isGnKuvetProduct(hit) {
    var name = productName(hit);
    if (!name) return false;
    if (global.EqDeptTips && typeof global.EqDeptTips.isKuvetProduct === "function") {
      return global.EqDeptTips.isKuvetProduct({
        n: name,
        c: hit.category || hit.c || "",
        raw: hit.raw || hit,
      });
    }
    var t = lc(name);
    return /gastronom.*k[uü]vet|k[uü]vet.*gn|gn\s*\d\s*\/\s*\d/.test(t);
  }

  function facetFromHit(hit) {
    var name = productName(hit);
    if (!name || !isGnKuvetProduct(hit)) return null;
    var t = lc(name);
    var gn = parseGnSize(t);
    var depth = parseDepth(t);
    if (!gn || depth == null) return null;
    var variant = parseVariant(t);
    return {
      key: variant + ":gn-" + gn.replace("/", "-") + "-" + depth,
      gn: gn,
      depth: depth,
      variant: variant,
    };
  }

  function facetKeyFromHit(hit) {
    var f = facetFromHit(hit);
    return f ? f.key : null;
  }

  function parseKey(key) {
    var m = String(key || "").match(/^([^:]+):gn-(\d)-(\d)-(\d+)$/);
    if (!m) return null;
    return {
      key: key,
      variant: m[1],
      gn: m[2] + "/" + m[3],
      depth: parseInt(m[4], 10),
    };
  }

  function labelFromKey(key) {
    var f = parseKey(key);
    if (!f) return key;
    var suffix = VARIANT_SUFFIX[f.variant] || "";
    return "GN " + f.gn + " " + f.depth + suffix;
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
      var fa = parseKey(a);
      var fb = parseKey(b);
      if (!fa || !fb) return String(a).localeCompare(String(b), "tr");
      var vr = variantRank(fa.variant) - variantRank(fb.variant);
      if (vr) return vr;
      var gr = gnRank(fa.gn) - gnRank(fb.gn);
      if (gr) return gr;
      return depthRank(fa.depth) - depthRank(fb.depth);
    });
  }

  function renderFacetListHtml(opts) {
    opts = opts || {};
    var counts = opts.counts || {};
    var selected = opts.selected || [];
    var inputName = opts.inputName || "eq-kuvet-gn";
    var keys = sortKeys(
      Object.keys(counts).filter(function (k) {
        return counts[k] > 0;
      }),
    );
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "GN ölçü") +
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

  global.EqKuvetGnFacets = {
    facetFromHit: facetFromHit,
    facetKeyFromHit: facetKeyFromHit,
    labelFromKey: labelFromKey,
    hitMatchesFacet: hitMatchesFacet,
    hitMatchesAnyFacet: hitMatchesAnyFacet,
    isGnKuvetProduct: isGnKuvetProduct,
    countFacets: countFacets,
    sortKeys: sortKeys,
    renderFacetListHtml: renderFacetListHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
