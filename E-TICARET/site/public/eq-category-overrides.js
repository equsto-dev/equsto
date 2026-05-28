/**
 * Vitrin — ürün/kategori override (salt okunur).
 * Kaynak: /data/product-category-overrides.json
 */
(function (global) {
  'use strict';

  var OVERRIDES_URL = '/data/product-category-overrides.json';
  var store = { version: 1, updated: null, slugMap: {}, products: {} };
  var loaded = false;
  var loadPromise = null;

  function catalogKey(name, catalogSlug) {
    return (
      String(name || '')
        .toLowerCase()
        .trim() +
      '|' +
      String(catalogSlug || '')
        .toLowerCase()
        .trim()
    );
  }

  function productKey(p) {
    if (!p) return '';
    if (p.catalogKey) return p.catalogKey;
    return catalogKey(p.name, p.catalogSlug || p._origCatalogSlug || p.c || '');
  }

  function normalizeStore(raw) {
    var o = raw && typeof raw === 'object' ? raw : {};
    return {
      version: 1,
      updated: o.updated || null,
      slugMap: o.slugMap && typeof o.slugMap === 'object' ? Object.assign({}, o.slugMap) : {},
      products: o.products && typeof o.products === 'object' ? Object.assign({}, o.products) : {},
    };
  }

  function load() {
    if (loaded) return Promise.resolve(store);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(OVERRIDES_URL, { cache: 'no-store', credentials: 'same-origin' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        store = normalizeStore(j);
        loaded = true;
        return store;
      })
      .catch(function () {
        loaded = true;
        return store;
      });
    return loadPromise;
  }

  function getProduct(p) {
    var k = productKey(p);
    if (!k) return null;
    return store.products[k] || null;
  }

  function getSlugMap() {
    return Object.assign({}, store.slugMap);
  }

  global.EqCatOverrides = {
    catalogKey: catalogKey,
    productKey: productKey,
    load: load,
    getProduct: getProduct,
    getSlugMap: getSlugMap,
    getStore: function () {
      return store;
    },
  };

  load();
})(typeof window !== 'undefined' ? window : globalThis);
