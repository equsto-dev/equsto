/**
 * Equsto — Amazon tarzı vitrin alt bilgisi (body.eq-shop, Proje Fabrikası / admin / Besos hariç).
 */
(function () {
  "use strict";

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

  function href(path) {
    try {
      if (typeof window.equstoResolveNavHref === "function") return window.equstoResolveNavHref(path);
    } catch (_) {}
    try {
      if (typeof window.equstoUrl === "function") {
        var p = String(path || "").replace(/^\//, "").replace(/\.html$/i, "");
        if (p === "index" || p === "") return window.equstoUrl("home");
        return window.equstoUrl(p);
      }
    } catch (_2) {}
    return path;
  }

  function shouldMount() {
    var b = document.body;
    if (!b || !b.classList.contains("eq-shop")) return false;
    if (b.classList.contains("admin-app") || b.classList.contains("bd-page")) return false;
    if (b.classList.contains("eq-pfos") || b.classList.contains("pf-page")) return false;
    return true;
  }

  function findHost() {
    var f = document.querySelector("footer.footer");
    if (f) return f;
    var pg = document.querySelector(".pg");
    if (!pg) return null;
    f = document.createElement("footer");
    f.className = "footer";
    var pad = document.querySelector(".imt-foot-pad");
    if (pad && pad.parentNode) pad.parentNode.insertBefore(f, pad);
    else pg.appendChild(f);
    return f;
  }

  function colHtml(titleKey, titleFb, links) {
    var lis = links
      .map(function (ln) {
        return (
          '<li><a href="' +
          esc(ln.href) +
          '">' +
          esc(t(ln.key, ln.label)) +
          "</a></li>"
        );
      })
      .join("");
    return (
      '<div class="eq-mfoot-col">' +
      "<h3>" +
      esc(t(titleKey, titleFb)) +
      "</h3>" +
      "<ul>" +
      lis +
      "</ul>" +
      "</div>"
    );
  }

  function columns() {
    return [
      {
        titleKey: "footer.col_about",
        titleFb: "Hakkımızda",
        links: [
          { key: "footer.link_contact", label: "İletişim", href: href("contact.html") },
          { key: "footer.link_projects", label: "Referans projeler", href: href("/projeler/") },
          { key: "footer.link_sitemap", label: "Site haritası", href: "/sitemap.xml" },
          { key: "footer.link_llms", label: "Asistan özet dosyası", href: "/llms.txt" },
          { key: "footer.link_steakhouse", label: "Steakhouse mutfak rehberi", href: href("steakhouse-kurulumu.html") },
        ],
      },
      {
        titleKey: "footer.col_shop",
        titleFb: "Kategoriler",
        links: [
          { key: "nav.pisirme", label: "Pişirme Ekipmanları", href: href("pisirme.html") },
          { key: "nav.sogutma", label: "Soğutma Ekipmanları", href: href("sogutma.html") },
          { key: "nav.kahve", label: "Kahve Ekipmanları", href: href("kahve.html") },
          { key: "nav.yikama", label: "Yıkama Ekipmanları", href: href("yikama.html") },
          { key: "nav.hazirlik", label: "Hazırlık Ekipmanları", href: href("hazirlik.html") },
          { key: "nav.icecek", label: "İçecek Ekipmanları", href: href("icecek.html") },
        ],
      },
      {
        titleKey: "footer.col_help",
        titleFb: "Size yardımcı olalım",
        links: [
          { key: "footer.link_quote", label: "Teklif ve proje talebi", href: href("contact.html") },
          { key: "footer.link_account", label: "Hesabım ve siparişler", href: href("login.html") },
          { key: "footer.link_guide_m2", label: "Rehber: mutfak m²", href: href("/rehber/mutfak-alani-kisi-basi-metrekare-2026") },
          { key: "footer.link_cafe", label: "Cafe kurulum rehberi", href: href("cafe-kurulumu.html") },
          { key: "footer.link_catering", label: "Catering mutfağı rehberi", href: href("catering-mutfagi.html") },
        ],
      },
      {
        titleKey: "footer.col_solutions",
        titleFb: "Çözümler",
        links: [
          { key: "nav.bar_design", label: "Bar Design Studio", href: href("bar-design.html") },
          { key: "footer.link_imt300", label: "IMT300 berrak buz", href: href("imt300.html") },
          { key: "nav.pfos", label: "Proje Fabrikası", href: href("pfos.html") },
          { key: "footer.link_fastfood", label: "Fast food kurulumu", href: href("fast-food-kurulumu.html") },
          { key: "footer.link_finedining", label: "Fine dining kurulumu", href: href("fine-dining-kurulumu.html") },
        ],
      },
    ];
  }

  function logoMarkup() {
    if (typeof window.EQUSTO_LOGO_SVG === "string" && window.EQUSTO_LOGO_SVG) {
      return window.EQUSTO_LOGO_SVG;
    }
    return '<span class="eq-mfoot-logo-text">EQUSTO</span>';
  }

  function buildHtml() {
    var cols = columns()
      .map(function (c) {
        return colHtml(c.titleKey, c.titleFb, c.links);
      })
      .join("");

    var partners = t(
      "footer.partners",
      "Hilton · Marriott · Migros · TAV · Sodexo · McDonald's"
    );
    var year = new Date().getFullYear();

    return (
      '<button type="button" class="eq-mfoot-back" id="eq-mfoot-back">' +
      esc(t("footer.back_to_top", "Başa dön")) +
      "</button>" +
      '<div class="eq-mfoot-main">' +
      '<div class="eq-mfoot-inner">' +
      '<div class="eq-mfoot-cols">' +
      cols +
      "</div>" +
      '<div class="eq-mfoot-brand">' +
      '<a class="eq-mfoot-logo" href="' +
      esc(href("index.html")) +
      '" aria-label="Equsto">' +
      logoMarkup() +
      "</a>" +
      '<span class="eq-mfoot-locale" aria-label="' +
      esc(t("footer.locale_aria", "Türkiye")) +
      '">' +
      '<span class="eq-mfoot-flag" aria-hidden="true">🇹🇷</span> ' +
      esc(t("footer.locale_label", "Türkiye")) +
      "</span>" +
      "</div>" +
      '<p class="eq-mfoot-partners">' +
      esc(partners) +
      "</p>" +
      "</div>" +
      "</div>" +
      '<div class="eq-mfoot-legal">' +
      '<div class="eq-mfoot-legal-inner">' +
      '<nav class="eq-mfoot-legal-nav" aria-label="' +
      esc(t("footer.legal_aria", "Yasal")) +
      '">' +
      '<a href="' +
      esc(href("contact.html")) +
      '">' +
      esc(t("footer.terms", "Şartlar ve koşullar")) +
      "</a>" +
      '<a href="' +
      esc(href("contact.html")) +
      '">' +
      esc(t("footer.privacy", "Gizlilik")) +
      "</a>" +
      '<button type="button" class="eq-mfoot-cookie" id="eq-mfoot-cookie">' +
      esc(t("common.manage_cookies", "Çerez tercihlerini yönet")) +
      "</button>" +
      "</nav>" +
      '<p class="eq-mfoot-copy">© ' +
      year +
      " Equsto Teknoloji Limited. " +
      esc(t("footer.all_rights", "Tüm hakları saklıdır.")) +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function wire(host) {
    var back = host.querySelector("#eq-mfoot-back");
    if (back) {
      back.addEventListener("click", function () {
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (_) {
          window.scrollTo(0, 0);
        }
      });
    }
    var cookie = host.querySelector("#eq-mfoot-cookie");
    if (cookie) {
      cookie.addEventListener("click", function () {
        var legacy = document.querySelector(".footer .cookie, .footer [data-i18n='common.manage_cookies']");
        if (legacy && typeof legacy.click === "function") legacy.click();
      });
    }
  }

  function mount() {
    if (!shouldMount()) return;
    var host = findHost();
    if (!host) return;
    host.className = "footer eq-mfoot";
    host.setAttribute("data-eq-mfoot", "1");
    host.innerHTML = buildHtml();
    wire(host);
  }

  window.__eqMountMarketFooter = mount;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }

  window.addEventListener("equsto:i18n-ready", function () {
    try {
      mount();
    } catch (_) {}
  });
})();
