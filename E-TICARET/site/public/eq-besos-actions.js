;(function () {
  "use strict";

  var FALLBACK_EUR_TRY = 52.8238;

  function nz(v) {
    return v == null ? "" : String(v).trim();
  }

  function formatTryAmount(tl) {
    var n = Number(tl);
    if (!Number.isFinite(n) || n <= 0) return "";
    return n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function ensureEurTryRate() {
    return new Promise(function (resolve) {
      if (window.EqustoKurLive) {
        var cached = window.EqustoKurLive.getRate();
        if (cached > 0) {
          resolve(cached);
          return;
        }
        window.EqustoKurLive.fetchKur(true)
          .then(function () {
            var r = window.EqustoKurLive.getRate();
            resolve(r > 0 ? r : null);
          })
          .catch(function () {
            resolve(null);
          });
        return;
      }
      fetch("/api/kur", { headers: { Accept: "application/json" }, cache: "no-store" })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data && data.success && Number(data.rate) > 0) {
            resolve(Number(data.rate));
            return;
          }
          resolve(null);
        })
        .catch(function () {
          resolve(null);
        });
    });
  }

  function eurKdvDahilToTry(eurKdvDahil, eurTryRate) {
    var eur = Number(eurKdvDahil);
    var kur = Number(eurTryRate);
    if (!(eur > 0) || !(kur > 0)) return 0;
    return Math.round(eur * kur * 100) / 100;
  }

  function cartItemFromProduct(p, eurTryRate) {
    if (!p) return null;
    var name = nz(p.name) || nz(p.code);
    var price = "";
    if (window.EqBesosPricing) {
      var pr = window.EqBesosPricing.getPricing(p);
      if (pr && pr.fiyatEurKdvDahil != null && eurTryRate > 0) {
        var tl = eurKdvDahilToTry(pr.fiyatEurKdvDahil, eurTryRate);
        if (tl > 0) price = formatTryAmount(tl);
      }
    }
    return {
      n: name,
      b: "Besos · " + (nz(p.code) || "Bar modülü"),
      c: nz(p.category) || "Bar Design Studio",
      p: price,
      img: nz(p.image) || "",
      q: 1,
    };
  }

  function waPhoneDigits() {
    var a = String(window.EQUSTO_WHATSAPP_E164 || "").replace(/\D/g, "");
    if (a) return a;
    try {
      if (window.PFOS_CONFIG && PFOS_CONFIG.whatsappPhone) {
        return String(PFOS_CONFIG.whatsappPhone).replace(/\D/g, "");
      }
    } catch (_) {}
    return "";
  }

  function addToCart(p) {
    if (!p) return;
    ensureEurTryRate().then(function (rate) {
      var kur = rate > 0 ? rate : FALLBACK_EUR_TRY;
      var it = cartItemFromProduct(p, kur);
      if (!it || !it.p) {
        window.alert("Fiyat TL'ye çevrilemedi. Lütfen sayfayı yenileyip tekrar deneyin.");
        return;
      }
      if (window.EqustoCart && typeof window.EqustoCart.addFromItem === "function") {
        window.EqustoCart.addFromItem(it);
        return;
      }
      location.href =
        typeof window.equstoUrl === "function" ? window.equstoUrl("cart") : "/sepet";
    });
  }

  function openContact(p) {
    if (!p) return;
    var name = nz(p.name) || nz(p.code);
    var code = nz(p.code);
    var priceEur = window.EqBesosPricing ? window.EqBesosPricing.priceLabel(p) : "";
    ensureEurTryRate().then(function (rate) {
      var kur = rate > 0 ? rate : FALLBACK_EUR_TRY;
      var priceLine = priceEur;
      if (window.EqBesosPricing) {
        var pr = window.EqBesosPricing.getPricing(p);
        if (pr && pr.fiyatEurKdvDahil != null) {
          var tl = eurKdvDahilToTry(pr.fiyatEurKdvDahil, kur);
          if (tl > 0) {
            priceLine =
              "₺" +
              formatTryAmount(tl) +
              " (≈ " +
              priceEur +
              ", kur: " +
              kur.toLocaleString("tr-TR", { maximumFractionDigits: 4 }) +
              ")";
          }
        }
      }
      var msg =
        "Merhaba, Besos vitrininden yazıyorum.\n\n" +
        "Ürün: " +
        name +
        (code ? " (" + code + ")" : "") +
        (priceLine ? "\nFiyat: " + priceLine : "") +
        "\n\nDetaylı teklif almak istiyorum.";
      var phone = waPhoneDigits();
      if (window.equstoOpenWhatsAppWebWindow && phone) {
        window.equstoOpenWhatsAppWebWindow(phone, msg);
        return;
      }
      if (typeof window.equstoOpenWhatsApp === "function") {
        window.EQUSTO_WHATSAPP_TEXT = msg;
        window.equstoOpenWhatsApp();
        return;
      }
      window.alert("WhatsApp bağlantısı şu an kullanılamıyor.");
    });
  }

  window.EqBesosActions = {
    ensureEurTryRate: ensureEurTryRate,
    eurKdvDahilToTry: eurKdvDahilToTry,
    formatTryAmount: formatTryAmount,
    cartItemFromProduct: cartItemFromProduct,
    addToCart: addToCart,
    openContact: openContact,
  };
})();
