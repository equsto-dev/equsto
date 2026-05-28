/**
 * SSS sayfası — /data/footer-vitrin.json faq + FAQPage schema
 * @version 20260531sss1
 */
(function () {
  "use strict";

  var FAQ_JSON = "/data/footer-vitrin.json?v=20260531sss7";

  function t(key, fb) {
    try {
      if (typeof window.eqT === "function") {
        var v = window.eqT(key, null);
        if (v != null && v !== key) return v;
      }
    } catch (_) {}
    return fb;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectFaqSchema(items) {
    if (!items || !items.length) return;
    var el = document.getElementById("eq-sss-faq-ld");
    if (!el) {
      el = document.createElement("script");
      el.id = "eq-sss-faq-ld";
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map(function (it) {
        return {
          "@type": "Question",
          name: t(it.qKey || "", it.q || ""),
          acceptedAnswer: {
            "@type": "Answer",
            text: t(it.aKey || "", it.a || ""),
          },
        };
      }),
    });
  }

  function renderList(faq) {
    var root = document.getElementById("eq-sss-list");
    if (!root || !faq || !faq.items || !faq.items.length) return;
    root.innerHTML = faq.items
      .map(function (it) {
        var q = t(it.qKey || "", it.q || "");
        var a = t(it.aKey || "", it.a || "");
        return (
          '<details class="eq-sss-item">' +
          "<summary>" +
          esc(q) +
          "</summary>" +
          '<div class="eq-sss-answer"><p>' +
          esc(a) +
          "</p></div></details>"
        );
      })
      .join("");
    injectFaqSchema(faq.items);
  }

  function mount() {
    fetch(FAQ_JSON, { credentials: "same-origin", cache: "default" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        renderList(data && data.faq);
      })
      .catch(function () {});
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }

  window.addEventListener("equsto:i18n-ready", function () {
    fetch(FAQ_JSON, { credentials: "same-origin", cache: "default" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.faq) renderList(data.faq);
      })
      .catch(function () {});
  });
})();
