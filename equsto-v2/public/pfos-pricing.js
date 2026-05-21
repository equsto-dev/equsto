;(function () {
  'use strict';
  /**
   * PFOS fiyat algoritması (Faz 1)
   * 1) API fiyat matrisi (tip_kodu)
   * 2) Shop katalog PDP fiyatı
   * 3) Referans birim fiyat (kod)
   * 4) Kalan bütçe, referans ağırlıklarına göre satırlara dağıtılır → genel toplam = tahmini()
   */

  var REF_TRY_BY_KOD = {
    'EQ-DAV-001': 42000,
    'EQ-DAV-002': 18500,
    'EQ-PIS-001': 780000,
    'EQ-PIS-002': 145000,
    'EQ-PIS-003': 88000,
    'EQ-PIS-010': 115000,
    'EQ-PIS-011': 125000,
    'EQ-PIS-012': 320000,
    'EQ-PIS-013': 165000,
    'EQ-PIS-014': 220000,
    'EQ-PIS-015': 98000,
    'EQ-PIS-016': 72000,
    'EQ-PIS-020': 85000,
    'EQ-PIS-021': 130000,
    'EQ-BKR-001': 195000,
    'EQ-BKR-002': 72000,
    'EQ-BKR-003': 285000,
    'EQ-CAT-001': 350000,
    'EQ-STK-001': 420000,
    'EQ-KAF-001': 280000,
    'EQ-KAF-002': 45000,
    'EQ-ICE-001': 52000,
    'EQ-BAR-001': 28000,
    'EQ-SOG-001': 98000,
    'EQ-SOG-002': 72000,
    'EQ-SOG-003': 185000,
    'EQ-SOG-004': 65000,
    'EQ-SOG-005': 85000,
    'EQ-SOG-010': 125000,
    'EQ-YIK-001': 720000,
    'EQ-YIK-002': 98000,
    'EQ-YIK-003': 65000,
    'EQ-TEZ-001': 14000,
    'EQ-TEZ-002': 14000,
    'EQ-KSP-001': 95000,
    'EQ-KSP-002': 125000,
    'EQ-YRD-001': 38000,
  };

  function parsePriceTL(raw) {
    if (window.EqustoEngine && typeof EqustoEngine.parsePriceTL === 'function') {
      return EqustoEngine.parsePriceTL(raw);
    }
    var s = String(raw || '')
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3})/g, '')
      .replace(',', '.');
    var n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function norm(s) {
    return String(s == null ? '' : s).trim().toLocaleLowerCase('tr');
  }

  function findCatalogProduct(row) {
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.findShopMatch === 'function') {
      var hit = EqustoPfosCalc.findShopMatch(row, window.__PFOS_CATALOG_POOL__ || []);
      if (!hit) return null;
      return {
        b: hit.brand || hit.b || '',
        n: hit.name || hit.n || '',
        p: hit.price || hit.p || '',
        tip_kodu: row.tip_kodu || '',
      };
    }
    return null;
  }

  function refUnit(row) {
    if (!row) return 0;
    if (row.refTry != null && Number(row.refTry) > 0) return Number(row.refTry);
    return REF_TRY_BY_KOD[row.kod] || 0;
  }

  function resolveBase(row) {
    var birim = 0;
    var kaynak = 'referans';
    var prod = findCatalogProduct(row);
    var fiyatMap = window.PFOS_EQ_FIYATLAR || {};

    if (prod && prod.tip_kodu && Number(fiyatMap[prod.tip_kodu]) > 0) {
      birim = Number(fiyatMap[prod.tip_kodu]);
      kaynak = 'matris';
    } else if (prod && prod.p) {
      birim = parsePriceTL(prod.p);
      if (birim > 0) kaynak = 'katalog';
    }

    if (!birim) {
      birim = refUnit(row);
      kaynak = birim > 0 ? 'referans' : 'dagitim';
    }

    return { birim: birim, kaynak: kaynak, prod: prod, locked: kaynak === 'matris' || kaynak === 'katalog' };
  }

  function round100(n) {
    return Math.round(Number(n) / 100) * 100;
  }

  /**
   * Satır birim fiyatlarını hedef toplama (KDV hariç) oturtur.
   */
  function distributeRows(rows, targetTotal) {
    var target = Math.max(0, Math.round(Number(targetTotal) || 0));
    if (!rows || !rows.length) return [];

    var items = rows.map(function (r) {
      var base = resolveBase(r);
      var adet = Math.max(1, Math.round(Number(r.adet) || 1));
      var w = (base.birim > 0 ? base.birim : 1) * adet;
      return {
        row: r,
        adet: adet,
        base: base,
        weight: w,
        birim: base.birim,
        kaynak: base.kaynak,
        prod: base.prod,
        locked: base.locked,
      };
    });

    var lockedSum = 0;
    var flex = [];
    items.forEach(function (it) {
      if (it.locked) lockedSum += it.birim * it.adet;
      else flex.push(it);
    });

    var budget = Math.max(0, target - lockedSum);
    var flexWeight = flex.reduce(function (a, it) {
      return a + it.weight;
    }, 0);

    if (!flex.length && lockedSum > 0 && lockedSum !== target) {
      var scale = target / lockedSum;
      items.forEach(function (it) {
        if (it.locked) it.birim = round100(it.birim * scale);
        it.kaynak = 'olcek';
      });
    } else if (flex.length) {
      var allocated = 0;
      flex.forEach(function (it, idx) {
        var share = flexWeight > 0 ? it.weight / flexWeight : 1 / flex.length;
        var lineTotal =
          idx === flex.length - 1
            ? Math.max(0, budget - allocated)
            : round100(budget * share);
        if (idx < flex.length - 1) allocated += lineTotal;
        it.birim = Math.max(100, round100(lineTotal / it.adet));
        it.kaynak = it.base.kaynak === 'referans' ? 'referans' : 'dagitim';
      });
    } else if (!items.length) {
      /* boş */
    } else {
      var eqShare = target / items.length;
      items.forEach(function (it) {
        it.birim = Math.max(100, round100(eqShare / it.adet));
        it.kaynak = 'dagitim';
      });
    }

    var out = items.map(function (it) {
      var o = Object.assign({}, it.row, {
        adet: it.adet,
        birim: it.birim,
        fiyat_kaynak: it.kaynak,
      });
      if (it.prod) {
        if (it.prod.tip_kodu) o.tip_kodu = it.prod.tip_kodu;
        if (it.prod.n && !o.catalogAd) o.catalogAd = it.prod.n;
        if (it.prod.b && !o.catalogMarka) o.catalogMarka = it.prod.b;
      }
      return o;
    });

    var sum = out.reduce(function (a, r) {
      return a + r.birim * r.adet;
    }, 0);
    var diff = target - sum;
    if (diff !== 0 && out.length) {
      var last = out[out.length - 1];
      var fix = Math.max(100, last.birim + Math.round(diff / last.adet));
      last.birim = fix;
    }

    return out;
  }

  function allRowsNetPriced(rows) {
    return (
      (rows || []).length > 0 &&
      rows.every(function (r) {
        return r.fiyat_net === true && Number(r.birim) > 0;
      })
    );
  }

  /** Katalog net fiyatları — tahmini() dağıtımı yapılmaz */
  function priceRowsNet(rows) {
    return (rows || []).map(function (r) {
      return Object.assign({}, r, {
        birim: Math.round(Number(r.birim) || 0),
        fiyat_kaynak: r.fiyat_kaynak || 'net',
        fiyat_net: true,
      });
    });
  }

  function priceRows(rows, targetTotal) {
    if (allRowsNetPriced(rows)) {
      return priceRowsNet(rows);
    }
    return distributeRows(rows || [], targetTotal);
  }

  function quoteTotal(rows, fallbackTotal) {
    var t = (rows || []).reduce(function (a, r) {
      return a + (Number(r.birim) || 0) * (Number(r.adet) || 1);
    }, 0);
    if (t > 0) return t;
    return Math.max(0, Math.round(Number(fallbackTotal) || 0));
  }

  window.EqustoPfosPricing = {
    refUnit: refUnit,
    resolveBase: resolveBase,
    allRowsNetPriced: allRowsNetPriced,
    priceRowsNet: priceRowsNet,
    priceRows: priceRows,
    quoteTotal: quoteTotal,
    REF_TRY_BY_KOD: REF_TRY_BY_KOD,
  };
})();
