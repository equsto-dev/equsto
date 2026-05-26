/**
 * Admin E-Ticaret — katalog category slug → filtre anahtarı (pisirme, sogutma, …).
 * Kilit: public/admin-eticaret-KILIT.txt
 * ekipmanlar.json alanı: sanayi-ocaklari, fritozler, … (pisirme değil).
 */
(function (global) {
  "use strict";

  var EQ_ADMIN_CATS = [
    "pisirme",
    "sogutma",
    "icecek",
    "yikama",
    "hazirlik",
    "tezgah_davlumbaz",
    "depolama",
    "araba",
    "yardimci",
    "sunum",
    "diger",
  ];

  var EQ_ADMIN_CAT_LABELS = {
    pisirme: "Pişirme",
    sogutma: "Soğutma",
    icecek: "İçecek",
    yikama: "Yıkama",
    hazirlik: "Hazırlık",
    tezgah_davlumbaz: "Tezgah & Davlumbaz",
    depolama: "Depolama",
    araba: "Araba",
    yardimci: "Yardımcı Ekipmanlar",
    sunum: "Sunum",
    diger: "Diğer",
  };

  var EQ_CATALOG_SLUG_TO_ADMIN = {
    "sanayi-ocaklari": "pisirme",
    "sanayi-tipi-izgaralar": "pisirme",
    kuzineler: "pisirme",
    fritozler: "pisirme",
    "doner-ocaklari-": "pisirme",
    "tost-makineleri": "pisirme",
    "pilic-cevirme-makineleri": "pisirme",
    "ocakbasi-izgara": "pisirme",
    "kaynatma-tencereleri": "pisirme",
    "benmariler-yemeklikler": "pisirme",
    "sogutma-ekipmanlari": "sogutma",
    "icecek-berrak-buz-makineleri": "sogutma",
    "kahve-makineleri": "icecek",
    "cay-kazanlari-cay-makineleri-cay-otomatlari": "icecek",
    "yiyecek-ve-icecek-otomatlari-": "icecek",
    "yiyecek-ve-i-cecek-otomatlari": "icecek",
    "cay-kazanlari": "icecek",
    "cikolata-temperleme-makinesi-": "icecek",
    "hamur-hazirlik-makineleri": "hazirlik",
    "et-hazirlik-makineleri": "hazirlik",
    "meyve-kurutma-makineleri": "hazirlik",
    "bulasik-makineleri": "yikama",
    "yikama-ekipmanlari": "yikama",
    "paslanmaz-urunler": "tezgah_davlumbaz",
    "banket-arabalari": "araba",
    "endustriyel-mutfak": "diger",
    suzgecler: "yardimci",
    "yardimci-ekipmanlar": "yardimci",
    "gastronom-kuvetler": "yardimci",
  };

  function catalogKey(name, catalogSlug) {
    if (global.EqCatOverrides && global.EqCatOverrides.catalogKey) {
      return global.EqCatOverrides.catalogKey(name, catalogSlug);
    }
    return (
      String(name || "")
        .toLowerCase()
        .trim() +
      "|" +
      String(catalogSlug || "")
        .toLowerCase()
        .trim()
    );
  }

  function fromSlug(slug) {
    var s = String(slug || "")
      .toLowerCase()
      .trim();
    if (!s) return "diger";
    if (EQ_ADMIN_CATS.indexOf(s) >= 0) return s;
    if (global.EqCatOverrides) {
      var sm = global.EqCatOverrides.getSlugMap();
      if (sm[s]) return sm[s];
    }
    if (EQ_CATALOG_SLUG_TO_ADMIN[s]) return EQ_CATALOG_SLUG_TO_ADMIN[s];
    if (typeof global.eqCategoryToUrunlerSeg === "function") {
      var seg = global.eqCategoryToUrunlerSeg(s);
      if (seg === "pisirme" || seg === "sogutma" || seg === "hazirlik" || seg === "yikama") return seg;
      if (seg === "kahve" || seg === "icecek") return "icecek";
    }
    if (s.indexOf("pisirme") >= 0) return "pisirme";
    if (s.indexOf("sogutma") >= 0) return "sogutma";
    if (s.indexOf("bulasik") >= 0 || s.indexOf("yikama") >= 0) return "yikama";
    if (s.indexOf("hazirlik") >= 0 || s.indexOf("hamur") >= 0 || s.indexOf("et-hazirlik") >= 0) return "hazirlik";
    if (
      s.indexOf("kahve") >= 0 ||
      s.indexOf("icecek") >= 0 ||
      s.indexOf("cay") >= 0 ||
      s.indexOf("bira") >= 0 ||
      s.indexOf("soda") >= 0
    )
      return "icecek";
    if (/yardimci|suzgec|süzgeç|oyacak|soyacak|döküm-tencere|dokum-tencere/.test(s)) return "yardimci";
    if (/ocak|izgara|fritoz|firin|kuzine|doner|tost|salamander|benmari/.test(s)) return "pisirme";
    if (/tezgah|davlumbaz|paslanmaz/.test(s)) return "tezgah_davlumbaz";
    if (/banket|araba/.test(s)) return "araba";
    return "diger";
  }

  function isYardimciEkipmanByName(p) {
    var tips = global.EqDeptTips;
    if (!tips || !tips.isYardimciEkipmanProduct) return false;
    return tips.isYardimciEkipmanProduct(tipsItem(p));
  }

  function isYerIzgaraByName(p) {
    var tips = global.EqDeptTips;
    if (!tips || !tips.isYerIzgaraProduct) return false;
    return tips.isYerIzgaraProduct(tipsItem(p));
  }

  function productCat(p) {
    if (!p) return "diger";
    if (p.cat && EQ_ADMIN_CATS.indexOf(p.cat) >= 0 && !isYardimciEkipmanByName(p) && !isYerIzgaraByName(p))
      return p.cat;
    if (isYerIzgaraByName(p)) return "yikama";
    if (isYardimciEkipmanByName(p)) return "yardimci";
    return fromSlug(p.catalogSlug || p.cat);
  }

  function deptLabel(id) {
    return EQ_ADMIN_CAT_LABELS[id] || id || "—";
  }

  function applyProductCategories(list) {
    if (!Array.isArray(list)) return;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      if (!p) continue;
      if (!p._origCatalogSlug && p.catalogSlug) p._origCatalogSlug = p.catalogSlug;
      if (!p.catalogSlug) {
        p.catalogSlug = String(p._origCatalogSlug || p.cat || "").trim();
      }
      if (!p._origCatalogSlug) p._origCatalogSlug = p.catalogSlug;
      p.catalogKey = catalogKey(p.name, p._origCatalogSlug);

      var ov = global.EqCatOverrides ? global.EqCatOverrides.getProduct(p) : null;
      var yerIzgaraByName = isYerIzgaraByName(p);
      var yardimciByName = isYardimciEkipmanByName(p);
      if (ov && ov.catalogSlug) p.catalogSlug = ov.catalogSlug;
      else if (yerIzgaraByName) p.catalogSlug = "yikama-ekipmanlari";
      else if (yardimciByName) p.catalogSlug = "yardimci-ekipmanlar";
      var autoDept = yerIzgaraByName ? "yikama" : yardimciByName ? "yardimci" : fromSlug(p.catalogSlug);
      p.catAuto = autoDept;
      p.cat = ov && ov.adminDept ? ov.adminDept : autoDept;
      p.catOverride = !!(ov && (ov.adminDept || ov.catalogSlug));
    }
  }

  function remapProducts(list) {
    applyProductCategories(list);
  }

  function tipsItem(p) {
    return { name: p.name || "", category: p.catalogSlug || "", n: p.name || "", c: p.catalogSlug || "" };
  }

  function isSuspicious(p) {
    if (!p) return false;
    var dept = productCat(p);
    var tips = global.EqDeptTips;
    if (!tips) return false;
    var u = tipsItem(p);
    if (dept === "pisirme" && tips.isYardimciEkipmanProduct && tips.isYardimciEkipmanProduct(u)) return true;
    if (dept === "pisirme" && tips.isSuzgecProduct && tips.isSuzgecProduct(u)) return true;
    if (dept === "sogutma" && tips.isEtKiymaProduct && tips.isEtKiymaProduct(u)) return true;
    if (dept === "icecek" && tips.isBuzMakinesiProduct && tips.isBuzMakinesiProduct(u)) return true;
    if (
      (dept === "pisirme" || dept === "sogutma" || dept === "hazirlik") &&
      tips.isServisTeshirProduct &&
      tips.isServisTeshirProduct(u)
    )
      return true;
    return false;
  }

  function collectCatalogSlugs(list) {
    var m = {};
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        var s = list[i] && (list[i].catalogSlug || list[i]._origCatalogSlug);
        if (s) m[String(s).toLowerCase()] = (m[String(s).toLowerCase()] || 0) + 1;
      }
    }
    Object.keys(EQ_CATALOG_SLUG_TO_ADMIN).forEach(function (k) {
      if (!m[k]) m[k] = 0;
    });
    return Object.keys(m).sort();
  }

  function slugMatrixRows(list) {
    var counts = {};
    if (Array.isArray(list)) {
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (!p) continue;
        var slug = String(p.catalogSlug || p._origCatalogSlug || "").toLowerCase();
        if (!slug) continue;
        if (!counts[slug]) counts[slug] = { count: 0, auto: fromSlug(slug), override: null };
        counts[slug].count++;
      }
    }
    var sm = global.EqCatOverrides ? global.EqCatOverrides.getSlugMap() : {};
    Object.keys(EQ_CATALOG_SLUG_TO_ADMIN).forEach(function (slug) {
      if (!counts[slug]) counts[slug] = { count: 0, auto: fromSlug(slug), override: null };
    });
    Object.keys(counts).forEach(function (slug) {
      counts[slug].effective = sm[slug] || EQ_CATALOG_SLUG_TO_ADMIN[slug] || counts[slug].auto;
      counts[slug].override = sm[slug] || null;
    });
    return Object.keys(counts)
      .sort()
      .map(function (slug) {
        return {
          slug: slug,
          count: counts[slug].count,
          auto: counts[slug].auto,
          effective: counts[slug].effective,
          hasOverride: !!counts[slug].override,
        };
      });
  }

  global.EqAdminKategori = {
    EQ_ADMIN_CATS: EQ_ADMIN_CATS,
    EQ_ADMIN_CAT_LABELS: EQ_ADMIN_CAT_LABELS,
    EQ_CATALOG_SLUG_TO_ADMIN: EQ_CATALOG_SLUG_TO_ADMIN,
    catalogKey: catalogKey,
    fromSlug: fromSlug,
    productCat: productCat,
    deptLabel: deptLabel,
    applyProductCategories: applyProductCategories,
    remapProducts: remapProducts,
    isSuspicious: isSuspicious,
    collectCatalogSlugs: collectCatalogSlugs,
    slugMatrixRows: slugMatrixRows,
  };
})(typeof window !== "undefined" ? window : globalThis);
