/**
 * Admin fiyat listesi → vitrin (tip_kodu → TL).
 * Önce /api/fiyatlar; yoksa /data/fiyatlar.json (statik canlı).
 */
;(function (global) {
  'use strict';

  var cache = null;
  var inflight = null;

  function apiBase() {
    if (typeof global.EQUSTO_API_BASE === 'string') {
      return global.EQUSTO_API_BASE.replace(/\/$/, '');
    }
    var h = (global.location && global.location.hostname) || '';
    h = String(h).toLowerCase();
    if (h === '127.0.0.1' || h === 'localhost') return 'http://127.0.0.1:3001/api';
    return '/api';
  }

  function dataHref() {
    if (global.EqustoEcomData && typeof global.EqustoEcomData.publicDataFileHref === 'function') {
      try {
        return global.EqustoEcomData.publicDataFileHref('data/fiyatlar.json');
      } catch (_) {}
    }
    return '/data/fiyatlar.json';
  }

  function fetchJson(url, opts) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var to =
      ctrl &&
      setTimeout(function () {
        try {
          ctrl.abort();
        } catch (_) {}
      }, 8000);
    var init = Object.assign({ headers: { Accept: 'application/json' } }, opts || {});
    if (ctrl) init.signal = ctrl.signal;
    return fetch(url, init).then(function (r) {
      if (to) clearTimeout(to);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function formatTl(v) {
    try {
      return v.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (_) {
      return String(v);
    }
  }

  function getMap() {
    return global.EQ_FIYATLAR && typeof global.EQ_FIYATLAR === 'object' ? global.EQ_FIYATLAR : {};
  }

  function resolveKeys(row) {
    var keys = [];
    if (!row) return keys;
    var raw = row.raw || row;
    var tip = row.tip_kodu || raw.tip_kodu || raw.tipKodu;
    if (tip) keys.push(String(tip).trim());
    var cat = row.c || raw.category || raw.kategori;
    if (cat) keys.push(String(cat).trim());
    var sku = raw.sku;
    if (sku) keys.push(String(sku).trim());
    return keys;
  }

  function lookupPrice(row) {
    var map = getMap();
    var keys = resolveKeys(row);
    for (var i = 0; i < keys.length; i++) {
      if (Object.prototype.hasOwnProperty.call(map, keys[i])) {
        var v = Number(map[keys[i]]);
        if (Number.isFinite(v) && v > 0) return v;
      }
    }
    return null;
  }

  function applyToRow(row) {
    if (!row) return row;
    var v = lookupPrice(row);
    if (v == null) return row;
    row.p = formatTl(v);
    if (row.raw) {
      row.raw.price = row.p;
      row.raw.fiyat_tl = v;
    }
    return row;
  }

  function applyToRaw(item) {
    if (!item) return item;
    var v = lookupPrice({ raw: item });
    if (v == null) return item;
    item.price = formatTl(v) + ' TL';
    item.fiyat_tl = v;
    return item;
  }

  function applyToList(list) {
    if (!list || !list.length) return list;
    for (var i = 0; i < list.length; i++) applyToRow(list[i]);
    return list;
  }

  function ingest(j) {
    if (j && j.success && j.data && typeof j.data === 'object') {
      global.EQ_FIYATLAR = j.data;
      global.EQUSTO_FIYATLAR = j.data;
      global.PFOS_EQ_FIYATLAR = j.data;
      cache = j.data;
      if (global.EqustoPfosCalc && typeof global.EqustoPfosCalc.hydrateCatalogPrices === 'function') {
        try {
          global.EqustoPfosCalc.hydrateCatalogPrices(cache);
        } catch (_) {}
      }
      return cache;
    }
    if (j && typeof j === 'object' && !j.success) {
      global.EQ_FIYATLAR = j;
      global.EQUSTO_FIYATLAR = j;
      cache = j;
      return cache;
    }
    return getMap();
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    if (inflight) return inflight;
    inflight = fetchJson(apiBase() + '/fiyatlar')
      .then(function (j) {
        return ingest(j);
      })
      .catch(function () {
        return fetchJson(dataHref()).then(function (j) {
          return ingest(j);
        });
      })
      .catch(function () {
        return {};
      })
      .then(function (map) {
        inflight = null;
        return map;
      });
    return inflight;
  }

  global.EqFiyatlarBridge = {
    load: load,
    applyToList: applyToList,
    applyToRow: applyToRow,
    applyToRaw: applyToRaw,
    lookupPrice: lookupPrice,
    getMap: getMap,
  };
  global.EqustoFiyatlar = global.EqFiyatlarBridge;
})(typeof window !== 'undefined' ? window : global);
