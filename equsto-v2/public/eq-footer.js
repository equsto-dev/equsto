/**
 * Equsto — Amazon tarzı vitrin alt bilgisi (body.eq-shop, Proje Fabrikası / admin / Besos hariç).
 * Veri: /data/footer-vitrin.json — href her zaman dolu (eski site / sitemap).
 */
(function () {
  "use strict";

  var FOOTER_JSON = "/data/footer-vitrin.json?v=20260524foot3";
  var footerData = null;
  var footerLoadPromise = null;

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

  /** Kanonik yol; boş href üretmez. */
  function resolveLinkHref(raw) {
    var p = String(raw || "").trim();
    if (!p || p === "#") return "#";
    if (/^https?:\/\//i.test(p) || /^mailto:/i.test(p) || /^tel:/i.test(p)) return p;
    if (p.charAt(0) !== "/") p = "/" + p;
    if (/\.html(\?|#|$)/i.test(p)) {
      try {
        if (typeof window.equstoResolveNavHref === "function") {
          var r = window.equstoResolveNavHref(p);
          if (r) return r;
        }
      } catch (_) {}
    }
    return p;
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
        var target = resolveLinkHref(ln.rawHref || ln.href || ln.path || "#");
        return (
          '<li><a href="' +
          esc(target) +
          '" data-eq-nav="' +
          esc(ln.rawHref || ln.href || ln.path || "#") +
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

  function defaultFooterData() {
    return {
      tagline: "Equsto Teknolojisi · Gastronomi Tasarımı · Satış Mühendisliği",
      partners: "Hilton · Marriott · Migros · TAV · Sodexo · McDonald's",
      legal: { terms: "/contact", privacy: "/contact", company: "Equsto Teknoloji Limited" },
      columns: [
        {
          titleKey: "footer.col_about",
          title: "Hakkımızda",
          links: [
            { key: "footer.link_contact", label: "İletişim", href: "/contact" },
            { key: "footer.link_projects", label: "Referans projeler", href: "/projeler" },
            { key: "footer.link_sitemap", label: "Site haritası", href: "/sitemap.xml" },
            { key: "footer.link_llms", label: "Asistan özet dosyası", href: "/llms.txt" },
            { key: "footer.link_steakhouse", label: "Steakhouse mutfak rehberi", href: "/steakhouse-kurulumu" },
            { key: "footer.link_marka", label: "Markalarımız", href: "/marka.html" },
          ],
        },
        {
          titleKey: "footer.col_shop",
          title: "Kategoriler",
          links: [
            { key: "nav.pisirme", label: "Pişirme Ekipmanları", href: "/shop/pisirme" },
            { key: "nav.sogutma", label: "Soğutma Ekipmanları", href: "/shop/sogutma" },
            { key: "nav.kahve", label: "Kahve Ekipmanları", href: "/shop/kahve" },
            { key: "nav.yikama", label: "Yıkama Ekipmanları", href: "/shop/yikama" },
            { key: "nav.hazirlik", label: "Hazırlık Ekipmanları", href: "/shop/hazirlik" },
            { key: "nav.icecek", label: "İçecek Ekipmanları", href: "/shop/icecek" },
          ],
        },
        {
          titleKey: "footer.col_help",
          title: "Size yardımcı olalım",
          links: [
            { key: "footer.link_quote", label: "Teklif ve proje talebi", href: "/contact" },
            { key: "footer.link_account", label: "Hesabım ve siparişler", href: "/login.html" },
            { key: "footer.link_guide_m2", label: "Rehber: mutfak m²", href: "/rehber/mutfak-alani-kisi-basi-metrekare-2026" },
            { key: "footer.link_cafe", label: "Cafe kurulum rehberi", href: "/cafe-kurulumu" },
            { key: "footer.link_catering", label: "Catering mutfağı rehberi", href: "/catering-mutfagi" },
            { key: "footer.link_bulut", label: "Bulut mutfak kurulumu", href: "/bulut-mutfak-kurulumu" },
          ],
        },
        {
          titleKey: "footer.col_solutions",
          title: "Çözümler",
          links: [
            { key: "nav.bar_design", label: "Bar Design", href: "/besos" },
            {
              key: "footer.link_imt300",
              label: "IMT300 berrak buz",
              href: "/data/advanced-cuisine-clear-ice/product-imt300.html",
            },
            { key: "nav.pfos", label: "Proje Fabrikası", href: "/pfos" },
            { key: "footer.link_fastfood", label: "Fast food kurulumu", href: "/fast-food-kurulumu" },
            { key: "footer.link_finedining", label: "Fine dining kurulumu", href: "/fine-dining-kurulumu" },
            { key: "footer.link_allday", label: "All day dining kurulumu", href: "/all-day-dining-kurulumu" },
          ],
        },
      ],
    };
  }

  function normalizeColumns(data) {
    var cols = (data && data.columns) || [];
    return cols.map(function (col) {
      return {
        titleKey: col.titleKey || "",
        titleFb: col.title || col.titleFb || "",
        links: (col.links || []).map(function (ln) {
          var raw = ln.href || ln.path || "#";
          return {
            key: ln.key || "",
            label: ln.label || "",
            rawHref: raw,
            href: resolveLinkHref(raw),
          };
        }),
      };
    });
  }

  function loadFooterData() {
    if (footerData) return Promise.resolve(footerData);
    if (footerLoadPromise) return footerLoadPromise;
    footerLoadPromise = fetch(FOOTER_JSON, { credentials: "same-origin", cache: "default" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (j) {
        footerData = j && j.columns ? j : defaultFooterData();
        return footerData;
      })
      .catch(function () {
        footerData = defaultFooterData();
        return footerData;
      });
    return footerLoadPromise;
  }

  function logoMarkup() {
    if (typeof window.EQUSTO_LOGO_SVG === "string" && window.EQUSTO_LOGO_SVG) {
      return window.EQUSTO_LOGO_SVG;
    }
    return '<span class="eq-mfoot-logo-text">EQUSTO</span>';
  }

  function buildHtml(data) {
    var cols = normalizeColumns(data)
      .map(function (c) {
        return colHtml(c.titleKey, c.titleFb, c.links);
      })
      .join("");

    var tagline = t("footer.tagline", (data && data.tagline) || defaultFooterData().tagline);
    var partners = t("footer.partners", (data && data.partners) || defaultFooterData().partners);
    var legal = (data && data.legal) || defaultFooterData().legal;
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
      esc(resolveLinkHref("/")) +
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
      '<p class="eq-mfoot-tagline">' +
      esc(tagline) +
      "</p>" +
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
      esc(resolveLinkHref(legal.terms || "/contact")) +
      '">' +
      esc(t("footer.terms", "Şartlar ve koşullar")) +
      "</a>" +
      '<a href="' +
      esc(resolveLinkHref(legal.privacy || "/contact")) +
      '">' +
      esc(t("footer.privacy", "Gizlilik")) +
      "</a>" +
      '<button type="button" class="eq-mfoot-cookie" id="eq-mfoot-cookie">' +
      esc(t("common.manage_cookies", "Çerez tercihlerini yönet")) +
      "</button>" +
      "</nav>" +
      '<p class="eq-mfoot-copy">© ' +
      year +
      " " +
      esc(legal.company || "Equsto Teknoloji Limited") +
      ". " +
      esc(t("footer.all_rights", "Tüm hakları saklıdır.")) +
      "</p>" +
      "</div>" +
      "</div>"
    );
  }

  function wireLinkHrefs(host) {
    host.querySelectorAll("a[data-eq-nav]").forEach(function (a) {
      var raw = a.getAttribute("data-eq-nav");
      var h = resolveLinkHref(raw);
      if (h && h !== "#") a.setAttribute("href", h);
    });
  }

  function wire(host) {
    wireLinkHrefs(host);
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
        var legacy = document.querySelector(
          ".footer .cookie, .footer [data-i18n='common.manage_cookies'], #eq-cookie-manage"
        );
        if (legacy && typeof legacy.click === "function") legacy.click();
      });
    }
  }

  function render(host, data) {
    host.className = "footer eq-mfoot";
    host.setAttribute("data-eq-mfoot", "1");
    host.innerHTML = buildHtml(data);
    wire(host);
  }

  function mount() {
    if (!shouldMount()) return;
    var host = findHost();
    if (!host) return;
    loadFooterData().then(function (data) {
      render(host, data);
    });
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
