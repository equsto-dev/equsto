/**
 * Üye API tabanı — yerelde Vite /api proxy; canlıda aynı kök veya auth-api-base.json.
 */
;(function () {
  'use strict';
  window.EQUSTO_AUTH = window.EQUSTO_AUTH || {};

  var host = location.hostname || '';
  var isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host) || location.protocol === 'file:';

  if (isLocal) {
    if (window.EQUSTO_AUTH.apiBase == null) window.EQUSTO_AUTH.apiBase = '';
    window.__eqAuthApiReady = Promise.resolve();
    return;
  }

  if (window.EQUSTO_AUTH.apiBase == null) window.EQUSTO_AUTH.apiBase = '';

  /* Giriş sayfasını bloklamayın — çoğu ortamda apiBase zaten aynı kök ("") */
  window.__eqAuthApiReady = Promise.resolve();
  fetch('/auth-api-base.json', { cache: 'force-cache' })
    .then(function (r) {
      return r.ok ? r.json() : {};
    })
    .then(function (j) {
      if (j && typeof j.apiBase === 'string') {
        window.EQUSTO_AUTH.apiBase = String(j.apiBase).replace(/\/$/, '');
      }
    })
    .catch(function () {});
})();
