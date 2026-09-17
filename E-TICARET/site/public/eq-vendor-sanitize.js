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

  function decodeHtmlEntities(s) {
    var t = String(s == null ? '' : s)
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&apos;/gi, "'")
      .replace(/&#(\d+);/g, function (_, n) {
        var c = Number(n);
        if (!Number.isFinite(c) || c < 0) return '';
        try {
          return String.fromCodePoint(c);
        } catch (e) {
          return String.fromCharCode(c);
        }
      })
      .replace(/&#x([0-9a-f]+);/gi, function (_, hex) {
        var c = parseInt(hex, 16);
        if (!Number.isFinite(c) || c < 0) return '';
        try {
          return String.fromCodePoint(c);
        } catch (e) {
          return String.fromCharCode(c);
        }
      });
    try {
      return t.normalize('NFC');
    } catch (e) {
      return t;
    }
  }

  function decodeField(obj, key) {
    if (typeof obj[key] === 'string') obj[key] = decodeHtmlEntities(obj[key]);
  }

  function sanitizeProduct(p) {
    if (!p || typeof p !== 'object') return;
    if (p.brand) p.brand = clean(p.brand);
    if (p.oem_brand) p.oem_brand = clean(p.oem_brand);
    if (p.b) p.b = clean(p.b);
    if (p.fb) p.fb = clean(p.fb);
    decodeField(p, 'name');
    decodeField(p, 'n');
    decodeField(p, 'specs');
    decodeField(p, 'aciklama');
    decodeField(p, 'description');
  }

  global.eqDecodeHtmlEntities = decodeHtmlEntities;
  global.eqSanitizeVendorProduct = sanitizeProduct;
  global.eqSanitizeVendorShopProduct = sanitizeProduct;
})(typeof window !== 'undefined' ? window : globalThis);
