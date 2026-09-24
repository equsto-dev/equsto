/**
 * Kahve ekipmanları PLP — makine tipi + grup sayısı facet’leri.
 * Marka filtresi eq-dept-cm-facets.js içindeki ortak Marka bölümünde.
 */
(function (global) {
  "use strict";

  var MAKINE_ORDER = [
    "espresso-makinesi",
    "tam-otomatik",
    "kahve-degirmeni",
    "filtre-kahve",
    "turk-kahve",
    "barista-aksesuarlari",
  ];

  var MAKINE_LABELS = {
    "espresso-makinesi": "Espresso Makineleri",
    "tam-otomatik": "Tam Otomatik Kahve Makineleri",
    "kahve-degirmeni": "Kahve Değirmenleri",
    "filtre-kahve": "Filtre Kahve Makineleri",
    "turk-kahve": "Türk Kahve Makineleri",
    "barista-aksesuarlari": "Barista Aksesuarları",
  };

  /** Nav / eski ?tip= → makine tipi */
  var TIP_TO_MAKINE = {
    "espresso-makinesi": "espresso-makinesi",
    "kahve-degirmeni": "kahve-degirmeni",
    "filtre-kahve": "filtre-kahve",
    "turk-kahve": "turk-kahve",
    "barista-aksesuarlari": "barista-aksesuarlari",
    "kahve-sut-potlari": "barista-aksesuarlari",
    "tam-otomatik": "tam-otomatik",
    barista: "barista-aksesuarlari",
    "filtre-kahve-makineleri": "filtre-kahve",
    "wmf-kahve-makinalari": "tam-otomatik",
  };

  var GRUP_ORDER = ["1-grup", "2-grup", "3-grup", "4-grup"];

  var GRUP_LABELS = {
    "1-grup": "1 Grup",
    "2-grup": "2 Grup",
    "3-grup": "3 Grup",
    "4-grup": "4 Grup",
  };

  var CATEGORY_MAKINE = {
    "filtre-kahve-makineleri": "filtre-kahve",
    "silindirik-filtre-kahve-makineleri": "filtre-kahve",
    "silindirik-filtre-kahve-makinesi-hazneleri": "filtre-kahve",
    "wmf-kahve-makinalari": "tam-otomatik",
    "espresso-makinesi": "espresso-makinesi",
    "espresso-kahve-makinalari": "espresso-makinesi",
    "espresso-kahve-makineleri-classic": "espresso-makinesi",
    "espresso-kahve-makineleri-aura": "espresso-makinesi",
    "espresso-kahve-makineleri-aura-dosamat-ozellikli": "espresso-makinesi",
    "espresso-kahve-makineleri-aura-dosamat-steamair-ozellikli": "espresso-makinesi",
    "espresso-kahve-makineleri-aura-steamair-ozellikli": "espresso-makinesi",
    "e98-up-s-serisi": "espresso-makinesi",
    "e98-up-a-serisi": "espresso-makinesi",
    "e61-s-serisi": "espresso-makinesi",
    "e61-a-serisi": "espresso-makinesi",
    "e71-touch-a-serisi": "espresso-makinesi",
    "e71-e-a-2": "espresso-makinesi",
    "e71-e-a-serisi": "espresso-makinesi",
    "x20-cs10-x20-s10-x15-cs10": "espresso-makinesi",
    "kahve-de-irmenleri": "kahve-degirmeni",
    "kahve-degirmenleri": "kahve-degirmeni",
    "kahve-sut-potlari": "barista-aksesuarlari",
  };

  function fold(s) {
    return String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .trim();
  }

  function categorySlug(hit) {
    if (!hit) return "";
    return fold(hit.category || hit.c || (hit.raw && hit.raw.category) || "");
  }

  function tipHaystack(hit) {
    if (!hit) return "";
    var raw = hit.raw || {};
    return fold(
      [
        hit.name,
        hit.n,
        hit.brand,
        hit.b,
        hit.fb,
        hit.category,
        hit.c,
        raw.name,
        raw.brand,
        raw.oem_brand,
        raw.category,
        raw.sku,
        raw.model,
        raw.urun_kodu,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  function isTamOtomatik(hay) {
    if (!hay) return false;
    if (/wmf|saeco|bean\s*to\s*cup|cekirdekten\s*fincan|super\s*otomatik/.test(hay)) return true;
    if (/tam\s*otomatik\s*kahve\s*mak|gruplu\s*tam\s*otomatik/.test(hay)) return true;
    if (/1100s|1200s|1300s|1500s|5000s|presto/.test(hay) && /wmf|kahve/.test(hay)) return true;
    return false;
  }

  function classifyMakine(hit) {
    var hay = tipHaystack(hit);
    var cat = categorySlug(hit);
    if (!hay && !cat) return null;

    if (
      /barista|tamper|knock\s*box|posa\s*cekmece|wdt|kahve\s*dagit|sebeke\s*baglanti|filtre\s*kagidi|kahve\s*sut\s*pot|sut\s*potu|pitcher/.test(
        hay,
      )
    ) {
      return "barista-aksesuarlari";
    }
    if (/turk\s*kahve|cezve|kumda\s*kahve|kahve\s*kavurma/.test(hay)) return "turk-kahve";
    /* Değirmen önce — «filtre kahve değirmeni» filtre makinesi değil */
    if (/degirmen|grinder|ogutucu|\bogut\b/.test(hay) && !/1\s*gr\+|2\s*gr\+|grinder\s*\+/.test(hay)) {
      return "kahve-degirmeni";
    }
    if (
      /filtre\s*kahve\s*mak|filtre\s*kahve|fm250|ftl120|\bftl\b|bravilor|batch\s*brew|demleme|animo\s*m|coffeedio|\bbunn\b/.test(
        hay,
      ) &&
      !/degirmen|grinder/.test(hay)
    ) {
      return "filtre-kahve";
    }
    /* Marka/model önce — Öztiryakiler WMF kategorisine Appia/Oscar da düşebiliyor */
    if (/appia|linea|aurelia|faema|sanremo|simonelli|nuosi|oscar|bezzera|cimbali|victoria\s*arduino|\bvbm\b/.test(hay)) {
      return "espresso-makinesi";
    }
    if (isTamOtomatik(hay) || cat === "wmf-kahve-makinalari") return "tam-otomatik";
    if (CATEGORY_MAKINE[cat] && CATEGORY_MAKINE[cat] !== "tam-otomatik") return CATEGORY_MAKINE[cat];
    if (
      /espresso|gruplu\s*kahve|1\s*gruplu|2\s*gruplu|3\s*gruplu|4\s*gruplu|tek\s*grup|cappuccino\s*kahve|barista\s*kahve\s*mak/.test(
        hay,
      )
    ) {
      return "espresso-makinesi";
    }
    if (/kahve\s*makine|kahve\s*makina/.test(hay) && !/filtre|cay\s*mak|demlik/.test(hay)) {
      return "espresso-makinesi";
    }
    if (CATEGORY_MAKINE[cat]) return CATEGORY_MAKINE[cat];
    return null;
  }

  function classifyGrup(hit) {
    var hay = tipHaystack(hit);
    if (!hay) return null;
    /* Sıra: önce 4 → 1 (üst küme yanlış eşleşmesin) */
    if (/\b4\s*grup|\ba\/4\b|\bs\/4\b|dort\s*grup|4\s*group/.test(hay)) return "4-grup";
    if (/\b3\s*grup|\ba\/3\b|\bs\/3\b|uc\s*grup|3\s*group/.test(hay)) return "3-grup";
    if (/\b2\s*grup|\ba\/2\b|\bs\/2\b|iki\s*grup|2\s*group/.test(hay)) return "2-grup";
    if (/\b1\s*grup|\ba\/1\b|\bs\/1\b|tek\s*grup|1\s*group|single\s*group/.test(hay)) return "1-grup";
    return null;
  }

  function makineLabel(key) {
    return MAKINE_LABELS[key] || key;
  }

  function grupLabel(key) {
    return GRUP_LABELS[key] || key;
  }

  function hitMatchesAnyMakine(hit, keys) {
    if (!keys || !keys.length) return true;
    var k = classifyMakine(hit);
    return k ? keys.indexOf(k) >= 0 : false;
  }

  function hitMatchesAnyGrup(hit, keys) {
    if (!keys || !keys.length) return true;
    var k = classifyGrup(hit);
    return k ? keys.indexOf(k) >= 0 : false;
  }

  function countMakine(hits) {
    var out = Object.create(null);
    if (!Array.isArray(hits)) return out;
    hits.forEach(function (h) {
      var k = classifyMakine(h);
      if (k) out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  function countGrup(hits) {
    var out = Object.create(null);
    if (!Array.isArray(hits)) return out;
    hits.forEach(function (h) {
      var k = classifyGrup(h);
      if (k) out[k] = (out[k] || 0) + 1;
    });
    return out;
  }

  function sortMakineKeys(keys) {
    return (keys || []).slice().sort(function (a, b) {
      var ia = MAKINE_ORDER.indexOf(a);
      var ib = MAKINE_ORDER.indexOf(b);
      if (ia < 0) ia = 99;
      if (ib < 0) ib = 99;
      if (ia !== ib) return ia - ib;
      return String(a).localeCompare(String(b), "tr");
    });
  }

  function sortGrupKeys(keys) {
    return (keys || []).slice().sort(function (a, b) {
      return GRUP_ORDER.indexOf(a) - GRUP_ORDER.indexOf(b);
    });
  }

  function escHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function renderListHtml(opts) {
    opts = opts || {};
    var counts = opts.counts || {};
    var selected = opts.selected || [];
    var order = opts.order || [];
    var labels = opts.labels || {};
    var inputName = opts.inputName || "eq-facet";
    var keys = order.filter(function (k) {
      return (counts[k] || 0) > 0;
    });
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "") +
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
        escHtml(labels[k] || k) +
        '</span><span class="eq-cm-facet__count">(' +
        counts[k] +
        ")</span></label></li>";
    });
    html += "</ul></div></details>";
    return html;
  }

  function renderMakineHtml(opts) {
    opts = opts || {};
    return renderListHtml({
      counts: opts.counts,
      selected: opts.selected,
      order: MAKINE_ORDER,
      labels: MAKINE_LABELS,
      inputName: opts.inputName || "eq-dept-cm-kahve-makine",
      title: opts.title || "Makine tipi",
    });
  }

  function renderGrupHtml(opts) {
    opts = opts || {};
    return renderListHtml({
      counts: opts.counts,
      selected: opts.selected,
      order: GRUP_ORDER,
      labels: GRUP_LABELS,
      inputName: opts.inputName || "eq-dept-cm-kahve-grup",
      title: opts.title || "Grup sayısı",
    });
  }

  function normalizeTipToMakine(tip) {
    if (!tip) return "";
    var t = String(tip).trim();
    if (TIP_TO_MAKINE[t]) return TIP_TO_MAKINE[t];
    if (MAKINE_LABELS[t]) return t;
    return "";
  }

  global.EqKahveFacets = {
    classifyMakine: classifyMakine,
    classifyGrup: classifyGrup,
    makineLabel: makineLabel,
    grupLabel: grupLabel,
    hitMatchesAnyMakine: hitMatchesAnyMakine,
    hitMatchesAnyGrup: hitMatchesAnyGrup,
    countMakine: countMakine,
    countGrup: countGrup,
    sortMakineKeys: sortMakineKeys,
    sortGrupKeys: sortGrupKeys,
    renderMakineHtml: renderMakineHtml,
    renderGrupHtml: renderGrupHtml,
    normalizeTipToMakine: normalizeTipToMakine,
    MAKINE_ORDER: MAKINE_ORDER,
    GRUP_ORDER: GRUP_ORDER,
  };
})(typeof window !== "undefined" ? window : globalThis);
