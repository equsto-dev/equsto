/**
 * Besos /besos/bardaklar|bar-ekipman/:slug — seed → E-PDP (açıklama + sepete ekle)
 */
(function () {
  "use strict";

  function isEn() {
    try {
      return window.eqLang === "en" || /^\/en(\/|$)/i.test(location.pathname || "");
    } catch (_) {
      return false;
    }
  }

  function besosUrbanBarFromPath() {
    var m = /\/(?:en\/)?besos\/(bardaklar|bar-ekipman)\/([^/?#]+)/i.exec(location.pathname || "");
    if (!m) return null;
    return { section: m[1], slug: decodeURIComponent(m[2]).toLowerCase() };
  }

  function escMiss(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  window.__eqBootBesosUrbanBarPdp = function () {
    var root = document.getElementById("eq-product-root");
    if (!root) return;

    var hit = besosUrbanBarFromPath();
    if (!hit) return;

    if (window.EqFilterColumn) {
      window.EqFilterColumn.buildBrands([], "", function () {});
    }

    var bcHome = document.getElementById("eq-product-bc-home");
    var besosHref =
      typeof window.equstoUrl === "function" ? window.equstoUrl("besos") : isEn() ? "/en/besos" : "/besos";
    if (bcHome) bcHome.href = besosHref;

    var seed = null;
    try {
      if (window.__EQ_PDP_SEED && typeof window.__EQ_PDP_SEED === "object") {
        seed = window.__EQ_PDP_SEED;
      }
    } catch (_) {}

    if (!seed) {
      root.innerHTML =
        '<div class="eq-product-miss">' +
        escMiss(isEn() ? "Product data could not be loaded." : "Ürün verisi yüklenemedi.") +
        "</div>";
      return;
    }

    if (window.EqFiyatlarBridge && window.EqFiyatlarBridge.applyToRaw) {
      try {
        window.EqFiyatlarBridge.applyToRaw(seed);
      } catch (_) {}
    }

    if (typeof window.__eqRenderProduct !== "function") {
      root.innerHTML =
        '<div class="eq-product-miss">' +
        escMiss(isEn() ? "Product renderer not ready." : "Ürün görüntüleyici hazır değil.") +
        "</div>";
      return;
    }

    try {
      window.__eqRenderProduct(seed, [seed]);
      root.classList.remove("eq-pdp-booting");
    } catch (err) {
      var msg = err && err.message ? String(err.message) : String(err);
      root.innerHTML =
        '<div class="eq-product-miss">' +
        escMiss(isEn() ? "Could not render product." : "Ürün sayfası oluşturulamadı.") +
        " " +
        escMiss(msg) +
        "</div>";
    }
  };
})();
