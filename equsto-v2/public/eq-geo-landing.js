/**
 * SEO / rehber sayfaları — /steakhouse-kurulumu, /projeler, /rehber/…
 */
(function () {
  "use strict";

  var DATA_URL = "/data/geo-landings.json?v=20260523geo";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function navHref(path) {
    var p = String(path || "/");
    try {
      if (typeof window.equstoResolveNavHref === "function") return window.equstoResolveNavHref(p);
    } catch (_) {}
    return p;
  }

  function pathKey() {
    var p = String(location.pathname || "/").replace(/\/+$/, "") || "/";
    if (p.charAt(0) === "/") p = p.slice(1);
    return p;
  }

  function render(page) {
    var root = document.getElementById("eq-geo-main");
    if (!root || !page) return;

    document.title = page.title || document.title;

    var linksHtml = "";
    if (page.links && page.links.length) {
      linksHtml =
        '<ul class="eq-geo-links">' +
        page.links
          .map(function (ln) {
            return '<li><a href="' + esc(navHref(ln.href)) + '">' + esc(ln.label) + "</a></li>";
          })
          .join("") +
        "</ul>";
    }

    root.innerHTML =
      '<article class="eq-geo-article">' +
      "<h1>" +
      esc(page.h1 || "") +
      "</h1>" +
      '<p class="eq-geo-lead">' +
      esc(page.lead || "") +
      "</p>" +
      linksHtml +
      '<div class="eq-geo-actions">' +
      (page.ctaPfos
        ? '<a class="eq-geo-btn eq-geo-btn--primary" href="' +
          esc(navHref(page.ctaPfos)) +
          '">Proje Fabrikası</a>'
        : "") +
      (page.ctaBesos
        ? '<a class="eq-geo-btn" href="' +
          esc(navHref(page.ctaBesos)) +
          '">Bar Design</a>'
        : "") +
      (page.ctaContact
        ? '<a class="eq-geo-btn" href="' +
          esc(navHref(page.ctaContact)) +
          '">İletişim ve teklif</a>'
        : "") +
      "</div>" +
      "</article>";
  }

  function boot() {
    var key = pathKey();
    fetch(DATA_URL, { credentials: "same-origin" })
      .then(function (r) {
        if (!r.ok) throw new Error("geo data");
        return r.json();
      })
      .then(function (data) {
        var page = data[key];
        if (!page && key.indexOf("projeler/") === 0) page = data[key];
        if (!page) {
          page = {
            title: "Equsto",
            h1: "Sayfa",
            lead: "İçerik yüklenemedi. Ana sayfaya dönebilir veya iletişime geçebilirsiniz.",
            ctaContact: "/contact",
            ctaPfos: "/pfos",
          };
        }
        render(page);
      })
      .catch(function () {
        render({
          h1: "Equsto",
          lead: "Sayfa verisi yüklenemedi.",
          ctaContact: "/contact",
          ctaPfos: "/pfos",
        });
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
