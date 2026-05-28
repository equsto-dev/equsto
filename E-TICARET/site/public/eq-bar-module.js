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
    var s = String(p).replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (typeof window.eqProductImgSrc === "function") {
      try {
        var via = window.eqProductImgSrc(s);
        if (via) return via;
      } catch (_) {}
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
      ? window.equstoResolveNavHref("/besos")
      : "/besos";
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
    var slug = typeof window.vitrumModuleSlug === "function" ? window.vitrumModuleSlug(p) : "";
    var pageRef = p.page ? " · P." + String(p.page) : "";
    var techSection = "";

    document.title = name + " · Equsto Bar Studio";
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

    var priceHtml =
      window.EqBesosPricing && window.EqBesosPricing.priceLabel(p, { style: "html" })
        ? '<div class="bm-price">' + window.EqBesosPricing.priceLabel(p, { style: "html" }) + "</div>"
        : "";

    root.innerHTML =
      '<article class="bm-article">' +
      '<nav class="bm-crumb" aria-label="Breadcrumb">' +
      '<a href="/">Equsto</a> · <a href="' +
      esc(besosHref()) +
      '">Besos</a> · <span>' +
      esc(name) +
      "</span></nav>" +
      '<header class="bm-intro">' +
      '<p class="bm-kicker">' +
      esc(cat) +
      pageRef +
      "</p>" +
      '<h1 class="bm-title">' +
      esc(name) +
      "</h1>" +
      (code ? '<p class="bm-code">' + esc(code) + "</p>" : "") +
      "</header>" +
      '<div class="bm-layout">' +
      '<div class="bm-media-col">' +
      '<div class="bm-hero-frame">' +
      (heroImg
        ? '<img src="' + esc(heroImg) + '" alt="' + esc(name) + '">'
        : '<span class="bm-hero-empty">Görsel hazırlanıyor</span>') +
      "</div></div>" +
      '<div class="bm-info-col">' +
      '<div class="bm-buybox">' +
      priceHtml +
      (desc ? '<p class="bm-desc">' + esc(desc) + "</p>" : "") +
      (total
        ? '<div class="bm-dim-badge"><span>Toplam ölçü</span> ' + esc(total) + " mm</div>"
        : "") +
      dimsHtml +
      featsHtml +
      '<div class="bm-actions">' +
      '<div class="bm-actions-primary">' +
      '<button type="button" class="bm-btn bm-btn-primary" id="bm-add-cart">Sepete Ekle</button>' +
      '<button type="button" class="bm-btn bm-btn-outline" id="bm-contact">İletişime Geç</button>' +
      "</div>" +
      '<a class="bm-btn bm-btn-ghost" href="' +
      esc(besosHref()) +
      '#bd-stations">← Tüm modüller</a>' +
      "</div></div></div></div>" +
      techSection +
      '<footer class="bm-foot"><a href="' +
      esc(besosHref()) +
      '">Besos Bar Design Studio vitrinine dön</a></footer>' +
      "</article>";

    var cartBtn = document.getElementById("bm-add-cart");
    var contactBtn = document.getElementById("bm-contact");
    if (cartBtn && window.EqBesosActions) {
      cartBtn.addEventListener("click", function () {
        window.EqBesosActions.addToCart(p);
      });
    }
    if (contactBtn && window.EqBesosActions) {
      contactBtn.addEventListener("click", function () {
        window.EqBesosActions.openContact(p);
      });
    }
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
