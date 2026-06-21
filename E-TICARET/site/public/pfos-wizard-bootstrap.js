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
  fetch('/api/pfos/fiyat-map', { cache: 'default' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      if (j && typeof j === 'object') {
        window.PFOS_EQ_FIYATLAR = j;
        if (window.EqustoPfosCalc && EqustoPfosCalc.hydrateCatalogPrices) {
          EqustoPfosCalc.hydrateCatalogPrices(window.PFOS_EQ_FIYATLAR);
        }
      }
    })
    .catch(function () {});
  if (window.EqustoPfosRuleEngine && EqustoPfosRuleEngine.init) EqustoPfosRuleEngine.init();
})();
})();
