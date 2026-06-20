;(function () {
  "use strict";

  function nz(v) {
    return v == null ? "" : String(v).trim();
  }

  /** 8221.5 → "8.221,50 €" */
  function formatEurKdvDahil(amount) {
    var n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return "";
    var fixed = (Math.round(n * 100) / 100).toFixed(2);
    var parts = fixed.split(".");
    var intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return intPart + "," + parts[1] + " \u20ac";
  }

  function getPricing(product) {
    if (!product) return null;
    if (product.pricing && product.pricing.fiyatEurKdvDahil != null) {
      return product.pricing;
    }
    if (product.fiyatEurKdvDahil != null) {
      return { fiyatEurKdvDahil: product.fiyatEurKdvDahil, currency: "EUR" };
    }
    return null;
  }

  function priceLabel(product, opts) {
    opts = opts || {};
    var p = getPricing(product);
    if (!p) return opts.fallback || "";
    var formatted = formatEurKdvDahil(p.fiyatEurKdvDahil);
    if (!formatted) return opts.fallback || "";
    var kdvNote = opts.hideKdv ? "" : " TL";
    if (opts.style === "html") {
      return (
        '<span class="bes-price">' +
        '<strong>' +
        formatted +
        "</strong>" +
        (kdvNote ? '<span class="bes-price-kdv">' + kdvNote + "</span>" : "") +
        "</span>"
      );
    }
    return formatted + kdvNote;
  }

  window.EqBesosPricing = {
    formatEurKdvDahil: formatEurKdvDahil,
    getPricing: getPricing,
    priceLabel: priceLabel,
  };
})();
