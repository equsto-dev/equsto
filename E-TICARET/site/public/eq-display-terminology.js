/**
 * Görünen metinlerde "Sanayi…" → "Endüstriyel…" (katalog slug'ları aynı kalır).
 */
;(function () {
  'use strict';

  var SLUG_LABELS = {
    'sanayi-ocaklari': 'Endüstriyel Ocaklar',
    'sanayi-ocaklari-': 'Endüstriyel Ocaklar',
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
    if (x.name_en) x.name = String(x.name_en);
    else if (x.name) x.name = eqProductNameEn(x.name, x);
    if (x.specs_en) x.specs = String(x.specs_en);
    else if (x.specs) x.specs = eqTranslateSpecEn(x.specs);
    if (x.description_en) x.description = String(x.description_en);
    else if (x.description) x.description = eqTranslateSpecEn(x.description);
    if (x.aciklama_en) x.aciklama = String(x.aciklama_en);
    else if (x.aciklama) x.aciklama = eqTranslateSpecEn(x.aciklama);
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
      if (u.raw && u.raw.name_en) u.n = String(u.raw.name_en);
      else if (u.n) u.n = eqProductNameEn(u.n, u.raw || u);
      if (u.raw && u.raw.specs_en) u.specs = String(u.raw.specs_en);
      else if (u.specs) u.specs = eqTranslateSpecEn(u.specs);
    }
    return u;
  }

  function polishShopList(list) {
    if (!Array.isArray(list)) return list;
    for (var i = 0; i < list.length; i++) polishShopProduct(list[i]);
    return list;
  }

  /** PLP / EN — katalog slug aynı; görünen ürün adı kısa sözlük. */
  function eqProductNameEn(name, raw) {
    if (window.eqLang !== 'en') return name;
    var t = String(name == null ? '' : name).trim();
    if (!t) return t;
    if (raw && raw.name_en) return String(raw.name_en).trim();
    var lc = t.toLowerCase();
    var reps = [
      [/kopuklu\s*ayran|köpüklü\s*ayran/gi, 'Frothy ayran machine'],
      [/ayran\s*makin/gi, 'Ayran machine'],
      [/meyve\s*suyu\s*sogutma|meyve\s*suyu\s*soğutma/gi, 'Juice dispenser'],
      [/buz\s*mak[iİ]nes[iİ]/gi, 'Ice machine'],
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
      [/buzdolab[ıi]/gi, 'refrigerator'],
      [/derin\s*dondurucu/gi, 'freezer'],
      [/frit[oö]z/gi, 'fryer'],
      [/ocak/gi, 'range'],
      [/f[ıi]r[ıi]n/gi, 'oven'],
      [/davlumbaz/gi, 'hood'],
      [/tezgah/gi, 'work table'],
      [/konteyner/gi, 'container'],
      [/iskonto/gi, 'discount']
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

  function hookLoader(obj, method) {
    if (!obj || typeof obj[method] !== 'function' || obj['__eqTermHook_' + method]) return;
    var orig = obj[method];
    obj[method] = function () {
      return Promise.resolve(orig.apply(obj, arguments)).then(function (list) {
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
      if (window.eqLang === 'en') loadSpecTerms();
    });
    document.addEventListener('DOMContentLoaded', hookIndexAllProducts);
    setTimeout(hookIndexAllProducts, 0);
    setTimeout(hookIndexAllProducts, 120);
  }
})();
