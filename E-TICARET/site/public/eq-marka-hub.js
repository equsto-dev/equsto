/**
 * Markalarımız hub — iş ortağı kartları (/shop/marka)
 * Logo → Equsto marka ürünleri; alt band → resmi web sitesi
 * @version 20260531marka3
 */
(function () {
  "use strict";

  var BRANDS_JSON = "/data/markalarimiz-brands.json?v=20260531marka3";
  var EXT_ICON =
    '<svg class="eq-partner-card__ext" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M14 3h7v7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M10 14L21 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
    '<path d="M21 14v7h-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M3 10V3h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M3 21l8-8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';

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

  function brandHref(brand) {
    var name = brand && (brand.catalogName || brand.name);
    var slug = brand && brand.slug;
    try {
      if (typeof window.eqBrandHref === "function") {
        if (slug) return window.eqBrandHref(slug);
        if (name) return window.eqBrandHref(name);
      }
    } catch (_) {}
    slug =
      slug ||
      String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return "/shop/marka/" + encodeURIComponent(slug);
  }

  function brandDesc(brand) {
    if (brand.descriptionKey) {
      var fb = brand.description || "";
      return t(brand.descriptionKey, fb);
    }
    return brand.description || "";
  }

  function injectCssOnce() {
    if (document.getElementById("eq-marka-hub-css")) return;
    var css =
      ".eq-marka-hub{padding:28px 20px 48px;max-width:1200px;margin:0 auto}" +
      ".eq-marka-hub-hero{margin-bottom:28px}" +
      ".eq-marka-hub-hero h1{font-size:clamp(22px,3.2vw,28px);font-weight:800;margin:0 0 8px;letter-spacing:.06em;text-transform:uppercase;color:var(--eq-text)}" +
      ".eq-marka-hub-lead{margin:0;font-size:14px;line-height:1.5;color:var(--eq-text-secondary)}" +
      ".eq-partner-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}" +
      ".eq-partner-card{display:flex;flex-direction:column;border:1px solid var(--eq-border);border-radius:4px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden;min-height:100%}" +
      ".eq-partner-card__logo-wrap{display:flex;align-items:center;justify-content:center;min-height:120px;padding:24px 20px 16px;text-decoration:none;background:#fff}" +
      ".eq-partner-card__logo-wrap--dark{background:#111}" +
      ".eq-partner-card__logo{display:block;max-width:85%;max-height:52px;width:auto;height:auto;object-fit:contain}" +
      ".eq-partner-card__name{font-size:15px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--eq-text);text-align:center}" +
      ".eq-partner-card__logo-wrap--dark .eq-partner-card__name{color:#fff}" +
      ".eq-partner-card__desc{flex:1;margin:0;padding:0 18px 16px;font-size:12px;line-height:1.65;color:var(--eq-text-secondary);text-align:left}" +
      ".eq-partner-card__foot{border-top:1px solid var(--eq-border);background:var(--eq-surface-2);padding:0}" +
      ".eq-partner-card__web{display:flex;align-items:center;justify-content:flex-start;gap:8px;padding:11px 18px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--eq-text-muted);text-decoration:none;transition:background .15s ease,color .15s ease}" +
      ".eq-partner-card__web:hover{background:var(--eq-hover);color:var(--eq-text)}" +
      ".eq-partner-card__ext{flex:0 0 auto;opacity:.75}" +
      ".eq-marka-hub-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px}" +
      ".eq-marka-hub-actions a{display:inline-flex;padding:10px 16px;border-radius:4px;font-size:13px;font-weight:600;text-decoration:none}" +
      ".eq-marka-hub-a-primary{background:#001e50;color:#fff;border:1px solid #001e50}" +
      ".eq-marka-hub-a-secondary{background:var(--eq-surface);color:var(--eq-text);border:1px solid var(--eq-border)}" +
      "body.eq-marka-hub #eq-filter-col{display:none!important}" +
      "body.eq-marka-hub .body .right-col{width:100%}" +
      "@media(max-width:900px){.eq-partner-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}" +
      "@media(max-width:560px){.eq-partner-grid{grid-template-columns:1fr}}";
    var st = document.createElement("style");
    st.id = "eq-marka-hub-css";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function cardHtml(brand) {
    var name = String((brand && brand.name) || "").trim();
    if (!name) return "";
    var internal = brandHref(brand);
    var logo = brand && brand.logo ? String(brand.logo).trim() : "";
    var logoBg = brand && brand.logoBg ? String(brand.logoBg).trim() : "";
    var light = !!(brand && brand.logoLight);
    var desc = brandDesc(brand);
    var website = brand && brand.website ? String(brand.website).trim() : "";
    var logoCls = "eq-partner-card__logo-wrap" + (light || logoBg ? " eq-partner-card__logo-wrap--dark" : "");
    var logoStyle = logoBg && !light ? ' style="background:' + esc(logoBg) + ';"' : logoBg || light ? ' style="background:#111;"' : "";
    var img =
      logo
        ? '<img class="eq-partner-card__logo" src="' +
          esc(logo) +
          '" alt="' +
          esc(name) +
          '" loading="lazy" decoding="async" onerror="this.style.display=\'none\';var n=this.nextElementSibling;if(n)n.hidden=false;">'
        : "";
    var webFoot = website
      ? '<div class="eq-partner-card__foot"><a class="eq-partner-card__web" href="' +
        esc(website) +
        '" target="_blank" rel="noopener noreferrer">' +
        esc(t("page.marka_website", "Web sitesi")) +
        " — " +
        EXT_ICON +
        "</a></div>"
      : "";
    return (
      '<article class="eq-partner-card">' +
      '<a class="' +
      logoCls +
      '" href="' +
      esc(internal) +
      '"' +
      logoStyle +
      ' aria-label="' +
      esc(name) +
      " — " +
      esc(t("page.marka_products_aria", "Equsto ürünleri")) +
      '">' +
      img +
      '<span class="eq-partner-card__name"' +
      (logo ? " hidden" : "") +
      ">" +
      esc(name) +
      "</span></a>" +
      (desc ? '<p class="eq-partner-card__desc">' + esc(desc) + "</p>" : "") +
      webFoot +
      "</article>"
    );
  }

  function render(root, brands) {
    if (!root) return;
    injectCssOnce();
    var list = Array.isArray(brands) ? brands : [];
    var cards = list.map(cardHtml).join("");
    root.innerHTML =
      '<div class="eq-marka-hub">' +
      '<div class="eq-marka-hub-hero">' +
      "<h1>" +
      esc(t("page.marka_h1", "İş ortaklarımız")) +
      "</h1>" +
      '<p class="eq-marka-hub-lead">' +
      esc(t("page.marka_subtitle", "Güvenilir iş ortaklarımızla kaliteli hizmet")) +
      "</p></div>" +
      '<section class="eq-marka-hub-section" aria-label="' +
      esc(t("home.brands_aria", "Markalar")) +
      '">' +
      '<div class="eq-partner-grid" id="eq-partner-grid">' +
      cards +
      "</div></section>" +
      '<div class="eq-marka-hub-actions">' +
      '<a class="eq-marka-hub-a-primary" href="/contact">' +
      esc(t("page.marka_cta_quote", "Teklif ve proje talebi")) +
      "</a>" +
      '<a class="eq-marka-hub-a-secondary" href="/pfos">' +
      esc(t("page.marka_cta_pfos", "Proje Fabrikası")) +
      "</a></div></div>";
  }

  function loadBrands() {
    var w = typeof window !== "undefined" ? window : {};
    if (w.__EQUSTO_MARKA_HUB_BRANDS && Array.isArray(w.__EQUSTO_MARKA_HUB_BRANDS)) {
      return Promise.resolve(w.__EQUSTO_MARKA_HUB_BRANDS);
    }
    return fetch(BRANDS_JSON, { credentials: "same-origin", cache: "default" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        return (j && j.brands) || [];
      })
      .catch(function () {
        return [];
      });
  }

  function mount(root) {
    loadBrands().then(function (brands) {
      render(root, brands);
    });
  }

  window.EqMarkaHub = { mount: mount, render: render, loadBrands: loadBrands };
})();
