/**
 * Tüketici vitrin fiyatı — shop sayfalarında ₺… TL (/besos hariç).
 */
(function (global) {
  "use strict";

  var PRICE_SUFFIX = " TL";

  function parseTrAmount(raw) {
    var cleaned = String(raw || "")
      .replace(/₺/g, "")
      .replace(/\+?\s*KDV.*/gi, "")
      .replace(/KDV\s*dahil/gi, "")
      .trim()
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", ".");
    var n = parseFloat(cleaned);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
  }

  function extractKdvDahilFromPriceString(price) {
    if (!price) return 0;
    var full = String(price);
    var dahil = full.match(/K\s*D\s*V\s*[Dd]ahil[^\d]*([\d.,]+)/i);
    if (dahil) {
      var v = parseTrAmount(dahil[1]);
      if (v > 0) return v;
    }
    var line0 = full.split("\n")[0] || "";
    if (/\+?\s*K\s*D\s*V/i.test(line0)) {
      var net = parseTrAmount(line0);
      if (net > 0) return Math.round(net * 1.2 * 100) / 100;
    }
    if (/KDV\s*dahil/i.test(line0)) return parseTrAmount(line0);
    return parseTrAmount(line0);
  }

  function resolveKdvDahilTl(row) {
    if (!row) return 0;
    if (row.fiyat_bekleniyor) return 0;
    var fiyatTl = Number(row.fiyat_tl);
    if (Number.isFinite(fiyatTl) && fiyatTl > 0) {
      return Math.round(fiyatTl * 100) / 100;
    }
    var fromPrice = extractKdvDahilFromPriceString(row.price);
    if (fromPrice > 0) return fromPrice;
    if (global.EqustoKurLive && typeof global.EqustoKurLive.computeRowPrices === "function") {
      var rate = global.EqustoKurLive.getRate && global.EqustoKurLive.getRate();
      if (rate) {
        var px = global.EqustoKurLive.computeRowPrices(row, rate);
        if (px && px.fiyat_tl > 0) return px.fiyat_tl;
      }
    }
    return 0;
  }

  function isQuoteOnly(row) {
    if (!row) return false;
    if (row.fiyat_bekleniyor) return true;
    return /teklif\s+için/i.test(String(row.price || ""));
  }

  function normalizePriceLabel(line) {
    if (!line) return "";
    var s = String(line).trim();
    if (/KDV\s*dahil/i.test(s)) {
      return s.replace(/\s*KDV\s*dahil\s*/gi, PRICE_SUFFIX);
    }
    if (/₺/.test(s) && !/\bTL\s*$/i.test(s)) {
      s = s + PRICE_SUFFIX;
    }
    return s;
  }

  function formatAmount(n) {
    var formatted = n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return "₺" + formatted + PRICE_SUFFIX;
  }

  function formatCard(row, opts) {
    opts = opts || {};
    if (isQuoteOnly(row)) {
      return opts.quoteLabel || "Teklif için iletişim";
    }
    var n = resolveKdvDahilTl(row);
    if (!(n > 0)) {
      var fallback = String((row && row.price) || "");
      if (/\+?\s*K\s*D\s*V/i.test(fallback)) {
        var netOnly = extractKdvDahilFromPriceString(fallback);
        if (netOnly > 0) n = netOnly;
      }
      if (!(n > 0)) return normalizePriceLabel(fallback.split("\n")[0] || "");
    }
    return formatAmount(n);
  }

  global.EqustoPriceDisplay = {
    parseTrAmount: parseTrAmount,
    extractKdvDahilFromPriceString: extractKdvDahilFromPriceString,
    resolveKdvDahilTl: resolveKdvDahilTl,
    formatCard: formatCard,
    isQuoteOnly: isQuoteOnly,
  };
})(typeof window !== "undefined" ? window : globalThis);
