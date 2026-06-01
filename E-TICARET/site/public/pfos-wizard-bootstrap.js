/** Auto-generated — scripts/extract-pfos-wizard.mjs */
(function () {
fetch('/data/pfos-zone-catalog.json', { cache: 'default' })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (j) {
      if (j && window.EqustoPfosCalc && EqustoPfosCalc.setCatalog) {
        EqustoPfosCalc.setCatalog(j);
        if (window.PFOS_EQ_FIYATLAR && EqustoPfosCalc.hydrateCatalogPrices) {
          EqustoPfosCalc.hydrateCatalogPrices(window.PFOS_EQ_FIYATLAR);
        }
        if (typeof renderPfosZonePills === 'function') renderPfosZonePills();
      }
    })
    .catch(function () {});
})();
})();

(function () {
/* PFOS v2 Faz 1 — kural motoru + katalog fiyat köprüsü */
(function () {
  window.__PFOS_KEY_KATEGORI__ = { keys: {} };
  window.PFOS_EQ_FIYATLAR = {};
  fetch('/data/pfos-key-to-kategori.json', { cache: 'default' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) { window.__PFOS_KEY_KATEGORI__ = j || { keys: {} }; })
    .catch(function () {});
  var apiBase = (function () {
    if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\/$/, '');
    var host = (location.hostname || '').toLowerCase();
    if (host === '127.0.0.1' || host === 'localhost') return 'http://127.0.0.1:3001/api';
    return '/api';
  })();
  fetch(apiBase + '/fiyatlar', { cache: 'default' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && j.success && j.data && typeof j.data === 'object') {
        window.PFOS_EQ_FIYATLAR = j.data;
        if (window.EqustoPfosCalc && EqustoPfosCalc.hydrateCatalogPrices) {
          EqustoPfosCalc.hydrateCatalogPrices(window.PFOS_EQ_FIYATLAR);
        }
      }
    })
    .catch(function () {});
  if (window.EqustoPfosRuleEngine && EqustoPfosRuleEngine.init) EqustoPfosRuleEngine.init();
})();
})();
