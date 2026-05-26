/**
 * Besos — Cocktail Stations: Yeni Seri (kart vitrin) + Seri İki (barras-moviles)
 */
(function () {
  "use strict";

  var LANDING_URL = "./data/cocktailstations-landing.json";
  var CATALOGUE_URL = "./data/cocktailstations-catalogue.json";
  var CS_ACCENT = "#e71d9f";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function lang() {
    return window.eqLang === "en" ? "en" : "tr";
  }

  function pick(obj, trKey, enKey) {
    if (!obj) return "";
    if (lang() === "en" && obj[enKey]) return obj[enKey];
    return obj[trKey] || obj[enKey] || "";
  }

  function nav(h) {
    if (typeof window.equstoResolveNavHref === "function") {
      return window.equstoResolveNavHref(h || "");
    }
    return h || "";
  }

  function dataAsset(rel) {
    if (!rel) return "";
    var s = String(rel).replace(/\\/g, "/").replace(/^data\//, "");
    if (typeof window.equstoDataAssetHref === "function") {
      return window.equstoDataAssetHref(s);
    }
    return "./data/" + s;
  }

  function field(p, base) {
    if (lang() === "en") {
      var en = p[base + "En"];
      if (en) return en;
    }
    return p[base] || p[base + "En"] || "";
  }

  function csKicker(label) {
    return String(label || "COCKTAIL STATIONS").toUpperCase();
  }

  function catSlug(label) {
    return (
      "cs-" +
      String(label || "")
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  }

  function groupProducts(products) {
    var map = {};
    var order = [];
    (products || []).forEach(function (p) {
      var cat = p.category || "Cocktail Stations";
      if (!map[cat]) {
        map[cat] = [];
        order.push(cat);
      }
      map[cat].push(p);
    });
    return order.map(function (k) {
      return { key: k, label: k, rows: map[k] };
    });
  }

  function filterProducts(products) {
    return (products || []).filter(function (p) {
      return p.slug !== "cs-ice-block-machine-maquina-hielo";
    });
  }

  /* —— Seri İki (barras-moviles editoryal) —— */
  function renderSeriIkiHeader(root, landing) {
    var h = landing.seriesTwoHero || landing.hero || {};
    var series = pick(landing, "seriesTwoLabel", "seriesTwoLabelEn");
    if (!series) {
      series = lang() === "en" ? "Series Two" : "Seri İki";
    }
    root.innerHTML =
      '<header class="bd-cs-page-title">' +
      '<span class="bd-cs-series-badge">' +
      esc(series) +
      "</span>" +
      "<h2>" +
      esc(pick(h, "title", "titleEn")) +
      "</h2>" +
      '<p class="bd-cs-lead">' +
      esc(pick(h, "lead", "leadEn")) +
      "</p>" +
      '<p class="bd-cs-bc">' +
      '<a href="' +
      esc(nav("bar-design.html")) +
      '">Besos</a>' +
      '<span class="bd-cs-bc-sep">|</span>' +
      "<span>" +
      esc(series) +
      "</span>" +
      '<span class="bd-cs-bc-sep">|</span>' +
      '<span style="color:' +
      CS_ACCENT +
      '">Cocktail Stations</span>' +
      "</p>" +
      "</header>" +
      '<div class="bd-cs-toolbar">' +
      '<div class="bd-cs-cta-row">' +
      '<a class="bd-cs-btn bd-cs-btn--solid" href="#bd-cs-iki-board">' +
      esc(pick(h, "ctaCatalog", "ctaCatalogEn")) +
      "</a>" +
      '<a class="bd-cs-btn" href="' +
      esc(nav(h.ctaProjectHref || "pfos.html")) +
      '">' +
      esc(pick(h, "ctaProject", "ctaProjectEn")) +
      "</a>" +
      (landing.pdfCatalogUrl
        ? '<a class="bd-cs-btn" href="' +
          esc(landing.pdfCatalogUrl) +
          '" target="_blank" rel="noopener">' +
          esc(lang() === "en" ? "PDF catalog" : "PDF katalog") +
          "</a>"
        : "") +
      "</div></div>";
}

  function renderStrip(p, index) {
    var img = p.image ? dataAsset(p.image) : "";
    var side = index % 2 === 0 ? "right" : "left";
    var feats = field(p, "features");
    var featHtml =
      feats && feats.length
        ? '<ul class="bd-cs-strip-feats">' +
          feats
            .map(function (f) {
              return "<li>" + esc(f) + "</li>";
            })
            .join("") +
          "</ul>"
        : "";
    var ctaLabel = p.albumUrl
      ? lang() === "en"
        ? "View album"
        : "Albümü gör"
      : lang() === "en"
        ? "View on cocktailstations.com"
        : "Üretici sayfası";
    var ctaHref = p.albumUrl || p.sourceUrl || "https://cocktailstations.com/";
    return (
      '<article class="bd-cs-strip bd-cs-strip--' +
      side +
      '" id="' +
      esc(p.slug) +
      '">' +
      '<div class="bd-cs-strip-bg"' +
      (img ? ' style="--cs-strip-bg:url(' + esc(img) + ')"' : "") +
      "></div>" +
      '<div class="bd-cs-strip-inner">' +
      '<div class="bd-cs-strip-copy">' +
      '<p class="bd-cs-strip-kicker">' +
      esc(csKicker(p.category)) +
      "</p>" +
      "<h3 class=\"bd-cs-strip-title\">" +
      esc(field(p, "name")) +
      "</h3>" +
      '<p class="bd-cs-strip-desc">' +
      esc(field(p, "description")) +
      "</p>" +
      featHtml +
      (p.totalDimensionsMm
        ? '<p class="bd-cs-strip-dim">' +
          esc(lang() === "en" ? "Dimensions (mm): " : "Ölçü (mm): ") +
          esc(String(p.totalDimensionsMm).replace(/x/gi, "×")) +
          "</p>"
        : "") +
      '<a class="bd-cs-btn bd-cs-btn--solid bd-cs-btn--block" href="' +
      esc(ctaHref) +
      '" target="_blank" rel="noopener">' +
      esc(ctaLabel) +
      " →</a>" +
      "</div></div></article>"
    );
  }

  function renderEditorialCatalogue(boardEl, jumpEl, products) {
    var groups = groupProducts(products);
    var idx = 0;
    if (jumpEl) {
      jumpEl.innerHTML = groups
        .map(function (g) {
          return (
            '<a class="bd-cs-jump-pill" href="#' +
            catSlug(g.label) +
            '">' +
            esc(g.label) +
            "</a>"
          );
        })
        .join("");
    }
    boardEl.innerHTML =
      '<div class="bd-cs-board">' +
      groups
        .map(function (g) {
          return (
            '<div class="bd-cs-cat-anchor" id="' +
            catSlug(g.label) +
            '"></div>' +
            g.rows
              .map(function (p) {
                return renderStrip(p, idx++);
              })
              .join("")
          );
        })
        .join("") +
      "</div>";
  }

  function renderMethod(el, landing) {
    if (!landing.method || !landing.method.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML =
      '<section class="bd-cs-method" aria-label="Yöntem">' +
      '<h3 class="bd-cs-method-title">' +
      esc(lang() === "en" ? "How we deliver the new series" : "Yeni seri süreci") +
      "</h3>" +
      '<ol class="bd-cs-method-list">' +
      landing.method
        .map(function (step) {
          return (
            "<li><span class=\"bd-cs-method-n\">" +
            esc(step.n) +
            "</span><div><strong>" +
            esc(pick(step, "title", "titleEn")) +
            "</strong><p>" +
            esc(pick(step, "text", "textEn")) +
            "</p></div></li>"
          );
        })
        .join("") +
      "</ol></section>";
  }

  /* —— Classic (ilk vitrin) —— */
  function renderClassicHero(root, landing) {
    var h = landing.hero || {};
    root.innerHTML =
      '<section class="bd-cs-hero" aria-label="Cocktail Stations vitrin">' +
      '<div class="bd-cs-hero-badge">' +
      esc(pick(landing, "seriesLabel", "seriesLabelEn")) +
      "</div>" +
      '<p class="bd-cs-kicker">' +
      esc(pick(h, "kicker", "kickerEn")) +
      "</p>" +
      "<h2 class=\"bd-cs-title\">" +
      esc(pick(h, "title", "titleEn")) +
      "</h2>" +
      '<p class="bd-cs-lead">' +
      esc(pick(h, "lead", "leadEn")) +
      "</p>" +
      '<div class="bd-cs-stats">' +
      (landing.stats || [])
        .map(function (s) {
          return (
            '<div class="bd-cs-stat"><span class="bd-cs-stat-v">' +
            esc(s.value) +
            '</span><span class="bd-cs-stat-l">' +
            esc(pick(s, "label", "labelEn")) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="bd-cs-cta-row">' +
      '<a class="bd-btn bd-btn-primary" href="#bd-cs-board">' +
      esc(pick(h, "ctaCatalog", "ctaCatalogEn")) +
      "</a>" +
      '<a class="bd-btn" href="' +
      esc(nav(h.ctaProjectHref || "pfos.html")) +
      '">' +
      esc(pick(h, "ctaProject", "ctaProjectEn")) +
      "</a>" +
      (landing.pdfCatalogUrl
        ? '<a class="bd-btn bd-btn-ghost" href="' +
          esc(landing.pdfCatalogUrl) +
          '" target="_blank" rel="noopener">' +
          esc(lang() === "en" ? "PDF catalog" : "PDF katalog") +
          "</a>"
        : "") +
      "</div>" +
      '<p class="bd-cs-source">' +
      esc(lang() === "en" ? "Source:" : "Kaynak:") +
      ' <a href="https://cocktailstations.com/" target="_blank" rel="noopener">cocktailstations.com</a></p>' +
      "</section>";
}

  function renderLines(el, landing) {
    el.innerHTML =
      '<div class="bd-cs-lines">' +
      (landing.lines || [])
        .map(function (ln) {
          return (
            '<article class="bd-cs-line-card" id="bd-cs-line-' +
            esc(ln.key) +
            '">' +
            "<h3>" +
            esc(pick(ln, "titleTr", "title")) +
            "</h3>" +
            "<p>" +
            esc(pick(ln, "blurb", "blurbEn")) +
            "</p>" +
            "</article>"
          );
        })
        .join("") +
      "</div>";
  }

  function renderClassicCard(p) {
    var img = p.image ? dataAsset(p.image) : "";
    var feats = field(p, "features");
    var featHtml =
      feats && feats.length
        ? '<ul class="bd-cs-card-feats">' +
          feats
            .slice(0, 4)
            .map(function (f) {
              return "<li>" + esc(f) + "</li>";
            })
            .join("") +
          "</ul>"
        : "";
    return (
      '<article class="bd-cs-card" id="cs-card-' +
      esc(p.slug) +
      '">' +
      (img
        ? '<div class="bd-cs-card-img"><img src="' +
          esc(img) +
          '" alt="" loading="lazy" decoding="async"></div>'
        : '<div class="bd-cs-card-img bd-cs-card-img--empty"></div>') +
      '<div class="bd-cs-card-body">' +
      '<span class="bd-cs-card-cat">' +
      esc(p.category || "") +
      "</span>" +
      (p.code ? '<span class="bd-cs-card-code">' + esc(p.code) + "</span>" : "") +
      "<h3>" +
      esc(field(p, "name")) +
      "</h3>" +
      "<p>" +
      esc(field(p, "description")) +
      "</p>" +
      featHtml +
      (p.totalDimensionsMm
        ? '<p class="bd-cs-card-dim">' +
          esc(lang() === "en" ? "Dimensions (mm): " : "Ölçü (mm): ") +
          esc(String(p.totalDimensionsMm).replace(/x/gi, "×")) +
          "</p>"
        : "") +
      '<a class="bd-cs-card-link" href="' +
      esc(p.sourceUrl || "https://cocktailstations.com/") +
      '" target="_blank" rel="noopener">' +
      esc(lang() === "en" ? "Manufacturer page →" : "Üretici sayfası →") +
      "</a>" +
      "</div></article>"
    );
  }

  function renderClassicCatalogue(boardEl, jumpEl, products) {
    var groups = groupProducts(products);
    if (jumpEl) {
      jumpEl.innerHTML = groups
        .map(function (g) {
          var id = "cs-classic-" + catSlug(g.label);
          return (
            '<a class="bd-cs-jump-pill" href="#' +
            id +
            '">' +
            esc(g.label) +
            "</a>"
          );
        })
        .join("");
    }
    boardEl.innerHTML = groups
      .map(function (g) {
        var id = "cs-classic-" + catSlug(g.label);
        return (
          '<section class="bd-cs-cat" id="' +
          id +
          '">' +
          '<header class="bd-cs-cat-hd"><h3>' +
          esc(g.label) +
          '</h3><span class="bd-cs-cat-n">' +
          g.rows.length +
          " " +
          esc(lang() === "en" ? "models" : "model") +
          "</span></header>" +
          '<div class="bd-cs-grid">' +
          g.rows.map(renderClassicCard).join("") +
          "</div></section>"
        );
      })
      .join("");
  }

  function ensureCsStyles() {
    if (document.getElementById("bd-cs-stylesheet")) return;
    var link = document.createElement("link");
    link.id = "bd-cs-stylesheet";
    link.rel = "stylesheet";
    link.href = "bar-design-cocktailstations.css";
    document.head.appendChild(link);
  }

  function boot() {
    ensureCsStyles();
    var introBir = document.getElementById("bd-cs-intro");
    var boardBir = document.getElementById("bd-cs-board");
    var jumpBir = document.getElementById("bd-cs-jump");
    var lines = document.getElementById("bd-cs-lines");
    var introIki = document.getElementById("bd-cs-iki-intro");
    var boardIki = document.getElementById("bd-cs-iki-board");
    var jumpIki = document.getElementById("bd-cs-iki-jump");
    var methodIki = document.getElementById("bd-cs-iki-method");
    if (!introBir && !introIki) return;

    Promise.all([
      fetch(LANDING_URL, { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : null;
      }),
      fetch(CATALOGUE_URL, { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : null;
      }),
    ])
      .then(function (res) {
        var landing = res[0] || {};
        var products = filterProducts((res[1] || {}).products);
        if (introIki && boardIki) {
          renderSeriIkiHeader(introIki, landing);
          renderEditorialCatalogue(boardIki, jumpIki, products);
          if (methodIki) renderMethod(methodIki, landing);
        }
        if (introBir) renderClassicHero(introBir, landing);
        if (lines) renderLines(lines, landing);
        if (boardBir) renderClassicCatalogue(boardBir, jumpBir, products);
      })
      .catch(function () {
        var err =
          '<p class="bd-cs-error">Cocktail Stations kataloğu yüklenemedi.</p>';
        if (introIki) introIki.innerHTML = err;
        if (introBir) introBir.innerHTML = err;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
