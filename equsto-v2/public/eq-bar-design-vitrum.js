/**
 * Besos bar-design — Vitrum /bars ilhamlı vitrin bölümleri.
 * data/vitrum-bars-landing.json + data/vitrum-bar-projects.json
 */
(function () {
  "use strict";

  var LANDING_URL = "./data/vitrum-bars-landing.json";
  var PROJECTS_URL = "./data/vitrum-bar-projects.json";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
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

  function moduleHref(slug) {
    return typeof window.vitrumModuleHref === "function"
      ? window.vitrumModuleHref(slug)
      : nav("/besos/modul/" + encodeURIComponent(slug));
  }

  function renderIntro(root, data) {
    var h = data.hero || {};
    root.innerHTML =
      '<section class="bd-vl-intro" aria-label="Bar çözümleri">' +
      '<div class="bd-vl-intro-inner">' +
      '<p class="bd-vl-kicker">' +
      esc(pick(h, "kicker", "kicker")) +
      "</p>" +
      "<h2 class=\"bd-vl-title\">" +
      esc(pick(h, "title", "titleEn")) +
      "</h2>" +
      '<p class="bd-vl-lead">' +
      esc(pick(h, "lead", "leadEn")) +
      "</p>" +
      '<div class="bd-vl-stats">' +
      (data.stats || [])
        .map(function (s) {
          return (
            '<div class="bd-vl-stat"><span class="bd-vl-stat-v">' +
            esc(s.value) +
            '</span><span class="bd-vl-stat-l">' +
            esc(pick(s, "label", "labelEn")) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="bd-vl-cta-row">' +
      '<a class="bd-btn bd-btn-primary" href="#bd-stations">' +
      esc(lang() === "en" ? "Browse modules" : "Modülleri incele") +
      "</a>" +
      '<a class="bd-btn" href="' +
      esc(nav(h.ctaProjectHref || "pfos.html")) +
      '">' +
      esc(
        pick(h, "ctaProject", "ctaProject") ||
          (lang() === "en" ? "Request a quote" : "Proje teklifi al")
      ) +
      "</a>" +
      "</div>" +
      "</div>" +
      "</section>";
  }

  function renderSigTrio(el, data, catalogue) {
    var trio = data.signatureTrio || [];
    el.innerHTML =
      '<section class="bd-vl-sig-trio" aria-label="İmza barlar">' +
      '<div class="bd-vl-sig-trio-head">' +
      '<p class="bd-vl-kicker">' +
      esc(lang() === "en" ? "Signature bars" : "İmza barlar") +
      "</p>" +
      "<h2>" +
      esc(lang() === "en" ? "Manhattan · Boulevardier · Clover" : "Manhattan · Boulverdier · Clover") +
      "</h2>" +
      "</div>" +
      '<div class="bd-vl-sig-trio-grid">' +
      trio
        .map(function (t) {
          var mod =
            catalogue &&
            typeof window.findVitrumModuleBySlug === "function"
              ? window.findVitrumModuleBySlug(catalogue, t.slug)
              : null;
          var img = mod && mod.image ? dataAsset(mod.image) : "";
          var href = moduleHref(t.slug);
          return (
            '<a class="bd-vl-sig-card" href="' +
            esc(href) +
            '">' +
            (img
              ? '<div class="bd-vl-sig-card-img"><img src="' +
                esc(img) +
                '" alt="" loading="lazy"></div>'
              : "") +
            '<div class="bd-vl-sig-card-body">' +
            "<h3>" +
            esc(t.name) +
            "</h3>" +
            '<p class="bd-vl-sig-tag">' +
            esc(pick(t, "tagline", "taglineEn")) +
            "</p>" +
            '<p class="bd-vl-sig-blurb">' +
            esc(pick(t, "blurb", "blurb")) +
            "</p>" +
            '<span class="bd-vl-sig-link">' +
            esc(lang() === "en" ? "View module →" : "Modül sayfası →") +
            "</span>" +
            "</div>" +
            "</a>"
          );
        })
        .join("") +
      "</div>" +
      "</section>";
  }

  function renderModular(el, data) {
    var m = data.modular || {};
    el.innerHTML =
      '<section class="bd-vl-modular">' +
      '<div class="bd-vl-modular-inner">' +
      '<p class="bd-vl-kicker">' +
      esc(pick(m, "kicker", "kicker")) +
      "</p>" +
      "<h2>" +
      esc(pick(m, "title", "titleEn")) +
      "</h2>" +
      "<p>" +
      esc(pick(m, "body", "bodyEn")) +
      "</p>" +
      '<a class="bd-vl-modular-cta" href="#bd-stations">' +
      esc(lang() === "en" ? "Explore all 42 modules" : "42 modülü keşfet") +
      " →</a>" +
      "</div>" +
      "</section>";
  }

  function renderMethod(el, data) {
    el.innerHTML =
      '<section class="bd-vl-method" aria-label="Yöntemimiz">' +
      '<div class="bd-vl-method-head">' +
      '<p class="bd-vl-kicker">' +
      esc(lang() === "en" ? "Our method" : "Yöntemimiz") +
      "</p>" +
      "<h2>" +
      esc(lang() === "en" ? "Concept to commissioning" : "Konseptten devreye almaya") +
      "</h2>" +
      "</div>" +
      '<ol class="bd-vl-method-list">' +
      (data.method || [])
        .map(function (step) {
          return (
            "<li><span class=\"bd-vl-method-n\">" +
            esc(step.n) +
            '</span><div><h3>' +
            esc(pick(step, "title", "titleEn")) +
            "</h3><p>" +
            esc(pick(step, "text", "textEn")) +
            "</p></div></li>"
          );
        })
        .join("") +
      "</ol>" +
      "</section>";
  }

  function dataAsset(rel) {
    if (!rel) return "";
    var s = String(rel).replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(s)) return s;
    if (/^vitrum-drawings\//i.test(s) || /^data\/vitrum-drawings\//i.test(s)) {
      var vd = s.replace(/^\/?data\//i, "");
      if (typeof window.eqAttrPath === "function") {
        return window.eqAttrPath("/data/" + vd);
      }
      return "/data/" + vd;
    }
    if (typeof window.eqProductImgSrc === "function") {
      try {
        var via = window.eqProductImgSrc(s);
        if (via) return via;
      } catch (_) {}
    }
    s = s.replace(/^data\//, "");
    if (typeof window.equstoDataAssetHref === "function") {
      return window.equstoDataAssetHref(s);
    }
    return "./data/" + s;
  }

  function findMod(catalogue, slug) {
    if (!slug || !Array.isArray(catalogue)) return null;
    if (typeof window.findVitrumModuleBySlug === "function") {
      return window.findVitrumModuleBySlug(catalogue, slug);
    }
    return null;
  }

  function modLabel(p) {
    if (!p) return "";
    return p.name || p.code || "";
  }

  function modCaption(link) {
    if (!link) return "";
    return pick(link, "captionTr", "captionEn");
  }

  function catGroupKey(cat) {
    if (cat === "Dishwasher Module" || cat === "Ice Machine Module") {
      return "Dishwasher & Ice";
    }
    return cat || "";
  }

  function collectFeaturedSlugs(list) {
    var used = {};
    (list || []).forEach(function (pr) {
      (pr.featuredModules || []).forEach(function (m) {
        if (m && m.slug) used[m.slug] = true;
      });
    });
    return used;
  }

  function panelImgHtml(src, alt) {
    if (!src) return "";
    return (
      '<img src="' +
      esc(src) +
      '" alt="' +
      esc(alt || "") +
      '" loading="lazy">'
    );
  }

  function renderGearPanel(mod, caption, compact) {
    if (!mod) {
      return (
        '<div class="bd-portfolio-panel bd-portfolio-panel--gear">' +
        '<span class="bd-portfolio-panel-tag bd-portfolio-panel-tag--gear">' +
        esc(lang() === "en" ? "Equipment" : "Ekipman") +
        "</span>" +
        '<div class="bd-portfolio-empty">' +
        esc(lang() === "en" ? "Module not found" : "Modül bulunamadı") +
        "</div></div>"
      );
    }
    var hero = mod.image ? dataAsset(mod.image) : "";
    var tech = mod.drawing ? dataAsset(mod.drawing) : "";
    var href = moduleHref(mod.slug || mod);
    var title = modLabel(mod);
    var code = mod.code ? String(mod.code) : "";
    var dim = mod.totalDimensionsMm ? String(mod.totalDimensionsMm) + " mm" : "";
    var mediaInner;
    if (hero && tech) {
      mediaInner =
        '<div class="bd-portfolio-panel-media bd-portfolio-panel-media--split">' +
        panelImgHtml(hero, title) +
        '<div class="bd-portfolio-tech">' +
        panelImgHtml(tech, lang() === "en" ? "Technical drawing" : "Teknik çizim") +
        "</div></div>";
    } else if (hero) {
      mediaInner =
        '<div class="bd-portfolio-panel-media">' + panelImgHtml(hero, title) + "</div>";
    } else if (tech) {
      mediaInner =
        '<div class="bd-portfolio-panel-media">' + panelImgHtml(tech, title) + "</div>";
    } else {
      mediaInner =
        '<div class="bd-portfolio-empty">' +
        esc(code || title) +
        (dim ? " · " + esc(dim) : "") +
        "</div>";
    }
    var foot =
      '<div class="bd-portfolio-panel-foot">' +
      "<h4>" +
      esc(title) +
      "</h4>" +
      (caption ? "<p>" + esc(caption) + "</p>" : "") +
      (dim ? '<div class="bd-portfolio-dim">' + esc(dim) + "</div>" : "") +
      (code ? '<div class="bd-portfolio-dim">' + esc(code) + "</div>" : "") +
      '<a href="' +
      esc(href) +
      '">' +
      esc(lang() === "en" ? "Module page →" : "Modül sayfası →") +
      "</a></div>";
    if (compact) {
      return '<a class="bd-portfolio-gear-card" href="' + esc(href) + '">' + mediaInner + foot + "</a>";
    }
    return (
      '<div class="bd-portfolio-panel bd-portfolio-panel--gear">' +
      '<span class="bd-portfolio-panel-tag bd-portfolio-panel-tag--gear">' +
      esc(lang() === "en" ? "Vitrum module" : "Vitrum modülü") +
      "</span>" +
      mediaInner +
      foot +
      "</div>"
    );
  }

  function renderPortfolioProject(pr, catalogue, index) {
    var n = ("0" + (index + 1)).slice(-2);
    var venueImg = pr.image || "";
    var loc = pick(pr, "locationTr", "location") || pr.location || "";
    var sub = pick(pr, "subtitleTr", "subtitle");
    var teaser = pick(pr, "teaserTr", "teaser");
    var quote = pick(pr, "quoteTr", "quote");
    var modules = pr.featuredModules || [];
    var modA = modules[0] ? findMod(catalogue, modules[0].slug) : null;
    var modB = modules[1] ? findMod(catalogue, modules[1].slug) : null;
    var capA = modules[0] ? modCaption(modules[0]) : "";
    var capB = modules[1] ? modCaption(modules[1]) : "";
    var venuePanel =
      '<div class="bd-portfolio-panel bd-portfolio-panel--venue">' +
      '<span class="bd-portfolio-panel-tag">' +
      esc(lang() === "en" ? "Venue" : "Mekan") +
      "</span>" +
      (venueImg
        ? '<div class="bd-portfolio-panel-media">' + panelImgHtml(venueImg, pr.name) + "</div>"
        : '<div class="bd-portfolio-empty">' + esc(pr.name) + "</div>") +
      "</div>";
    var gearBlock =
      '<div class="bd-portfolio-gear-col">' +
      renderGearPanel(modA, capA, false) +
      (modB ? renderGearPanel(modB, capB, false) : "") +
      "</div>";
    return (
      '<article class="bd-portfolio-row" id="bd-proj-' +
      esc(pr.slug) +
      '">' +
      '<header class="bd-portfolio-row-hd">' +
      '<span class="bd-portfolio-num">' +
      n +
      "</span>" +
      "<h3>" +
      esc(pr.name) +
      "</h3>" +
      '<span class="bd-portfolio-meta">' +
      esc(loc) +
      (pr.year ? " · " + esc(pr.year) : "") +
      "</span></header>" +
      '<div class="bd-portfolio-duo">' +
      venuePanel +
      gearBlock +
      "</div>" +
      '<div class="bd-portfolio-copy">' +
      (sub ? '<p class="bd-portfolio-sub">' + esc(sub) + "</p>" : "") +
      "<p>" +
      esc(teaser || "") +
      "</p>" +
      (quote ? '<blockquote class="bd-portfolio-quote">' + esc(quote) + "</blockquote>" : "") +
      '<div class="bd-portfolio-links">' +
      (pr.url
        ? '<a href="' +
          esc(pr.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(lang() === "en" ? "Vitrum case study ↗" : "Vitrum proje sayfası ↗") +
          "</a>"
        : "") +
      (modA
        ? '<a href="' +
          esc(moduleHref(modA.slug || modA)) +
          '">' +
          esc(lang() === "en" ? "Besos module" : "Besos modül") +
          " · " +
          esc(modLabel(modA)) +
          " →</a>"
        : "") +
      "</div></div></article>"
    );
  }

  function buildInterludeChunks(catalogue, projectsData, usedSlugs) {
    var groups = (projectsData && projectsData.interludeGroups) || [];
    var byCat = {};
    catalogue.forEach(function (p) {
      var k = catGroupKey(p.category);
      if (!byCat[k]) byCat[k] = [];
      byCat[k].push(p);
    });
    var chunks = [];
    groups.forEach(function (g) {
      var items = (byCat[g.categoryKey] || []).filter(function (p) {
        return p.slug && !usedSlugs[p.slug];
      });
      if (!items.length) return;
      items.sort(function (a, b) {
        return (a.page || 0) - (b.page || 0);
      });
      chunks.push({
        label: lang() === "en" ? g.labelEn || g.labelTr : g.labelTr || g.labelEn,
        items: items.slice(0, 4),
      });
      items.slice(0, 4).forEach(function (p) {
        usedSlugs[p.slug] = true;
      });
    });
    var rest = catalogue.filter(function (p) {
      return p.slug && !usedSlugs[p.slug];
    });
    if (rest.length) {
      chunks.push({
        label: lang() === "en" ? "More from the catalogue" : "Katalogdan diğer modüller",
        items: rest.slice(0, 3),
      });
    }
    return chunks;
  }

  function renderInterlude(chunk) {
    if (!chunk || !chunk.items || !chunk.items.length) return "";
    return (
      '<section class="bd-portfolio-interlude">' +
      '<div class="bd-portfolio-interlude-hd">' +
      '<p class="bd-vl-kicker">' +
      esc(lang() === "en" ? "Catalogue" : "Katalog") +
      "</p>" +
      "<h3>" +
      esc(chunk.label) +
      "</h3></div>" +
      '<div class="bd-portfolio-gear-row">' +
      chunk.items
        .map(function (p) {
          return renderGearPanel(p, "", true);
        })
        .join("") +
      "</div></section>"
    );
  }

  function renderProjects(el, projectsData, catalogue) {
    var list = (projectsData && projectsData.projects) || [];
    catalogue = catalogue || [];
    if (!list.length) {
      el.innerHTML = "";
      return;
    }
    var usedSlugs = collectFeaturedSlugs(list);
    var interludes = buildInterludeChunks(catalogue, projectsData, usedSlugs);
    var html = "";
    var interludeIdx = 0;
    list.forEach(function (pr, i) {
      html += renderPortfolioProject(pr, catalogue, i);
      if (i < list.length - 1 && interludes[interludeIdx]) {
        html += renderInterlude(interludes[interludeIdx]);
        interludeIdx++;
      }
    });
    while (interludeIdx < interludes.length) {
      html += renderInterlude(interludes[interludeIdx]);
      interludeIdx++;
    }
    el.innerHTML =
      '<section class="bd-vl-projects" id="bd-vitrum-projects" aria-label="Bar projeleri">' +
      '<div class="bd-vl-projects-head">' +
      '<p class="bd-vl-kicker">' +
      esc(lang() === "en" ? "Featured projects" : "Öne çıkan projeler") +
      "</p>" +
      "<h2>" +
      esc(lang() === "en" ? "Venue & module portfolio" : "Mekân ve modül portföyü") +
      "</h2>" +
      "<p>" +
      esc(
        lang() === "en"
          ? "Vitrum bar projects paired with catalogue modules — venue photography beside equipment renders. Technical drawings live on each module page."
          : "Vitrum saha projeleri ve katalog modülleri yan yana. Teknik çizimler modül sayfasında."
      ) +
      "</p></div>" +
      '<div class="bd-portfolio">' +
      html +
      "</div></section>";
  }

  function renderTestimonials(el, data) {
    var list = data.testimonials || [];
    if (!list.length) {
      el.innerHTML = "";
      return;
    }
    el.innerHTML =
      '<section class="bd-vl-quote" aria-label="Referanslar">' +
      '<div class="bd-vl-quote-grid">' +
      list
        .map(function (t) {
          return (
            '<blockquote class="bd-vl-quote-card"><p>“' +
            esc(pick(t, "quote", "quoteEn")) +
            '”</p><footer><strong>' +
            esc(t.author) +
            "</strong> · " +
            esc(pick(t, "roleTr", "roleEn") || t.role || "") +
            "</footer></blockquote>"
          );
        })
        .join("") +
      "</div></section>";
  }

  function mount(opts) {
    opts = opts || {};
    var intro = document.getElementById("bd-vitrum-intro");
    var sig = document.getElementById("bd-vitrum-sig-trio");
    var modular = document.getElementById("bd-vitrum-modular");
    var method = document.getElementById("bd-vitrum-method");
    var projects = document.getElementById("bd-vitrum-projects-host");
    var quotes = document.getElementById("bd-vitrum-quotes");
    if (!intro) return Promise.resolve();

    return Promise.all([
      fetch(LANDING_URL, { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : {};
      }),
      fetch(PROJECTS_URL, { cache: "no-store" }).then(function (r) {
        return r.ok ? r.json() : {};
      }),
    ])
      .then(function (res) {
        var landing = res[0] || {};
        var proj = res[1] || {};
        var catalogue = opts.catalogue || [];
        renderIntro(intro, landing);
        if (sig) renderSigTrio(sig, landing, catalogue);
        if (modular) renderModular(modular, landing);
        if (method) renderMethod(method, landing);
        if (projects) renderProjects(projects, proj, catalogue);
        if (quotes) renderTestimonials(quotes, landing);
      })
      .catch(function (e) {
        console.warn("[bd-vitrum-landing]", e);
      });
  }

  window.EqBarDesignVitrum = { mount: mount };
})();
