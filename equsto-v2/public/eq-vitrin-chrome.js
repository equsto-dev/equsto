/**
 * Eksik sayfalara masaüstü vitrin üstü (eq-d-header: logo + arama + topnav) yükler.
 * Breadcrumb kullanılmaz — theme.css ile gizlenir.
 */
(function () {
  "use strict";

  var PARTIAL = "/partials/eq-d-header.html?v=20260526dhdr";

  function shouldInject() {
    var b = document.body;
    if (!b || !b.classList.contains("eq-shop")) return false;
    if (
      b.classList.contains("admin-app") ||
      b.classList.contains("bd-page") ||
      b.classList.contains("eq-pfos")
    ) {
      return false;
    }
    return !document.querySelector("header.hdr");
  }

  function mount(html) {
    var wrap = document.createElement("div");
    wrap.id = "eq-d-header";
    wrap.className = "eq-d-header";
    wrap.innerHTML = html;
    var pg = document.querySelector(".pg");
    if (pg) pg.insertBefore(wrap, pg.firstChild);
    else document.body.insertBefore(wrap, document.body.firstChild);
    try {
      if (typeof window.EQUSTO_LOGO_REFRESH === "function") window.EQUSTO_LOGO_REFRESH();
    } catch (_) {}
  }

  function load() {
    if (!shouldInject()) return;
    fetch(PARTIAL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(mount)
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
