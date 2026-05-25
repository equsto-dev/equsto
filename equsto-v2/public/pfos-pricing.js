;(function () {
  'use strict';
  /**
   * PFOS fiyat — yalnızca e-ticaret (EqustoShopCatalog / ekipmanlar.json).
   * Ürün e-ticarette yoksa veya fiyat çözülemezse: "hariç".
   */

  function parsePriceTL(raw) {
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.parseShopPriceTry === 'function') {
      return EqustoPfosCalc.parseShopPriceTry(raw);
    }
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

  function findEcomProduct(row) {
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.findShopMatch === 'function') {
      return EqustoPfosCalc.findShopMatch(row, window.__PFOS_CATALOG_POOL__ || []);
    }
    return null;
  }

  function isRowHaric(row) {
    if (window.EqustoPfosCalc && typeof EqustoPfosCalc.isRowHaric === 'function') {
      return EqustoPfosCalc.isRowHaric(row);
    }
    return !!(row && (row.fiyat_haric === true || row.fiyat_kaynak === 'haric'));
  }

  function applyEcomPrice(row) {
    if (!row) return row;
    if (row.fiyat_kaynak === 'eticaret' && Number(row.birim) > 0 && row.fiyat_net) {
      var adet0 = Math.max(1, Number(row.adet) || 1);
      return Object.assign({}, row, {
        fiyat_haric: false,
        lineTotal: Math.round(Number(row.birim)) * adet0,
      });
    }
    var prod = findEcomProduct(row);
    var birim = prod ? parsePriceTL(prod) : 0;
    var adet = Math.max(1, Number(row.adet) || 1);
    if (birim > 0 && prod) {
      return Object.assign({}, row, {
        birim: birim,
        fiyat_net: true,
        fiyat_haric: false,
        fiyat_kaynak: 'eticaret',
        lineTotal: birim * adet,
        pfShopMatch: true,
      });
    }
    return Object.assign({}, row, {
      birim: 0,
      lineTotal: 0,
      fiyat_net: false,
      fiyat_haric: true,
      fiyat_kaynak: 'haric',
    });
  }

  function normalizeNetRow(r) {
    if (isRowHaric(r)) {
      return Object.assign({}, r, {
        birim: 0,
        lineTotal: 0,
        fiyat_net: false,
        fiyat_haric: true,
        fiyat_kaynak: 'haric',
      });
    }
    var adet = Math.max(1, Number(r.adet) || 1);
    var birim = Math.round(Number(r.birim) || 0);
    var line =
      r.lineTotal != null ? Math.round(Number(r.lineTotal)) : birim * adet;
    if (birim <= 0 && line > 0) birim = Math.round(line / adet);
    else if (line > 0 && birim > 0 && Math.abs(birim * adet - line) > 2) {
      birim = Math.round(line / adet);
    }
    if (!line && birim > 0) line = birim * adet;
    return Object.assign({}, r, {
      birim: birim,
      lineTotal: line,
      fiyat_kaynak: r.fiyat_kaynak || 'eticaret',
      fiyat_net: birim > 0,
      fiyat_haric: false,
    });
  }

  /** E-ticaret fiyatları — tahmini() dağıtımı yok */
  function priceRowsEcom(rows) {
    return (rows || []).map(function (r) {
      var priced = applyEcomPrice(r);
      return normalizeNetRow(priced);
    });
  }

  function priceRowsNet(rows) {
    return priceRowsEcom(rows);
  }

  function priceRows(rows) {
    return priceRowsEcom(rows || []);
  }

  function quoteTotal(rows, fallbackTotal) {
    var t = (rows || []).reduce(function (a, r) {
      if (isRowHaric(r)) return a;
      if (window.EqustoPfosCalc && typeof EqustoPfosCalc.rowLineTotal === 'function') {
        return a + EqustoPfosCalc.rowLineTotal(r);
      }
      return a + (Number(r.birim) || 0) * (Number(r.adet) || 1);
    }, 0);
    return Math.max(0, Math.round(t));
  }

  function allRowsNetPriced(rows) {
    return (rows || []).some(function (r) {
      return !isRowHaric(r) && Number(r.birim) > 0;
    });
  }

  function hasCatalogNetPrices(rows) {
    return allRowsNetPriced(rows);
  }

  window.EqustoPfosPricing = {
    findEcomProduct: findEcomProduct,
    applyEcomPrice: applyEcomPrice,
    isRowHaric: isRowHaric,
    allRowsNetPriced: allRowsNetPriced,
    hasCatalogNetPrices: hasCatalogNetPrices,
    priceRowsEcom: priceRowsEcom,
    priceRowsNet: priceRowsNet,
    priceRows: priceRows,
    quoteTotal: quoteTotal,
  };
})();
