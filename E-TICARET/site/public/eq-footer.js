/**

 * Equsto — Amazon tarzı vitrin alt bilgisi (body.eq-shop; admin ve Bar Design hariç, PFOS dahil).

 * Veri: /data/footer-vitrin.json — href her zaman dolu (eski site / sitemap).

 * @version vitrum-powered 20260527f

 */

(function () {

  "use strict";



  var FOOTER_JSON = "/data/footer-vitrin.json?v=20260528steakhouse-col";

  var SSS_LINK = { key: "footer.link_sss", label: "SSS", href: "/sss" };

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



  /** Tek satır — harf arası 1 nbsp, sözcük arası 3 nbsp (tarayıcı tek boşluğa indirgemesin). */

  var COMPANY_PARTS = [

    "E Q U S T O",

    "T E K N O L O J İ",

    "L İ M İ T E D",

  ];

  var COMPANY_DISPLAY_LINE = COMPANY_PARTS.join("   ");



  function companyMarkup() {

    return COMPANY_PARTS.map(function (part) {

      return esc(part.replace(/ /g, "\u00a0"));

    }).join("\u00a0\u00a0\u00a0");

  }



  /** Kanonik yol; boş href üretmez. */

  function resolveLinkHref(raw) {

    var p = String(raw || "").trim();

    if (!p || p === "#") return "#";

    if (p.charAt(0) === "#") return p;

    if (/^https?:\/\//i.test(p) || /^mailto:/i.test(p) || /^tel:/i.test(p)) return p;

    if (p.charAt(0) !== "/") p = "/" + p;

    try {
      if (typeof window.equstoUrl === "function") {
        var base = p.split("?")[0].split("#")[0].replace(/\/+$/, "");
        if (base === "/sss" || base === "/sss.html") return window.equstoUrl("sss");
        if ((base === "/shop/marka" || base === "/marka.html") && typeof window.eqBrandPath === "function") {
          return window.eqBrandPath("");
        }
      }
    } catch (_) {}

    if (/\.html(\?|#|$)/i.test(p)) {

      try {

        if (typeof window.equstoResolveNavHref === "function") {

          var r = window.equstoResolveNavHref(p);

          if (r) return r;

        }

      } catch (_) {}

    }

    try {
      if (typeof window.eqI18nUrl === "function" && window.eqLang === "en") {
        return window.eqI18nUrl(p);
      }
    } catch (_) {}

    return p;

  }



  function shouldMount() {

    var b = document.body;

    if (!b || !b.classList.contains("eq-shop")) return false;

    if (b.classList.contains("admin-app")) return false;

    if (b.classList.contains("pf-page")) return false;

    /* Bar Design (Besos) — vitrin alt bandı göster */

    if (b.classList.contains("bd-page") && !b.classList.contains("besos")) return false;

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



  function isSssLink(ln) {

    var h = String(ln.rawHref || ln.href || ln.path || "").trim();

    return h === "/sss" || h === "/sss.html" || h === "#eq-mfoot-sss" || ln.key === "footer.link_sss";

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

      "<div class=\"eq-mfoot-col\">" +

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

      companyDisplay: COMPANY_DISPLAY_LINE,

      tagline: "Equsto Teknolojisi · Gastronomi Tasarımı",

      legal: {
        terms: "/contact",
        privacy: "/contact",
        returns: "/iade-politikasi",
        company: "Equsto Teknoloji Limited",
      },

      columns: [

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

            { key: "footer.link_steakhouse", label: "Steakhouse mutfak rehberi", href: "/steakhouse-kurulumu" },

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

            { key: "footer.link_sss", label: "SSS", href: "/sss" },

          ],

        },

        {

          titleKey: "footer.col_about",

          title: "Hakkımızda",

          links: [

            { key: "footer.link_about", label: "Equsto hakkında", href: "/hakkimizda.html" },

            { key: "footer.link_blog", label: "Rehber ve blog", href: "/blog" },

            { key: "footer.link_story", label: "Buradan başladık", href: "/buradan-basladi" },

            { key: "footer.link_contact", label: "İletişim", href: "/contact" },

            { key: "footer.link_projects", label: "Referans projeler", href: "/projeler" },

            { key: "footer.link_sitemap", label: "Site haritası", href: "/sitemap.xml" },

            { key: "footer.link_llms", label: "Asistan özet dosyası", href: "/llms.txt" },

            { key: "footer.link_marka", label: "Markalarımız", href: "/shop/marka" },

          ],

        },

      ],

    };

  }



  /** SSS linki yardım listesinin sonunda. */

  function ensureHelpColSss(data) {

    if (!data || !Array.isArray(data.columns)) return data;

    data.columns = data.columns.map(function (col) {

      var isHelp =

        col.titleKey === "footer.col_help" ||

        String(col.title || "").toLowerCase().indexOf("yardımcı") >= 0;

      if (!isHelp) return col;

      var links = Array.isArray(col.links) ? col.links.slice() : [];

      var sssIdx = -1;

      var sssItem = null;

      for (var i = 0; i < links.length; i++) {

        var ln = links[i];

        if (isSssLink(ln)) {

          sssIdx = i;

          sssItem = Object.assign({}, ln, { href: "/sss" });

          break;

        }

      }

      if (!sssItem) sssItem = SSS_LINK;

      else if (sssIdx >= 0) links.splice(sssIdx, 1);

      links.push(sssItem);

      return Object.assign({}, col, { links: links });

    });

    return data;

  }



  function normalizeColumns(data) {

    var cols = (data && data.columns) || [];

    return cols.map(function (col) {

      return {

        titleKey: col.titleKey || "",

        titleFb: col.title || col.titleFb || "",

        links: (col.links || []).map(function (ln) {

          var raw = ln.href || ln.path || "#";

          if (isSssLink(ln)) raw = "/sss";

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

        footerData = ensureHelpColSss(j && j.columns ? j : defaultFooterData());

        return footerData;

      })

      .catch(function () {

        footerData = ensureHelpColSss(defaultFooterData());

        return footerData;

      });

    return footerLoadPromise;

  }



  function poweredByHtml() {
    var prefix = t("footer.powered_by_prefix", "Powered By");
    return esc(prefix) + ' <span class="eq-mfoot-vitrum-name">Vitrum</span>';
  }



  function buildHtml(data) {

    var cols = normalizeColumns(data)

      .map(function (c) {

        return colHtml(c.titleKey, c.titleFb, c.links);

      })

      .join("");



    var companyLine = t("footer.company_display", companyMarkup());

    var tagline = t("footer.tagline", (data && data.tagline) || defaultFooterData().tagline);

    var poweredBy = poweredByHtml();

    var legal = (data && data.legal) || defaultFooterData().legal;

    var year = new Date().getFullYear();



    return (

      '<div class="eq-mfoot-main">' +

      '<div class="eq-mfoot-inner">' +

      '<div class="eq-mfoot-cols">' +

      cols +

      "</div>" +

      '<div class="eq-mfoot-brand">' +

      '<p class="eq-mfoot-company" data-i18n="footer.company_display" aria-label="Equsto Teknoloji Limited">' +

      esc(companyLine) +

      "</p>" +

      '<p class="eq-mfoot-tagline" data-i18n="footer.tagline">' +

      esc(tagline) +

      "</p>" +

      '<p class="eq-mfoot-powered">' +

      poweredBy +

      "</p>" +

      "</div>" +

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

      '<a href="' +

      esc(resolveLinkHref(legal.returns || "/iade-politikasi")) +

      '">' +

      esc(t("footer.returns", "İade politikası")) +

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

      if (h) a.setAttribute("href", h);

    });

  }



  function wire(host) {

    wireLinkHrefs(host);

    try {

      if (typeof window.eqI18nApply === "function") window.eqI18nApply(host);

    } catch (_) {}

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

    host.setAttribute("data-eq-mfoot-layout", "page-sss");

    host.innerHTML = buildHtml(data);

    wire(host);

  }



  function mountFooter() {

    if (!shouldMount()) return;

    var host = findHost();

    if (!host) return;

    loadFooterData().then(function (data) {

      render(host, data);

    });

  }



  function scheduleMount() {

    if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {

      window.eqI18nReady.then(mountFooter);

      return;

    }

    window.addEventListener("equsto:i18n-ready", mountFooter, { once: true });

  }



  function mount() {

    scheduleMount();

  }



  window.__eqMountMarketFooter = mount;



  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", mount, { once: true });

  } else {

    mount();

  }



  window.addEventListener("equsto:i18n-ready", function () {

    try {

      mountFooter();

    } catch (_) {}

  });

})();


