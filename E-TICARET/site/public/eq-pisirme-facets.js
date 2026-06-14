/**
 * Pişirme ekipmanları — ocak / ızgara / fritöz / fırın vb. tip filtreleri.
 */
(function (global) {
  "use strict";

  var FACET_ORDER = ["ocaklar", "izgaralar", "fritozler", "firinlar", "benmariler", "diger-pisirme"];

  var FACET_LABELS = {
    ocaklar: "Ocaklar",
    izgaralar: "Izgaralar",
    fritozler: "Fritözler",
    firinlar: "Fırınlar",
    benmariler: "Benmariler",
    "diger-pisirme": "Diğer pişirme",
  };

  var CATEGORY_FACET = {
    ocaklar: "ocaklar",
    "sanayi-ocaklari": "ocaklar",
    "i-nduksiyonlu-ocaklar": "ocaklar",
    "induksiyonlu-ocaklar": "ocaklar",
    kuzineler: "ocaklar",
    "gazli-kuzineler": "ocaklar",
    "doner-ocaklari-": "ocaklar",
    "doner-ocaklari": "ocaklar",
    "adr-seri-doner-robotu": "ocaklar",
    "doner-makineleri": "ocaklar",
    "elektrikli-setustu-ocaklar": "ocaklar",
    "elektrikli-setustu-dinlendirme-ocagi": "ocaklar",
    "yer-izgaralari": "izgaralar",
    "sanayi-tipi-izgaralar": "izgaralar",
    izgaralar: "izgaralar",
    "sulu-izgaralar": "izgaralar",
    "gazli-izgaralar": "izgaralar",
    "elektrikli-izgaralar": "izgaralar",
    "elektrikli-izgara": "izgaralar",
    "setustu-elektrikli-izgaralar": "izgaralar",
    "lava-tasli-izgaralar": "izgaralar",
    "ocakbasi-izgara": "izgaralar",
    "asansorlu-izgara": "izgaralar",
    salamander: "izgaralar",
    "char-izgara": "izgaralar",
    "lavtasli_izgara": "izgaralar",
    "speedelight-mekanik-ayarlanabilen-ust-isitici-plaka-nervurlu": "izgaralar",
    "speedelight-manuel-ayarlanabilen-ust-isitici-plaka-nervurlu": "izgaralar",
    fritozler: "fritozler",
    firinlar: "firinlar",
    "linemiss-linemicro-serisi-firinlar": "firinlar",
    "kombi-firin": "firinlar",
    "konveksiyonlu-firin": "firinlar",
    "pizza-firinlari": "firinlar",
    "dijital-kontrol-panelli": "firinlar",
    "tas-firinlar-mikrodalga-firinlar": "firinlar",
    "mikrodalga-firin": "firinlar",
    "jet-mikrodalga-firin": "firinlar",
    "komurlu-firin": "firinlar",
    benmariler: "benmariler",
    "sos-benmariler": "benmariler",
    "kaynatma-tenceleri": "benmariler",
    "kaynatma-tenceresi": "benmariler",
    "gazli-elektrikli-kaynatma-tenceresi": "benmariler",
    "makarna-haslamalar": "benmariler",
    "makarna-hafllamalar": "benmariler",
    "devrilir-tavalar": "benmariler",
    "devrilir-tava": "benmariler",
    "patates-dinlendirmeler": "benmariler",
    "patates-dinlendirme": "benmariler",
    "buharli-kaynatma-tenceeleri": "benmariler",
    "hareketli-bain-marie": "benmariler",
    "setustu-bain-marie": "benmariler",
    "elektrikli-kaynatma-kazanlari-ebe-easy-line": "benmariler",
    "eb-elektrikli-kaynatma-kazanlari-smart": "benmariler",
    "elektrikli-kaynatma-kazanlari": "benmariler",
    "gazli-kaynatma-kazanlari": "benmariler",
    "gazli-silindirik-kaynatma-kazanlari": "benmariler",
    "dikdortgen-kaynatma-kazanlari": "benmariler",
    "elektrikli-silindirik-kaynatma-kazanlari": "benmariler",
    "otomatik-makarna-pisiriciler": "benmariler",
    "ara-tezgahlar": "diger-pisirme",
    "setustu-ara-tezgahlar": "diger-pisirme",
    "dolaplar-ve-taban-raflari-ara-tezgahlar": "diger-pisirme",
    "taban-raflari": "diger-pisirme",
    "alt-dolaplar": "diger-pisirme",
    dolaplar: "diger-pisirme",
    "yardimci-ekipmanlar": "diger-pisirme",
    ekipmanlar: "diger-pisirme",
    "banket-arabalari": "diger-pisirme",
    "tost-makineleri": "diger-pisirme",
    "waffle-krep-makineleri": "diger-pisirme",
    "pilic-cevirme-makineleri": "diger-pisirme",
    "pilic-cevirme-makinesi": "diger-pisirme",
    "pilic-cevirme": "diger-pisirme",
    "cay-makineleri": "diger-pisirme",
    "ekmek-kizartma-makineleri": "diger-pisirme",
    "cihazalti-soguk-ve-dondurucu-dolaplar": "diger-pisirme",
    "cihazalti-sogutucu-ve-derin-dondurucular": "diger-pisirme",
  };

  /** pilic-* gibi dinamik kategori slug'ları */
  var CATEGORY_PREFIX_FACET = [
    ["pilic-", "diger-pisirme"],
    ["pilic_", "diger-pisirme"],
  ];

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function categorySlug(hit) {
    if (!hit) return "";
    return lc(hit.category || hit.c || (hit.raw && hit.raw.category) || "");
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
        hit.raw && hit.raw.urun_kategori,
        hit.raw && hit.raw.alt_kategori_1,
        hit.raw && hit.raw.alt_kategori_2,
        hit.raw && hit.raw.urun_alt_kategori,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  function facetFromCategorySlug(cat) {
    if (!cat) return null;
    if (CATEGORY_FACET[cat]) return CATEGORY_FACET[cat];
    for (var i = 0; i < CATEGORY_PREFIX_FACET.length; i++) {
      if (cat.indexOf(CATEGORY_PREFIX_FACET[i][0]) === 0) {
        return CATEGORY_PREFIX_FACET[i][1];
      }
    }
    return null;
  }

  function isPisirmeProduct(hit) {
    var dept = lc((hit && hit.raw && hit.raw.dept) || hit.dept || "");
    if (dept === "pisirme") return true;
    var hay = productHaystack(hit);
    if (!hay) return false;
    if (/^pisirme\b|pişirme|pisirme ekipman/.test(hay)) return true;
    return !!classifyFacet(hit);
  }

  function classifyFromHaystack(hay) {
    if (!hay) return null;
    if (/fritöz|fritoz|freidora|deep\s*fry|friteuse/.test(hay)) return "fritozler";
    if (/mikrodalga|microwave|jet\s*oven|speed\s*oven/.test(hay)) return "firinlar";
    if (
      /pizza\s*fır|pizza\s*fir|konveksiyon|kombi\s*fır|kombi\s*fir|mayalama\s*dolab|combi\s*oven|taş\s*fır|tas\s*fir/.test(
        hay,
      )
    ) {
      return "firinlar";
    }
    if (/\bfırın\b|\bfirin\b/.test(hay) && !/mikrodalga|microwave/.test(hay)) return "firinlar";
    if (/ızgara|izgara|grill|salamander|plancha|lavtaş|lavtas|griddle|char\s*grill|broiler|gratin/.test(hay)) {
      return "izgaralar";
    }
    if (
      /ocak|kuzine|indüksiyon|induksiyon|endüksiyon|enduksiyon|wok|döner|doner|kebab|kebap/.test(hay) &&
      !/dondurucu|soğutucu|sogutucu|buzdolab/.test(hay)
    ) {
      return "ocaklar";
    }
    if (
      /benmari|bain\s*marie|kaynatma\s*tencere|kaynatma\s*kazan|makarna\s*haş|makarna\s*has|devrilir\s*tava|patates\s*dinlen|buharli\s*kaynatma/.test(
        hay,
      )
    ) {
      return "benmariler";
    }
    if (
      /tost\s*mak|waffle|krep\s*mak|ara\s*tezgah|taban\s*raf|yardımcı\s*ekipman|yardimci\s*ekipman|pilic|piliç|rotisserie|çevirme|cevirme|ekmek\s*kızart|cay\s*mak|çay\s*mak/.test(
        hay,
      )
    ) {
      return "diger-pisirme";
    }
    return null;
  }

  function classifyFacet(hit) {
    var cat = categorySlug(hit);
    var fromCat = facetFromCategorySlug(cat);
    if (fromCat) return fromCat;
    return classifyFromHaystack(productHaystack(hit));
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
    var inputName = opts.inputName || "eq-pisirme-tip";
    var keys = sortKeys(
      FACET_ORDER.filter(function (k) {
        return (counts[k] || 0) > 0;
      }),
    );
    if (!keys.length) return "";
    var html =
      '<details class="eq-cm-facet" open><summary class="eq-cm-facet__hd">' +
      escHtml(opts.title || "Pişirme tipi") +
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

  global.EqPisirmeFacets = {
    classifyFacet: classifyFacet,
    facetKeyFromHit: facetKeyFromHit,
    labelFromKey: labelFromKey,
    hitMatchesFacet: hitMatchesFacet,
    hitMatchesAnyFacet: hitMatchesAnyFacet,
    isPisirmeProduct: isPisirmeProduct,
    countFacets: countFacets,
    sortKeys: sortKeys,
    renderFacetListHtml: renderFacetListHtml,
  };
})(typeof window !== "undefined" ? window : globalThis);
