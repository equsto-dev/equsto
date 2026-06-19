/**
 * Marka PLP — scriptleri sırayla yükler (bootstrap → shell → boot).
 * Next.js Script onReady zinciri bazen bootstrap'i çalıştırmadan boot'u tetikliyordu.
 */
(function () {
  "use strict";

  var cur = document.currentScript;
  var v = "20260530marka-plp";
  if (cur && cur.src) {
    var m = cur.src.match(/[?&]v=([^&]+)/);
    if (m) v = decodeURIComponent(m[1]);
  }

  var FILES = [
    "eq-price-display.js",
    "eq-display-terminology.js",
    "eq-shop-catalog-bootstrap.js",
    "eq-filter-column.js",
    "eq-category-shell.js",
    "eq-marka-plp-boot.js",
  ];

  var idx = 0;

  function loadNext() {
    if (idx >= FILES.length) return;
    var name = FILES[idx++];
    var s = document.createElement("script");
    s.src = "/" + name + "?v=" + encodeURIComponent(v);
    s.async = false;
    s.onload = loadNext;
    s.onerror = function () {
      console.warn("[eq-marka-loader] failed:", name);
      loadNext();
    };
    (document.head || document.body).appendChild(s);
  }

  function start() {
    if (window.EqustoShopCatalog && window.EqCategoryShell) {
      if (!document.getElementById("eq-marka-plp-boot-js")) {
        var boot = document.createElement("script");
        boot.id = "eq-marka-plp-boot-js";
        boot.src = "/eq-marka-plp-boot.js?v=" + encodeURIComponent(v);
        boot.async = false;
        (document.head || document.body).appendChild(boot);
      }
      return;
    }
    loadNext();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
