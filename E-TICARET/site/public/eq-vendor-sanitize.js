/**
 * Rakip / pazar yeri adlarını vitrin marka alanından temizler.
 * eq-display-terminology.js ve PLP normalizeRow bu API'yi çağırır.
 */
(function (global) {
  'use strict';

  var STRIP =
    /\b(cafemarkt|n11|trendyol|hepsiburada|amazon|gittigidiyor|çiçeksepeti|ciceksepeti)\b/gi;

  function clean(s) {
    if (s == null || s === '') return s;
    return String(s)
      .replace(STRIP, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[\s|·\-–—]+|[\s|·\-–—]+$/g, '')
      .trim();
  }

  function sanitizeProduct(p) {
    if (!p || typeof p !== 'object') return;
    if (p.brand) p.brand = clean(p.brand);
    if (p.oem_brand) p.oem_brand = clean(p.oem_brand);
    if (p.b) p.b = clean(p.b);
    if (p.fb) p.fb = clean(p.fb);
  }

  global.eqSanitizeVendorProduct = sanitizeProduct;
  global.eqSanitizeVendorShopProduct = sanitizeProduct;
})(typeof window !== 'undefined' ? window : globalThis);
