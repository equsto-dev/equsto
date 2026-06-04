/**
 * Görünen metinlerde "Sanayi…" → "Endüstriyel…" (katalog slug'ları aynı kalır).
 */
;(function () {
  'use strict';

  var SLUG_LABELS = {
    'sanayi-ocaklari': 'Endüstriyel Ocaklar',
    'sanayi-ocaklari-': 'Endüstriyel Ocaklar',
    'ocak-vitrini': 'Ocaklar',
    'sanayi-tipi-izgaralar': 'Endüstriyel Izgaralar'
  };

  /** Markalı tezgah/davlumbaz adı → «Çalışma Tezgahı …» / «Davlumbaz …» (ölçü/model korunur). */
  function eqSimplifyTezgahDavlumbazName(name, opts) {
    opts = opts || {};
    var dept = String(opts.dept || '').trim();
    var n = String(name == null ? '' : name).trim();
    if (!n) return n;

    var allowDav = dept === 'davlumbaz' || opts.allowDavlumbaz;
    var allowTezg = dept === 'tezgah' || opts.allowCalismaTezgah;

    if (allowDav && !/davlumbazlı|davlumbazli/i.test(n)) {
      var dm = n.match(/\bdavlumbaz\b/i);
      if (dm && dm.index != null) {
        var dtail = n.slice(dm.index + dm[0].length).trim();
        return ('Davlumbaz' + (dtail ? ' ' + dtail : '')).replace(/\s+/g, ' ').trim();
      }
    }

    if (allowTezg) {
      var cm = n.match(/çalışma\s*(tezgah[ıi]?|demonte)|calisma\s*(tezgah[ıi]?|demonte)/i);
      if (cm && cm.index != null) {
        var after = n.slice(cm.index + cm[0].length).trim().replace(/^tezgah[ıi]?\s*/i, '');
        var demonte = /demonte/i.test(cm[0]) || /demonte/i.test(after);
        if (demonte) after = after.replace(/(\s*\bdemonte\b\s*)+/gi, ' ').replace(/\s+/g, ' ').trim();
        var label = demonte ? 'Çalışma Tezgahı Demonte' : 'Çalışma Tezgahı';
        return (label + (after ? ' ' + after : '')).replace(/\s+/g, ' ').trim();
      }
    }

    return n;
  }

  function eqPolishOztiAsciiName(s) {
    if (s == null || s === '') return s;
    var t = String(s);
    t = t.replace(/ELEKTRI\u0049KL\u0130/g, 'ELEKTRİKLİ');
    t = t.replace(/ELEKTRIKLI/g, 'ELEKTRİKLİ');
    t = t.replace(/ELEKTRIKLİ/g, 'ELEKTRİKLİ');
    t = t.replace(/\bELEKTRIK\b/g, 'ELEKTRİK');
    t = t.replace(/\bGAZ\/ELEKTRIK\b/g, 'GAZ/ELEKTRİK');
    t = t.replace(/\bDOKUM\b/g, 'DÖKÜM');
    t = t.replace(/\bALUMINYUM\b/g, 'ALÜMİNYUM');
    t = t.replace(/\bDEVRILIR\b/g, 'DEVRİLİR');
    t = t.replace(/\bDONER\b/g, 'DÖNER');
    t = t.replace(/\bOCAGI\b/g, 'OCAĞI');
    t = t.replace(/\bOCAK\b/g, 'OCAK');
    t = t.replace(/\bFRITOZ\b/g, 'FRİTÖZ');
    t = t.replace(/\bFRITÖZ SEPETI\b/g, 'FRİTÖZ SEPETİ');
    t = t.replace(/\bYENI SERI\b/g, 'YENİ SERİ');
    t = t.replace(/\bYENI\b/g, 'YENİ');
    t = t.replace(/\bICIN\b/g, 'İÇİN');
    return t;
  }

  function eqPolishDisplayText(s) {
    if (s == null || s === '') return s;
    var t = String(s);
    t = eqPolishOztiAsciiName(t);
    t = t.replace(/\bSanayi\s+Ocaklar[ıi]\b/gi, 'Endüstriyel Ocaklar');
    t = t.replace(/\bSanayi\s+Tipi\b/gi, 'Endüstriyel Tipi');
    t = t.replace(/\bSanayi\s+Tip\b/gi, 'Endüstriyel Tip');
    t = t.replace(/\bSanayi\s+tipi\b/g, 'Endüstriyel tipi');
    t = t.replace(/\bSanayi\s+tipidir\b/gi, 'Endüstriyel tipidir');
    t = t.replace(/\bSanayi\s+tipidir\./gi, 'Endüstriyel tipidir.');
    t = t.replace(/\bGazl[ıi]\s+sanayi\s+oca[gğ][ıi]\b/gi, 'Gazlı endüstriyel ocağı');
    t = t.replace(/\bsanayi\s+tipi\b/gi, 'endüstriyel tipi');
    t = t.replace(/\bSanayi\s*\/\s*Organize\s+Bölge\b/gi, 'Endüstriyel / Organize Bölge');
    t = t.replace(/\bsanayi\s+sitesi\b/gi, 'endüstriyel site');
    return t;
  }

  function eqCategorySlugLabel(slug, fallback) {
    if (slug && Object.prototype.hasOwnProperty.call(SLUG_LABELS, slug)) {
      return SLUG_LABELS[slug];
    }
    return eqPolishDisplayText(fallback || slug || '');
  }

  var SPEC_TERMS = null;
  var specLoadPromise = null;
  var PRODUCT_EN_BY_ID = null;
  var productEnLoadPromise = null;

  function loadProductEnOverlay() {
    if (PRODUCT_EN_BY_ID) return Promise.resolve(PRODUCT_EN_BY_ID);
    if (productEnLoadPromise) return productEnLoadPromise;
    productEnLoadPromise = fetch('/data/i18n/products-en-by-id.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { byId: {} }; })
      .then(function (j) {
        PRODUCT_EN_BY_ID = (j && j.byId) || {};
        return PRODUCT_EN_BY_ID;
      })
      .catch(function () {
        PRODUCT_EN_BY_ID = {};
        return PRODUCT_EN_BY_ID;
      });
    return productEnLoadPromise;
  }

  function productEnEntry(x) {
    if (!x || !PRODUCT_EN_BY_ID) return null;
    var id = String(x.id || '').trim();
    return id && PRODUCT_EN_BY_ID[id] ? PRODUCT_EN_BY_ID[id] : null;
  }

  function applyProductEnOverlay(x) {
    var o = productEnEntry(x);
    if (!o) return x;
    if (o.n) x.name = String(o.n);
    if (o.s) x.specs = String(o.s);
    if (o.d) {
      x.description = String(o.d);
      x.descriptionEn = String(o.d);
      x.aciklama = String(o.d);
    }
    return x;
  }

  function loadSpecTerms() {
    if (SPEC_TERMS) return Promise.resolve(SPEC_TERMS);
    if (specLoadPromise) return specLoadPromise;
    specLoadPromise = fetch('/data/i18n/spec-terms-en.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : { terms: [] }; })
      .then(function (j) {
        SPEC_TERMS = (j && j.terms) || [];
        SPEC_TERMS.sort(function (a, b) { return b[0].length - a[0].length; });
        return SPEC_TERMS;
      })
      .catch(function () {
        SPEC_TERMS = [];
        return SPEC_TERMS;
      });
    return specLoadPromise;
  }

  function eqTranslateSpecEn(s) {
    if (window.eqLang !== 'en' || s == null || s === '') return s;
    var t = String(s);
    if (SPEC_TERMS && SPEC_TERMS.length) {
      for (var i = 0; i < SPEC_TERMS.length; i++) {
        var pair = SPEC_TERMS[i];
        if (pair[0] && t.indexOf(pair[0]) !== -1) {
          t = t.split(pair[0]).join(pair[1]);
        }
      }
    }
    return eqProductNameEn(t, null);
  }

  function applyEnCatalogItem(x) {
    if (!x || typeof x !== 'object' || window.eqLang !== 'en') return x;
    applyProductEnOverlay(x);
    if (x.name_en) x.name = String(x.name_en);
    else if (x.name) x.name = eqProductNameEn(x.name, x);
    if (x.specs_en) x.specs = String(x.specs_en);
    else if (x.specs) x.specs = eqTranslateSpecEn(x.specs);
    var descSrc =
      (x.description_en && String(x.description_en).trim()) ||
      (x.aciklama_en && String(x.aciklama_en).trim()) ||
      (x.aciklama && String(x.aciklama).trim()) ||
      (x.description && String(x.description).trim()) ||
      '';
    if (descSrc) {
      var descEn =
        x.description_en ? String(x.description_en) : eqTranslateSpecEn(descSrc);
      x.description = descEn;
      x.descriptionEn = descEn;
      if (!x.aciklama_en) x.aciklama = descEn;
    }
    return x;
  }

  function polishCatalogItem(x) {
    if (!x || typeof x !== 'object') return x;
    if (typeof window.eqSanitizeVendorProduct === 'function') {
      window.eqSanitizeVendorProduct(x);
    }
    if (x.name) {
      x.name = eqSimplifyTezgahDavlumbazName(x.name, { dept: x.dept || '' });
      x.name = eqPolishDisplayText(x.name);
    }
    if (x.specs) x.specs = eqPolishDisplayText(x.specs);
    if (x.description) x.description = eqPolishDisplayText(x.description);
    if (x.aciklama) x.aciklama = eqPolishDisplayText(x.aciklama);
    return applyEnCatalogItem(x);
  }

  function polishCatalogList(list) {
    if (!Array.isArray(list)) return list;
    for (var i = 0; i < list.length; i++) polishCatalogItem(list[i]);
    return list;
  }

  function polishShopProduct(u) {
    if (!u || typeof u !== 'object') return u;
    if (typeof window.eqSanitizeVendorShopProduct === 'function') {
      window.eqSanitizeVendorShopProduct(u);
    }
    if (u.n) {
      var dept = (u.raw && u.raw.dept) || u.dept || '';
      u.n = eqSimplifyTezgahDavlumbazName(u.n, { dept: dept });
      u.n = eqPolishDisplayText(u.n);
    }
    if (u.specs) u.specs = eqPolishDisplayText(u.specs);
    if (window.eqLang === 'en') {
      var raw = u.raw || u;
      var pe = productEnEntry(raw);
      if (pe && pe.n) u.n = String(pe.n);
      else if (raw && raw.name_en) u.n = String(raw.name_en);
      else if (u.n) u.n = eqProductNameEn(u.n, raw);
      if (pe && pe.s) u.specs = String(pe.s);
      else if (raw && raw.specs_en) u.specs = String(raw.specs_en);
      else if (u.specs) u.specs = eqTranslateSpecEn(u.specs);
    }
    return u;
  }

  function polishShopList(list) {
    if (!Array.isArray(list)) return list;
    for (var i = 0; i < list.length; i++) polishShopProduct(list[i]);
    return list;
  }

  /** PLP / EN — önce products-en-by-id; yoksa kısa sözlük. */
  function eqProductNameEn(name, raw) {
    if (window.eqLang !== 'en') return name;
    var t = String(name == null ? '' : name).trim();
    if (!t) return t;
    if (raw) {
      var pe = productEnEntry(raw);
      if (pe && pe.n) return String(pe.n).trim();
      if (raw.name_en) return String(raw.name_en).trim();
    }
    var lc = t.toLowerCase();
    var reps = [
      [/vitrifrigo\s*süt\s*soğutucu|vitrifrigo\s*sut\s*sogutucu/gi, 'Vitrifrigo milk cooler'],
      [/bardak\s*ısıtıcı|bardak\s*isitici/gi, 'cup warmer'],
      [/kopuklu\s*ayran|köpüklü\s*ayran/gi, 'Frothy ayran machine'],
      [/ayran\s*makin/gi, 'Ayran machine'],
      [/meyve\s*suyu\s*sogutma|meyve\s*suyu\s*soğutma/gi, 'Juice dispenser'],
      [/karli\s*buzlu\s*serbet|slush/gi, 'Slush machine'],
      [/serbet\s*\+\s*ayran/gi, 'Sherbet + ayran dispenser'],
      [/serbet/gi, 'Sherbet'],
      [/hoshizaki\s*buz\s*makin/gi, 'Hoshizaki ice machine'],
      [/buz\s*mak[iİ]nes[iİ]/gi, 'Ice machine'],
      [/buz\s*haznesi/gi, 'Ice bin'],
      [/ba[gğ]lanti\s+kit[iİ]/gi, 'Connection kit'],
      [/c[iİ]hazalt[iİ]/gi, 'Under-counter'],
      [/(\d+)\s*kapil[iİ]/gi, '$1-door'],
      [/(\d+)\s*çekmeceli|(\d+)\s*cekmece/gi, '$1-drawer'],
      [/çekmeceli|cekmece/gi, 'drawer'],
      [/havuzlu/gi, 'with sink'],
      [/\bt\s+tip\b/gi, 'T-type'],
      [/dolap/gi, 'cabinet'],
      [/dolaplar/gi, 'cabinets'],
      [/te[sş]hir/gi, 'display'],
      [/so[gğ]uk\s*servis\s*bankosu/gi, 'cold service counter'],
      [/tek\s*cam\s*kapil[iİ]/gi, 'single glass door'],
      [/tek\s*inox\s*kapi/gi, 'single stainless door'],
      [/cift\s*inox\s*kapi|çift\s*inox\s*kapi/gi, 'twin stainless door'],
      [/(\d+)\s*inox\s*kapi/gi, '$1 stainless door'],
      [/dik\s*tip/gi, 'upright'],
      [/buz\s*mak[iİ]nes[iİ]/gi, 'ice machine'],
      [/kg\s*\/\s*g[uü]n/gi, 'kg/day'],
      [/hazne/gi, 'bin'],
      [/hazirlik\s*dolab[ıi]|hazırlık\s*dolab[ıi]/gi, 'prep cabinet'],
      [/so[gğ]uk\s*oda/gi, 'cold room'],
      [/servis\s*bankosu|servİs\s*bankosu/gi, 'service counter'],
      [/k\s*tip/gi, 'Type K'],
      [/buzdolab[ıi]/gi, 'refrigerator'],
      [/derin\s*dondurucu/gi, 'freezer'],
      [/frit[oö]z/gi, 'fryer'],
      [/ocak/gi, 'range'],
      [/f[ıi]r[ıi]n/gi, 'oven'],
      [/davlumbaz/gi, 'hood'],
      [/tezgah/gi, 'work table'],
      [/konteyner/gi, 'container'],
      [/iskonto/gi, 'discount'],
      [/yufka\s*yedek\s*acma/gi, 'Yufka dough sheeter spare'],
      [/yufka\s*yedek\s*a[cç]ma/gi, 'Yufka dough sheeter spare'],
      [/hamur\s*acma\s*makin/gi, 'dough sheeter'],
      [/hamur\s*a[cç]ma\s*makin/gi, 'dough sheeter'],
      [/hamur\s*yogurma|hamur\s*yo[gğ]urma/gi, 'dough mixer'],
      [/merdane\s*hiz\s*kontrollu/gi, 'speed-controlled roller'],
      [/merdane/gi, 'roller'],
      [/hiz\s*kontrollu/gi, 'speed-controlled'],
      [/nuova\s*simonelli|nuosi\s*appia/gi, 'Nuova Simonelli'],
      [/kahve\s*makin/gi, 'espresso machine'],
      [/kahve\s*mak[iİ]neler[iİ]/gi, 'coffee machines'],
      [/(\d+)\s*gruplu/gi, '$1-group'],
      [/dozaj\s*ayarli/gi, 'dose-adjustable'],
      [/tam\s*otomatik/gi, 'fully automatic'],
      [/üç\s*grup|uc\s*grup/gi, '3-group'],
      [/iki\s*grup/gi, '2-group'],
      [/bir\s*grup/gi, '1-group'],
      [/yüksek\s*performan/i, 'high performance'],
      [/fincanda\s*yüksek\s*kaliteyi\s*garantiler/gi, 'guarantees high quality in the cup'],
      [/gerilim/gi, 'voltage'],
      [/şebeke\s*ba[gğ]lanti\s*kit/i, 'mains water connection kit']
    ];
    for (var i = 0; i < reps.length; i++) {
      t = t.replace(reps[i][0], reps[i][1]);
    }
    return t.replace(/\s+/g, ' ').trim();
  }

  window.eqSimplifyTezgahDavlumbazName = eqSimplifyTezgahDavlumbazName;
  window.eqPolishDisplayText = eqPolishDisplayText;
  window.eqTranslateSpecEn = eqTranslateSpecEn;
  window.eqProductNameEn = eqProductNameEn;
  window.eqCategorySlugLabel = eqCategorySlugLabel;
  window.eqPolishCatalogList = polishCatalogList;
  window.eqPolishShopList = polishShopList;
  window.eqLoadProductEnOverlay = loadProductEnOverlay;

  function hookLoader(obj, method) {
    if (!obj || typeof obj[method] !== 'function' || obj['__eqTermHook_' + method]) return;
    var orig = obj[method];
    obj[method] = function () {
      var chain = Promise.resolve(orig.apply(obj, arguments));
      if (window.eqLang === 'en') {
        chain = chain.then(function (list) {
          return loadProductEnOverlay().then(function () { return list; });
        });
      }
      return chain.then(function (list) {
        return polishCatalogList(list);
      });
    };
    obj['__eqTermHook_' + method] = true;
  }

  hookLoader(window.EqustoEcomData, 'loadEkipmanlar');
  hookLoader(window.EqustoShopCatalog, 'load');
  hookLoader(window.EqustoShopCatalog, 'loadForProductPage');

  function hookIndexAllProducts() {
    if (typeof window.__eqAllProducts !== 'function' || window.__eqAllProductsHooked) return;
    var origAll = window.__eqAllProducts;
    window.__eqAllProducts = function () {
      return polishShopList(origAll().slice());
    };
    window.__eqAllProductsHooked = true;
  }

  hookIndexAllProducts();
  if (typeof document !== 'undefined') {
    loadSpecTerms();
    document.addEventListener('eq-i18n-ready', function () {
      if (window.eqLang === 'en') {
        loadSpecTerms();
        loadProductEnOverlay();
      }
    });
    if (window.eqLang === 'en') loadProductEnOverlay();
    document.addEventListener('DOMContentLoaded', hookIndexAllProducts);
    setTimeout(hookIndexAllProducts, 0);
    setTimeout(hookIndexAllProducts, 120);
  }
})();
