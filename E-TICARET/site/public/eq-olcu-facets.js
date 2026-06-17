/**
 * Tezgah / davlumbaz — ölçü filtreleri (arama + /shop/tezgah, /shop/davlumbaz PLP).
 */
(function (global) {
  "use strict";

  var OZTI_PANEL_DIMS_MM = {
    "7919.CR1517.00": [1500, 1750, 2400],
    "7919.CR2022.00": [2000, 2250, 2400],
    "7919.CR2517.00": [2500, 1750, 2400],
    "7919.CR3017.00": [3000, 1750, 2400],
    "7919.DF1517.00": [1500, 1750, 2400],
    "7919.DF2015.00": [2500, 1500, 2400],
    "7919.DF2020.00": [2000, 2250, 2400],
    "7919.DF2022.00": [2000, 2000, 2400],
    "7919.DF2517.00": [2500, 1750, 2400],
    "7919.DF3017.00": [3000, 1750, 2400],
  };

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
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

  function dimLabelFromMm(g, d, y) {
    if (!g || !d || !y) return "";
    if (g >= 1000 && d >= 1000) {
      return Math.round(g / 10) + "×" + Math.round(d / 10) + "×" + Math.round(y / 10) + " cm";
    }
    return g + "×" + d + "×" + y + " mm";
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

  function tripleFromNameMm(name, tezgah) {
    var s = String(name || "");
    var mStar3 = s.match(/(\d{2,4})\*(\d{2,3})\*(\d{2,4})/);
    if (mStar3) {
      return [
        +mStar3[1] * (tezgah ? 10 : 10),
        +mStar3[2] * 10,
        +mStar3[3] * (tezgah ? 10 : 10),
      ];
    }
    var mCm = s.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*cm\b/i);
    if (mCm) return [+mCm[1] * 10, +mCm[2] * 10, +mCm[3] * 10];
    var mMm = s.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*mm\.?/i);
    if (mMm) return [+mMm[1], +mMm[2], +mMm[3]];
    return null;
  }

  function parseTezgahDimsFromName(name) {
    var t = tripleFromNameMm(name, true);
    if (t) return t;
    var s = String(name || "");
    var pairs = [];
    var re2 = /(\d{2,4})\*(\d{2,3})(?!\*\d)/g;
    var m2;
    while ((m2 = re2.exec(s))) {
      pairs.push([+m2[1], +m2[2]]);
    }
    if (pairs.length) {
      pairs.sort(function (a, b) {
        return b[0] - a[0] || b[1] - a[1];
      });
      var p = pairs[0];
      return [p[0] * 10, p[1] * 10, 850];
    }
    var mLik = s.match(/(?:^|\s)(\d{2,3})\s*L[IİI]K(?:\s|$)/i);
    if (mLik) {
      var w = Number(mLik[1]) * 10;
      var dep = /700\s*SER/i.test(s) ? 700 : 600;
      return [w, dep, 850];
    }
    var mLen = s.match(/(?:^|[^\d.])(\d{3,4})\s*mm\b/i);
    if (mLen) return [+mLen[1], 700, 900];
    var m2x = s.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})(?:\s*cm|\b)/i);
    if (m2x) return [+m2x[1] * 10, +m2x[2] * 10, 850];
    return null;
  }

  function parseOztiSkuDims(sku) {
    var k = String(sku || "")
      .trim()
      .toUpperCase();
    var m = k.match(/\.N\d\.(\d{5})\.\d{2}$/);
    if (!m) return null;
    var code = m[1];
    var g = Number(code.slice(0, 2)) * 100;
    var d = Number(code.slice(2, 4)) * 100;
    var y = Number(code.slice(4, 5)) * 100;
    if (g >= 400 && d >= 300 && y >= 100) return [g, d, y];
    return null;
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
    if (g && d && y) return [g, d, y];
    if (g && d) return [g, d, y || 850];
    if (g) return [g, d || 700, y || 850];
    return null;
  }

  function parseDimsFromSpecsOlcu(raw, tezgah) {
    var lines = specLinesFromRaw(raw);
    for (var i = 0; i < lines.length; i++) {
      var t = String(lines[i] || "");
      var mCm = t.match(
        /Ölçü\s*\(cm\):\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})/i,
      );
      if (mCm) return [+mCm[1] * 10, +mCm[2] * 10, +mCm[3] * 10];
      var mMm = t.match(
        /Ebat\s*\(mm\):\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})/i,
      );
      if (mMm) return [+mMm[1], +mMm[2], +mMm[3]];
    }
    return null;
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
    if (g && d && y) return [g, d, y];
    return null;
  }

  function oztiPanelDimsFromSku(sku) {
    var k = String(sku || "")
      .trim()
      .toUpperCase();
    if (!k) return null;
    if (OZTI_PANEL_DIMS_MM[k]) return OZTI_PANEL_DIMS_MM[k].slice();
    var m = k.match(/^7919\.(DF|CR)(\d{2})(\d{2})\.00$/);
    if (!m) return null;
    return [Number(m[2]) * 100, Number(m[3]) * 100, 2400];
  }

  function isOztiBrandRow(raw) {
    if (!raw) return false;
    var b = lc(raw.brand || raw.oem_brand || "");
    return b.indexOf("oztiryakiler") >= 0 || b.indexOf("öztiryakiler") >= 0;
  }

  function tripleFromLabel(s) {
    var t = String(s || "");
    var m3mm = t.match(/(\d+)\s*×\s*(\d+)\s*×\s*(\d+)\s*mm/i);
    if (m3mm) return [+m3mm[1], +m3mm[2], +m3mm[3]];
    var m3cm = t.match(/(\d+)\s*×\s*(\d+)\s*×\s*(\d+)\s*cm/i);
    if (m3cm) return [+m3cm[1] * 10, +m3cm[2] * 10, +m3cm[3] * 10];
    return null;
  }

  function rawHit(hit) {
    return (hit && hit.raw) || hit || {};
  }

  function productName(hit) {
    if (!hit) return "";
    return String(hit.name || hit.n || "").trim();
  }

  function dimsFromHit(hit, dept) {
    var raw = rawHit(hit);
    var name = productName(hit) || String(raw.name || "");
    var isTezgah = dept === "tezgah";

    if (raw.olcu_etiket) {
      var fromEtiket = tripleFromLabel(raw.olcu_etiket);
      if (fromEtiket) return fromEtiket;
    }

    if (isTezgah) {
      var tezgahName = parseTezgahDimsFromName(name);
      if (tezgahName) return tezgahName;
      var tezgahSku = parseOztiSkuDims(raw.sku || raw.model || raw.urun_kodu);
      if (tezgahSku) return tezgahSku;
      var tezgahTeknik = parseDimsFromTeknik(raw);
      if (tezgahTeknik) return tezgahTeknik;
    }

    var o = raw.olculer;
    if (o) {
      var g = Number(o.genislik_mm);
      var d = Number(o.derinlik_mm);
      var y = Number(o.yukseklik_mm);
      if (g && d && y) {
        var nameHasDim = /[xX×*]\s*\d/.test(name);
        var looksLikeSink = isTezgah && g < 800;
        if (!nameHasDim && !looksLikeSink) return [g, d, y];
      }
    }

    var fromSpecs = parseDimsFromSpecsOlcu(raw, isTezgah);
    if (fromSpecs) return fromSpecs;

    var fromName = tripleFromNameMm(name, isTezgah);
    if (fromName) return fromName;

    if (isOztiBrandRow(raw)) {
      var oztiWeb = parseOztiEnBoyDims(raw);
      if (oztiWeb) return oztiWeb;
      var oztiTeknik = parseDimsFromTeknik(raw);
      if (oztiTeknik) return oztiTeknik;
    }

    var panel = oztiPanelDimsFromSku(raw.sku || raw.model || raw.urun_kodu);
    if (panel) return panel;

    return null;
  }

  function keyFromDims(dims) {
    if (!dims || dims.length < 3) return null;
    var g = Math.round(dims[0]);
    var d = Math.round(dims[1]);
    var y = Math.round(dims[2]);
    if (!g || !d || !y) return null;
    return g + "-" + d + "-" + y;
  }

  function parseKey(key) {
    var m = String(key || "").match(/^(\d+)-(\d+)-(\d+)$/);
    if (!m) return null;
    return [+m[1], +m[2], +m[3]];
  }

  function labelFromKey(key, dept) {
    var dims = parseKey(key);
    if (!dims) return key;
    if (dept === "tezgah") return dimLabelTezgahFromMm(dims[0], dims[1], dims[2]);
    return dimLabelFromMm(dims[0], dims[1], dims[2]);
  }

  function facetKeyFromHit(hit, dept) {
    return keyFromDims(dimsFromHit(hit, dept));
  }

  function hitMatchesAnyFacet(hit, keys, dept) {
    if (!keys || !keys.length) return true;
    var k = facetKeyFromHit(hit, dept);
    return k ? keys.indexOf(k) >= 0 : false;
  }

  function countFacets(hits, dept) {
    var out = Object.create(null);
    if (!Array.isArray(hits)) return out;
    hits.forEach(function (h) {
      var k = facetKeyFromHit(h, dept);
      if (k) out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  function sortKeys(keys) {
    return (keys || []).slice().sort(function (a, b) {
      var da = parseKey(a);
      var db = parseKey(b);
      if (!da || !db) return String(a).localeCompare(String(b), "tr");
      if (da[0] !== db[0]) return da[0] - db[0];
      if (da[1] !== db[1]) return da[1] - db[1];
      return da[2] - db[2];
    });
  }

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function renderFacetListHtml(opts) {
    opts = opts || {};
    var dept = opts.dept || "tezgah";
    var counts = opts.counts || {};
    var selected = opts.selected || [];
    var inputName = opts.inputName || "eq-dept-cm-olcu";
    var keys = sortKeys(
      Object.keys(counts).filter(function (k) {
        return counts[k] > 0;
      }),
    );
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "Ölçü") +
      '</summary><div class="eq-cm-facet__body">' +
      '<input type="search" class="eq-cm-facet__search" id="eq-dept-cm-olcu-q" placeholder="' +
      escHtml(opts.searchPlaceholder || "Ölçü ara") +
      '" autocomplete="off">' +
      '<ul class="eq-cm-facet__list" id="eq-dept-cm-olcu-list">';
    keys.forEach(function (k) {
      var lbl = labelFromKey(k, dept);
      var checked = selected.indexOf(k) >= 0 ? " checked" : "";
      html +=
        '<li class="eq-cm-facet__item" data-olcu-label="' +
        escHtml(lc(lbl)) +
        '"><label class="eq-cm-facet__label">' +
        '<input type="checkbox" name="' +
        escHtml(inputName) +
        '" value="' +
        escHtml(k) +
        '"' +
        checked +
        "><span>" +
        escHtml(lbl) +
        '</span><span class="eq-cm-facet__count">(' +
        counts[k] +
        ")</span></label></li>";
    });
    html += "</ul></div></details>";
    return html;
  }

  global.EqOlcuFacets = {
    dimsFromHit: dimsFromHit,
    facetKeyFromHit: facetKeyFromHit,
    labelFromKey: labelFromKey,
    hitMatchesAnyFacet: hitMatchesAnyFacet,
    countFacets: countFacets,
    sortKeys: sortKeys,
    renderFacetListHtml: renderFacetListHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
