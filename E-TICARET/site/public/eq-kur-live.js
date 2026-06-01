/**
 * Mağaza fiyatları — TCMB EUR/TRY (/api/kur), varsayılan 10 dk yenileme.
 * JSON'da EUR + iskonto kalır; TL satış fiyatı gösterimde hesaplanır.
 */
;(function () {
  "use strict";

  var DEFAULT_POLL_MS = 600000;
  var MIN_POLL_MS = 60000;
  var KDV_ORAN = 20;

  var state = {
    rate: null,
    fetchedAt: 0,
    meta: null,
    loading: false,
  };

  function pollMs() {
    var n = Number(
      (typeof window.EQUSTO_KUR_POLL_MS !== "undefined" && window.EQUSTO_KUR_POLL_MS) ||
        (document.documentElement &&
          document.documentElement.getAttribute("data-eq-kur-poll-ms"))
    );
    if (!Number.isFinite(n) || n < MIN_POLL_MS) return DEFAULT_POLL_MS;
    return n;
  }

  function isOztiRow(row) {
    if (!row) return false;
    var k = String(
      row.fiyat_kaynagi || row.kaynak || row.kaynak_fiyat_listesi || ""
    );
    if (/^ozti|ozti-fiyat/i.test(k)) return true;
    if (/öztiryaki|oztiryaki/i.test(String(row.brand || ""))) return true;
    return String(row.dept || "") === "set-ustu-mutfak";
  }

  function isOztiListeTl(row) {
    if (!row) return false;
    var p = String(row.para_birimi || "").trim().toUpperCase();
    return p === "TL" || p === "TRY";
  }

  function isEurPricedRow(row) {
    if (!row || isOztiListeTl(row)) return false;
    return Number(row.liste_fiyati_eur) > 0 || Number(row.satis_eur_indirimli) > 0;
  }

  function netTlFromOztiRow(row) {
    if (!row || !isOztiListeTl(row)) return 0;
    var pre = Number(
      row.satis_fiyati_tl || row.alis_fiyati_tl || row.fiyat_tl_net
    );
    if (pre > 0) return pre;
    var liste = Number(row.liste_fiyati_tl || row.liste_fiyati || 0);
    if (liste > 0) return netEurFromRow({ liste_fiyati_eur: liste, bayi_iskonto: row.bayi_iskonto, iskonto_oran: row.iskonto_oran, iskonto_yuzde: row.iskonto_yuzde });
    return 0;
  }

  function netEurFromRow(row) {
    var pre = Number(
      row.satis_fiyati_eur ||
        row.satis_eur_indirimli ||
        row.alis_fiyati_eur ||
        row.alis_fiyati ||
        row.iskontolu_fiyat
    );
    if (pre > 0) return pre;
    if (window.EqustoPricing && typeof window.EqustoPricing.hesaplaBirimFiyat === "function") {
      var calc = window.EqustoPricing.hesaplaBirimFiyat(row, {}, { kur_eur_try: 1 });
      if (calc && calc.net_eur > 0) return calc.net_eur;
    }
    var liste = Number(row.liste_fiyati_eur || row.liste_fiyati || 0);
    if (liste <= 0) return 0;
    var isk = Number(
      row.iskonto_oran != null
        ? row.iskonto_oran
        : row.iskonto_yuzde != null
          ? row.iskonto_yuzde
          : NaN
    );
    if (!(isk > 0) && row.bayi_iskonto > 0 && row.bayi_iskonto < 1) {
      /* Öztiryakiler Excel: bayi_iskonto = indirim oranı (0,73 → %73) */
      isk = row.bayi_iskonto * 100;
    }
    if (isk > 0 && isk < 1) isk = isk * 100;
    if (!(isk > 0)) return 0;
    return Math.round(liste * (1 - isk / 100) * 100) / 100;
  }

  function fmtTryWhole(n) {
    return (
      "₺" +
      Math.round(n).toLocaleString("tr-TR", { maximumFractionDigits: 0 }) +
      ",00"
    );
  }

  function priceStringsFromNetTl(netTl) {
    var kdvDahil = Math.round(netTl * (1 + KDV_ORAN / 100));
    return {
      fiyat_tl: kdvDahil,
      fiyat_tl_net: netTl,
      kdv_oran: KDV_ORAN,
      price: fmtTryWhole(kdvDahil) + " KDV dahil",
      priceShort: fmtTryWhole(kdvDahil),
    };
  }

  function computeRowPrices(row, rate) {
    if (!row) return null;
    if (isOztiListeTl(row)) {
      var netTlDirect = netTlFromOztiRow(row);
      if (!(netTlDirect > 0)) return null;
      var tlOut = priceStringsFromNetTl(netTlDirect);
      tlOut.para_birimi = "TL";
      return tlOut;
    }
    if (!rate || rate <= 0) return null;
    if (!isEurPricedRow(row) && !isOztiRow(row)) return null;
    var netEur = netEurFromRow(row);
    if (!(netEur > 0)) return null;
    var netTl = Math.round(netEur * rate);
    var out = priceStringsFromNetTl(netTl);
    out.kur_eur_try = rate;
    out.net_eur = netEur;
    return out;
  }

  function applyRowPrices(row) {
    if (!row || !state.rate) return row;
    var px = computeRowPrices(row, state.rate);
    if (!px) return row;
    var copy = Object.assign({}, row, {
      price: px.price,
      fiyat_tl: px.fiyat_tl,
      kur_eur_try_canli: px.kur_eur_try,
    });
    return copy;
  }

  function dispatchUpdate() {
    try {
      document.dispatchEvent(
        new CustomEvent("equsto:kur-updated", { detail: { rate: state.rate, meta: state.meta } })
      );
    } catch (_) {}
  }

  function fetchKur(force) {
    if (state.loading && !force) return Promise.resolve(state);
    state.loading = true;
    return fetch("/api/kur", { headers: { Accept: "application/json" }, cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        state.loading = false;
        if (!data || !data.success || !(Number(data.rate) > 0)) return state;
        var prev = state.rate;
        state.rate = Number(data.rate);
        state.fetchedAt = Date.now();
        state.meta = data;
        if (prev !== state.rate) dispatchUpdate();
        return state;
      })
      .catch(function () {
        state.loading = false;
        return state;
      });
  }

  function getRate() {
    return state.rate;
  }

  function getMeta() {
    return state.meta;
  }

  function priceForRow(row) {
    if (!row) return "";
    var px = state.rate ? computeRowPrices(row, state.rate) : null;
    if (px) return px.priceShort;
    return String(row.price || "").split("\n")[0];
  }

  function start() {
    fetchKur(true);
    if (window.__eqKurLiveTimer) clearInterval(window.__eqKurLiveTimer);
    window.__eqKurLiveTimer = setInterval(function () {
      fetchKur(true);
    }, pollMs());
  }

  window.EqustoKurLive = {
    start: start,
    fetchKur: fetchKur,
    getRate: getRate,
    getMeta: getMeta,
    applyRowPrices: applyRowPrices,
    priceForRow: priceForRow,
    computeRowPrices: computeRowPrices,
    pollMs: pollMs,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
