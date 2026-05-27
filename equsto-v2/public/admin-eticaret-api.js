/**
 * Admin E-Ticaret içerik → API (/api/eticaret-icerik).
 * saveET / loadET ile birlikte çalışır (banner, kampanya, kupon).
 * GET herkese açık; POST admin bearer gerektirir (claude-api-proxy).
 */
(function () {
  'use strict';

  function etPayload() {
    return {
      k: typeof etKampanyalar !== 'undefined' ? etKampanyalar : [],
      kp: typeof etKuponlar !== 'undefined' ? etKuponlar : [],
      b: typeof etBannerlar !== 'undefined' ? etBannerlar : [],
      dy: typeof etDuyurular !== 'undefined' ? etDuyurular : [],
      r: typeof etRedirects !== 'undefined' ? etRedirects : [],
      a: typeof etAyarlar !== 'undefined' ? etAyarlar : {},
    };
  }

  function mergeEtIntoGlobals(data) {
    if (!data || typeof data !== 'object') return;
    if (Array.isArray(data.k)) etKampanyalar = data.k;
    if (Array.isArray(data.kp)) etKuponlar = data.kp;
    if (Array.isArray(data.b)) etBannerlar = data.b;
    if (Array.isArray(data.dy)) etDuyurular = data.dy;
    if (Array.isArray(data.r)) etRedirects = data.r;
    if (data.a) etAyarlar = data.a;
  }

  function productsApiBase() {
    if (typeof PRODUCTS_API_BASE === 'string' && PRODUCTS_API_BASE) {
      return PRODUCTS_API_BASE.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && typeof window.EQUSTO_API_BASE === 'string') {
      return window.EQUSTO_API_BASE.replace(/\/$/, '');
    }
    return '/api';
  }

  function adminApiOnline() {
    return typeof __ADMIN_ONLINE === 'undefined' || !!__ADMIN_ONLINE;
  }

  async function pullEticaretApi() {
    if (!adminApiOnline()) return;
    var base = productsApiBase();
    if (!base) return;
    try {
      var r = await fetch(base + '/eticaret-icerik', {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      }).catch(function () {
        return null;
      });
      if (!r || r.status === 404) return;
      if (!r.ok) return;
      var body = await r.json();
      if (body && body.success && body.data) mergeEtIntoGlobals(body.data);
    } catch (_) {}
  }

  async function pushEticaretApi() {
    if (!adminApiOnline()) return;
    if (typeof api !== 'function') return;
    try {
      await api('POST', '/eticaret-icerik', etPayload());
    } catch (e) {
      var msg = e && e.message ? e.message : String(e);
      if (/404|Offline mod/i.test(msg)) return;
      console.warn('[admin-eticaret-api] kayıt:', msg);
    }
  }

  if (typeof loadET === 'function') {
    var _loadET = loadET;
    loadET = function () {
      _loadET();
      pullEticaretApi().then(function () {
        try {
          if (typeof renderEtBannerlar === 'function') renderEtBannerlar();
          if (typeof renderEtKampanya === 'function') renderEtKampanya();
        } catch (_) {}
      });
    };
  }

  if (typeof saveET === 'function') {
    var _saveET = saveET;
    saveET = function () {
      _saveET();
      pushEticaretApi().then(function () {
        if (global.EqVitrinConfig && typeof global.EqVitrinConfig.reload === 'function') {
          global.EqVitrinConfig.reload();
        }
      });
    };
  }
})();
