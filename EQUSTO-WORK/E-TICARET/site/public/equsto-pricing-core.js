;(function () {
  'use strict';
  /**
   * Equsto B2B fiyat çekirdeği (Mutbex/T-Soft modelinin sadeleştirilmiş hali).
   * İki saklanan fiyat: liste_fiyati (€), alis_fiyati (€).
   * Teklif satırı: liste × (1 − iskonto) × kur → TL (KDV ayrı).
   *
   * @see notlar/MUTBEX-T-SOFT-FIYATLANDIRMA.md
   */

  var DEFAULT_KDV = 20;

  function num(v, fallback) {
    var n = Number(v);
    return Number.isFinite(n) ? n : fallback != null ? fallback : 0;
  }

  function pickIskonto(product, customerCtx) {
    var p = product || {};
    var c = customerCtx || {};
    var stok = String(p.stok_no || p.stokNo || '').trim();

    if (c.productIskonto && stok && c.productIskonto[stok] != null) {
      return num(c.productIskonto[stok], 0);
    }
    if (c.iskontoOran != null) return num(c.iskontoOran, 0);
    if (c.group && c.group.default_iskonto_oran != null) {
      return num(c.group.default_iskonto_oran, 0);
    }
    if (p.iskonto_oran != null) return num(p.iskonto_oran, 0);
    if (p.bayi_iskonto != null && p.bayi_iskonto > 0 && p.bayi_iskonto < 1) {
      return num(p.bayi_iskonto, 0) * 100;
    }
    return 0;
  }

  function pickListeEur(product) {
    var p = product || {};
    if (num(p.liste_fiyati, 0) > 0) return num(p.liste_fiyati, 0);
    if (num(p.liste_fiyati_eur, 0) > 0) return num(p.liste_fiyati_eur, 0);
    if (num(p.fiyat, 0) > 0 && String(p.para_birimi || 'EUR').toUpperCase() === 'EUR') {
      return num(p.fiyat, 0);
    }
    if (num(p.iskontolu_fiyat, 0) > 0 && num(p.fiyat, 0) > 0) {
      return num(p.fiyat, 0);
    }
    return 0;
  }

  function pickAlisEur(product) {
    var p = product || {};
    if (num(p.alis_fiyati, 0) > 0) return num(p.alis_fiyati, 0);
    if (num(p.alis_fiyati_eur, 0) > 0) return num(p.alis_fiyati_eur, 0);
    return 0;
  }

  /**
   * @param {object} product - stok_no, liste_fiyati, alis_fiyati, kdv_orani
   * @param {object} customerCtx - { group, iskontoOran, productIskonto: { stok: % } }
   * @param {object} quoteCtx - { kur_eur_try, kdv_dahil_mi, kur_kaynagi }
   */
  function hesaplaBirimFiyat(product, customerCtx, quoteCtx) {
    var q = quoteCtx || {};
    var kur = Math.max(0, num(q.kur_eur_try != null ? q.kur_eur_try : q.kur, 0));
    var kdvOran = num(
      product && product.kdv_orani != null ? product.kdv_orani : q.kdv_orani,
      DEFAULT_KDV
    );
    var listeEur = pickListeEur(product);
    var iskontoOran = pickIskonto(product, customerCtx);
    var netEur = listeEur * (1 - iskontoOran / 100);
    var birimTry = netEur * kur;
    var kdvTry = birimTry * (kdvOran / 100);
    var birimTryKdvDahil = birimTry + kdvTry;
    var alisEur = pickAlisEur(product);
    var markupPct =
      alisEur > 0 && netEur > 0 ? Math.round(((netEur / alisEur - 1) * 100) * 10) / 10 : null;

    return {
      stok_no: String((product && (product.stok_no || product.stokNo)) || '').trim(),
      liste_eur: listeEur,
      alis_eur: alisEur,
      iskonto_oran: iskontoOran,
      net_eur: netEur,
      kur_eur_try: kur,
      kur_kaynagi: q.kur_kaynagi || q.kurKaynagi || '',
      kdv_oran: kdvOran,
      kdv_dahil_mi: !!q.kdv_dahil_mi,
      birim_try: birimTry,
      kdv_try: kdvTry,
      birim_try_kdv_dahil: birimTryKdvDahil,
      markup_net_over_alis_pct: markupPct,
      kaynak: listeEur > 0 ? 'liste_eur' : 'eksik',
    };
  }

  /** T-Soft tarzı: alış × kur × (1+marj) → liste TL (KDV hariç) */
  function listeTlFromAlis(alisEur, kur, karMarjiPct, kdvOran) {
    var alis = num(alisEur, 0);
    var k = num(kur, 0);
    var marj = num(karMarjiPct, 0) / 100;
    var netTry = alis * k * (1 + marj);
    var kdv = num(kdvOran, DEFAULT_KDV) / 100;
    return {
      liste_try_kdv_haric: netTry,
      liste_try_kdv_dahil: netTry * (1 + kdv),
    };
  }

  /** Üye + havale zinciri (B2C Mutbex) */
  function mutbexRetailTry(listeTryKdvHaric, opts) {
    var o = opts || {};
    var base = num(listeTryKdvHaric, 0);
    var kdv = num(o.kdv_oran, DEFAULT_KDV) / 100;
    var uye = num(o.uye_grup_iskonto, 0) / 100;
    var havale = num(o.havale_iskonto, 3) / 100;
    var kdvDahilGoster = o.kdv_dahil_goster !== false;
    var brut = kdvDahilGoster ? base * (1 + kdv) : base;
    var afterUye = brut * (1 - uye);
    var afterHavale = afterUye * (1 - havale);
    return {
      liste_try_kdv_haric: base,
      perakende_try: afterUye,
      havale_try: afterHavale,
    };
  }

  function formatProformaLine(calc, currency) {
    var cur = currency || 'TRY';
    if (!calc || calc.kaynak === 'eksik') return null;
    return {
      liste_eur: calc.liste_eur,
      iskonto_pct: calc.iskonto_oran,
      net_eur: calc.net_eur,
      kur: calc.kur_eur_try,
      birim: cur === 'EUR' ? calc.net_eur : calc.birim_try,
      kdv_satir: calc.kdv_try,
      currency: cur,
    };
  }

  window.EqustoPricing = {
    DEFAULT_KDV: DEFAULT_KDV,
    hesaplaBirimFiyat: hesaplaBirimFiyat,
    listeTlFromAlis: listeTlFromAlis,
    mutbexRetailTry: mutbexRetailTry,
    formatProformaLine: formatProformaLine,
    pickListeEur: pickListeEur,
    pickIskonto: pickIskonto,
  };
})();
