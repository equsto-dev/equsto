/**
 * bar-module.html — Vitrum katalog modülü satış sayfası (/besos/modul/:slug)
 */
(function () {
  "use strict";

  function catalogueUrl() {
    try {
      if (
        typeof location !== "undefined" &&
        (location.protocol === "http:" || location.protocol === "https:")
      ) {
        return "/data/vitrum-bars-catalogue.json";
      }
    } catch (_) {}
    return "./data/vitrum-bars-catalogue.json";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function nz(s) {
    return s && String(s).trim() ? String(s).trim() : "";
  }

  function normAsset(p) {
    if (!p) return "";
    var s = String(p).replace(/\\/g, "/");
    if (s.indexOf("vitrum-drawings/") === 0 || s.indexOf("images/") === 0) {
      s = "data/" + s;
    }
    if (typeof window.equstoDataAssetHref === "function") {
      return window.equstoDataAssetHref(s.replace(/^data\//, ""));
    }
    return "/" + s.replace(/^\//, "");
  }

  function lang() {
    return window.eqLang === "en" ? "en" : "tr";
  }

  function field(p, base) {
    if (lang() === "en") {
      var en = p[base + "En"];
      if (en != null && (typeof en !== "string" || en.trim())) return en;
      if (Array.isArray(en) && en.length) return en;
    }
    return p[base];
  }

  function dimLabel(d) {
    if (!d) return "";
    return lang() === "en" && d.labelEn ? d.labelEn : d.label || d.labelEn || "";
  }

  function slugFromPath() {
    var m = /\/besos\/modul\/([^/?#]+)/i.exec(location.pathname || "");
    if (m) return decodeURIComponent(m[1]).toLowerCase();
    try {
      return (new URLSearchParams(location.search).get("m") || "").toLowerCase();
    } catch (_) {
      return "";
    }
  }

  function besosHref() {
    return typeof window.equstoResolveNavHref === "function"
      ? window.equstoResolveNavHref("bar-design.html")
      : "bar-design.html";
  }

  function render(p) {
    var root = document.getElementById("bm-root");
    if (!root) return;

    var name = nz(p.name) || nz(p.code) || "Bar modülü";
    var code = nz(p.code);
    var cat = nz(p.category);
    var desc = nz(field(p, "description"));
    var feats = field(p, "features");
    var total = nz(p.totalDimensionsMm);
    var heroImg = nz(p.image) ? normAsset(p.image) : "";
    var drawImg = nz(p.drawing) ? normAsset(p.drawing) : "";
    var slug = typeof window.vitrumModuleSlug === "function" ? window.vitrumModuleSlug(p) : "";

    document.title = name + " · Besos · Bar Design Studio";
    var meta = document.querySelector('meta[name="description"]');
    if (meta && desc) meta.setAttribute("content", desc.slice(0, 160));
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon && slug) canon.setAttribute("href", "https://equsto.com/besos/modul/" + slug);

    var featsHtml = "";
    if (Array.isArray(feats) && feats.length) {
      featsHtml =
        '<ul class="bm-feats">' +
        feats
          .map(function (f) {
            return "<li>" + esc(String(f).replace(/^→\s*/, "")) + "</li>";
          })
          .join("") +
        "</ul>";
    }

    var dimsHtml = "";
    if (Array.isArray(p.dimensionsMm) && p.dimensionsMm.length) {
      dimsHtml =
        '<div class="bm-dims-grid">' +
        p.dimensionsMm
          .map(function (d) {
            if (!nz(d.value)) return "";
            return (
              '<div class="bm-dim-cell"><span>' +
              esc(dimLabel(d)) +
              "</span><strong>" +
              esc(d.value) +
              " mm</strong></div>"
            );
          })
          .join("") +
        "</div>";
    }

    root.innerHTML =
      '<nav class="bm-crumb" aria-label="Breadcrumb">' +
      '<a href="/">Equsto</a> · <a href="' +
      esc(besosHref()) +
      '">Bar Design</a> · <span>' +
      esc(name) +
      "</span></nav>" +
      '<div class="bm-grid">' +
      '<div class="bm-hero">' +
      (heroImg
        ? '<img src="' + esc(heroImg) + '" alt="' + esc(name) + '">'
        : '<span class="bm-hero-empty">Görsel hazırlanıyor</span>') +
      "</div>" +
      "<div>" +
      '<p class="bm-kicker">' +
      esc(cat) +
      (p.page ? " · P." + esc(String(p.page)) : "") +
      "</p>" +
      "<h1 class=\"bm-title\">" +
      esc(name) +
      "</h1>" +
      (code ? '<p class="bm-code">' + esc(code) + "</p>" : "") +
      (desc ? '<p class="bm-desc">' + esc(desc) + "</p>" : "") +
      (total ? '<div class="bm-dim">Toplam ' + esc(total) + " mm</div>" : "") +
      dimsHtml +
      featsHtml +
      '<div class="bm-actions">' +
      '<a class="bm-btn bm-btn-primary" href="pfos.html">Teklif iste →</a>' +
      '<a class="bm-btn" href="' +
      esc(besosHref()) +
      '#bd-stations">Tüm modüller</a>' +
      (drawImg
        ? '<a class="bm-btn" href="' +
          esc(drawImg) +
          '" target="_blank" rel="noopener">Teknik çizim</a>'
        : "") +
      "</div>" +
      (drawImg
        ? '<section class="bm-tech" aria-label="Teknik çizim">' +
          '<h2 class="bm-tech-h">Teknik çizim</h2>' +
          '<img src="' +
          esc(drawImg) +
          '" alt="Teknik çizim — ' +
          esc(name) +
          '" loading="lazy">' +
          "</section>"
        : "") +
      "</div></div>";

    root.innerHTML = root.innerHTML
      .replace(/<motion/g, "<div")
      .replace(/<\/motion>/g, "</div>");
  }

  function renderError() {
    var root = document.getElementById("bm-root");
    if (!root) return;
    root.innerHTML =
      '<div class="bm-err"><h1>Modül bulunamadı</h1><p><a href="' +
      esc(besosHref()) +
      '">Bar Design kataloğuna dön</a></p></div>';
  }

  function init() {
    var slug = slugFromPath();
    if (!slug) {
      renderError();
      return;
    }
    fetch(catalogueUrl(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("catalogue");
        return r.json();
      })
      .then(function (j) {
        var list = (j && j.products) || [];
        var p =
          typeof window.findVitrumModuleBySlug === "function"
            ? window.findVitrumModuleBySlug(list, slug)
            : null;
        if (!p) {
          renderError();
          return;
        }
        render(p);
      })
      .catch(function () {
        renderError();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
