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

  function eqPolishDisplayText(s) {
    if (s == null || s === '') return s;
    var t = String(s);
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
    return x;
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
    return u;
  }

  function polishShopList(list) {
    if (!Array.isArray(list)) return list;
    for (var i = 0; i < list.length; i++) polishShopProduct(list[i]);
    return list;
  }

  window.eqSimplifyTezgahDavlumbazName = eqSimplifyTezgahDavlumbazName;
  window.eqPolishDisplayText = eqPolishDisplayText;
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
    document.addEventListener('DOMContentLoaded', hookIndexAllProducts);
    setTimeout(hookIndexAllProducts, 0);
    setTimeout(hookIndexAllProducts, 120);
  }
})();
