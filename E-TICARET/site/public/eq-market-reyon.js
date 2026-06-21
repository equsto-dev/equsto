/**
 * Market Reyonları — Çağlayan katalog yükleyici (PLP birleşimi için).
 */
;(function () {
  "use strict";

  var CATALOG_V = "20260621-drawer-ios-glass";

  window.EqMarketReyon = {
    loadCatalog: function () {
      return fetch("/data/dept/market-reyon.json?v=" + CATALOG_V, {
        cache: "default",
        headers: { Accept: "application/json" },
      })
        .then(function (r) {
          if (!r.ok) throw new Error("market-reyon.json HTTP " + r.status);
          return r.json();
        })
        .then(function (data) {
          if (!Array.isArray(data)) throw new Error("market-reyon.json geçersiz");
          return data;
        });
    },
  };
})();
