/**
 * Admin fiyat listesi (tip_kodu → TL) + Öztiryakiler EUR (liste × (1 − bayi iskonto) × kur).
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

  function isOztiRaw(raw) {
    if (!raw) return false;
    var k = String(raw.fiyat_kaynagi || raw.kaynak || raw.kaynak_fiyat_listesi || '');
    if (/^ozti|ozti-fiyat/i.test(k)) return true;
    if (/öztiryaki|oztiryaki/i.test(String(raw.brand || ''))) return true;
    return false;
  }

  function oztiHasEurPrice(raw) {
    return (
      Number(raw.satis_fiyati_eur || raw.satis_eur_indirimli || raw.alis_fiyati_eur) > 0 ||
      (Number(raw.liste_fiyati_eur) > 0 &&
        raw.bayi_iskonto > 0 &&
        raw.bayi_iskonto < 1)
    );
  }

  function lookupOztiTl(raw) {
    if (!raw || !isOztiRaw(raw) || !oztiHasEurPrice(raw)) return null;
    if (!global.EqustoKurLive || typeof global.EqustoKurLive.computeRowPrices !== 'function') {
      return null;
    }
    var rate = global.EqustoKurLive.getRate && global.EqustoKurLive.getRate();
    if (!(rate > 0)) return null;
    var px = global.EqustoKurLive.computeRowPrices(raw, rate);
    if (px && px.fiyat_tl > 0) return px.fiyat_tl;
    return null;
  }

  function oztiPriceLine(raw) {
    if (!raw || !isOztiRaw(raw)) return '';
    if (global.EqustoKurLive && typeof global.EqustoKurLive.priceForRow === 'function') {
      var live = global.EqustoKurLive.priceForRow(raw);
      if (live) return live;
    }
    var satis = Number(raw.satis_fiyati_eur || raw.satis_eur_indirimli || raw.alis_fiyati_eur);
    if (satis > 0) {
      return (
        '€' +
        satis.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
        ' + KDV'
      );
    }
    return String(raw.price || '').split('\n')[0];
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
    var sku = raw.sku || raw.urun_kodu || raw.stok_no;
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
    var raw = row.raw || row;
    var v = lookupPrice(row);
    if (v == null) v = lookupOztiTl(raw);
    if (v != null) {
      row.p = formatTl(v);
      if (row.raw) {
        row.raw.price = row.p;
        row.raw.fiyat_tl = v;
      }
      return row;
    }
    var ozLine = oztiPriceLine(raw);
    if (ozLine) {
      row.p = ozLine.replace(/\s*\+?\s*KDV.*$/i, '').trim() || ozLine;
      if (row.raw) row.raw.price = ozLine;
    }
    return row;
  }

  function applyToRaw(item) {
    if (!item) return item;
    if (global.EqustoKurLive && typeof global.EqustoKurLive.applyRowPrices === 'function') {
      item = global.EqustoKurLive.applyRowPrices(item) || item;
    }
    var v = lookupPrice({ raw: item });
    if (v == null) v = lookupOztiTl(item);
    if (v != null) {
      item.price = formatTl(v) + ' TL';
      item.fiyat_tl = v;
      return item;
    }
    var line = oztiPriceLine(item);
    if (line) item.price = line;
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

  function fetchKurIfNeeded() {
    if (global.EqustoKurLive && typeof global.EqustoKurLive.fetchKur === 'function') {
      return global.EqustoKurLive.fetchKur(true).catch(function () {});
    }
    return Promise.resolve();
  }

  function load() {
    if (cache) {
      return fetchKurIfNeeded().then(function () {
        return cache;
      });
    }
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
        return fetchKurIfNeeded().then(function () {
          return map;
        });
      })
      .then(function (map) {
        inflight = null;
        return map;
      });
    return inflight;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('equsto:kur-updated', function () {
      try {
        if (typeof global.__eqDeptPlpRefreshPrices === 'function') {
          global.__eqDeptPlpRefreshPrices();
        }
      } catch (_) {}
    });
  }

  global.EqFiyatlarBridge = {
    load: load,
    applyToList: applyToList,
    applyToRow: applyToRow,
    applyToRaw: applyToRaw,
    lookupPrice: lookupPrice,
    lookupOztiTl: lookupOztiTl,
    getMap: getMap,
  };
  global.EqustoFiyatlar = global.EqFiyatlarBridge;
})(typeof window !== 'undefined' ? window : global);
