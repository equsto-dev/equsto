/**

 * Equsto — Amazon tarzı vitrin alt bilgisi (body.eq-shop; admin ve Bar Design hariç, PFOS dahil).

 * Veri: /data/footer-vitrin.json — href her zaman dolu (eski site / sitemap).

 * @version vitrum-powered 20260530footer-kilit

 */

(function () {

  "use strict";



  var FOOTER_JSON = "/data/footer-vitrin.json?v=20260609iletisim-cafemarkt";

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



  /** KİLİT — tam metin: harf arası 1 boşluk, kelime arası 3 boşluk (footer-brand-KILIT.txt) */
  var COMPANY_DISPLAY_LINE = "E Q U S T O   T E K N O L O J İ   L İ M İ T E D";

  function companyMarkup() {
    return esc(COMPANY_DISPLAY_LINE);
  }

  function applyCompanyLine(el) {
    if (!el) return;
    el.setAttribute("data-i18n-skip", "");
    el.setAttribute("data-eq-co-layout", "letter1-word3");
    if (el.textContent !== COMPANY_DISPLAY_LINE) {
      el.textContent = COMPANY_DISPLAY_LINE;
    }
  }

  function fixCompanyLine(host) {
    if (host && host.querySelector) {
      applyCompanyLine(host.querySelector(".eq-mfoot-company"));
      return;
    }
    document.querySelectorAll(".eq-mfoot-company").forEach(applyCompanyLine);
  }

  function watchCompanyLine(host) {
    if (!host || host.__eqCoWatch) return;
    host.__eqCoWatch = true;
    try {
      var obs = new MutationObserver(function () {
        fixCompanyLine(host);
      });
      obs.observe(host, { subtree: true, childList: true, characterData: true });
      host.__eqCoObserver = obs;
    } catch (_) {}
  }

  window.__eqFixFooterCompanyAll = fixCompanyLine;
  window.__eqFooterCompanyDisplayLine = COMPANY_DISPLAY_LINE;



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



  function contactBlockHtml(contact) {
    if (!contact) return "";
    var parts = [];
    if (contact.email) {
      parts.push(
        '<a class="eq-mfoot-contact-item" href="mailto:' +
          esc(contact.email) +
          '">' +
          esc(contact.email) +
          "</a>"
      );
    }
    if (contact.phoneTel && contact.phoneDisplay) {
      parts.push(
        '<a class="eq-mfoot-contact-item" href="tel:' +
          esc(String(contact.phoneTel).replace(/\s/g, "")) +
          '">' +
          esc(contact.phoneDisplay) +
          "</a>"
      );
    }
    var wa = contact.whatsapp || (window.EQUSTO_WHATSAPP_E164 || "");
    wa = String(wa).replace(/\D/g, "");
    if (wa.length >= 10) {
      parts.push(
        '<a class="eq-mfoot-contact-item eq-mfoot-contact-wa" href="https://wa.me/' +
          esc(wa) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(t("footer.contact_whatsapp", "WhatsApp")) +
          "</a>"
      );
    }
    if (!parts.length) return "";
    return '<div class="eq-mfoot-contact">' + parts.join("") + "</div>";
  }

  function colHtml(titleKey, titleFb, links, contact) {

    var lis = links

      .map(function (ln) {

        var target = resolveLinkHref(ln.rawHref || ln.href || ln.path || "#");
        var ext = /^https?:\/\//i.test(target);
        var extAttr = ext ? ' target="_blank" rel="noopener noreferrer"' : "";
        var contactExtra =
          ln.key === "footer.link_contact" ? contactBlockHtml(contact) : "";
        var liClass = contactExtra ? ' class="eq-mfoot-contact-li"' : "";

        return (

          "<li" + liClass + "><a href=\"" +

          esc(target) +

          '"' + extAttr + ' data-eq-nav="' +

          esc(ln.rawHref || ln.href || ln.path || "#") +

          '">' +

          esc(t(ln.key, ln.label)) +

          "</a>" + contactExtra + "</li>"

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
        terms: "/iletisim",
        privacy: "/iletisim",
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

            { key: "footer.link_quote", label: "Teklif ve proje talebi", href: "/iletisim" },

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

          contact: {

            email: "info@equsto.com",

            phoneDisplay: "+90 532 684 01 52",

            phoneTel: "+905326840152",

            whatsapp: "905326840152",

          },

          links: [

            { key: "footer.link_about", label: "Hakkımızda", href: "/hakkimizda.html" },

            { key: "footer.link_bank", label: "Banka Bilgilerimiz", href: "#" },

            { key: "footer.link_export", label: "Export", href: "#" },

            { key: "footer.link_career", label: "Kariyer", href: "#" },

            { key: "footer.link_contact", label: "İletişim", href: "/iletisim" },

            { key: "footer.link_corporate", label: "Kurumsal Sitemiz", href: "#" },

            { key: "footer.link_blog", label: "Blog", href: "/blog" },

            { key: "footer.link_uk", label: "UK", href: "#" },

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

        contact: col.contact || null,

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
    return (
      esc(prefix) +
      ' <a class="eq-mfoot-vitrum-name" href="https://www.vitrumgroup.org/" target="_blank" rel="noopener noreferrer">Vitrum</a>'
    );
  }

  function isBesosPage() {
    var b = document.body;
    return !!(b && b.classList.contains("bd-page") && b.classList.contains("besos"));
  }



  function buildHtml(data) {

    var cols = normalizeColumns(data)

      .map(function (c) {

        return colHtml(c.titleKey, c.titleFb, c.links, c.contact);

      })

      .join("");



    var tagline = t("footer.tagline", (data && data.tagline) || defaultFooterData().tagline);

    var poweredBlock = isBesosPage()
      ? '<p class="eq-mfoot-powered">' + poweredByHtml() + "</p>"
      : "";

    var legal = (data && data.legal) || defaultFooterData().legal;

    var year = new Date().getFullYear();



    return (

      '<div class="eq-mfoot-main">' +

      '<div class="eq-mfoot-inner">' +

      '<div class="eq-mfoot-cols">' +

      cols +

      "</div>" +

      '<div class="eq-mfoot-brand">' +

      '<p class="eq-mfoot-company" data-i18n-skip data-eq-co-layout="letter1-word3" aria-label="Equsto Teknoloji Limited">' +

      companyMarkup() +

      "</p>" +

      '<p class="eq-mfoot-tagline" data-i18n="footer.tagline">' +

      esc(tagline) +

      "</p>" +

      poweredBlock +

      "</div>" +

      "</div>" +

      "</div>" +

      '<div class="eq-mfoot-legal">' +

      '<div class="eq-mfoot-legal-inner">' +

      '<nav class="eq-mfoot-legal-nav" aria-label="' +

      esc(t("footer.legal_aria", "Yasal")) +

      '">' +

      '<a href="' +

      esc(resolveLinkHref(legal.terms || "/iletisim")) +

      '">' +

      esc(t("footer.terms", "Şartlar ve koşullar")) +

      "</a>" +

      '<a href="' +

      esc(resolveLinkHref(legal.privacy || "/iletisim")) +

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



  function removeScrollControls(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope
      .querySelectorAll(
        ".eq-mfoot-back, #eq-mfoot-back, .eq-mfoot-top, #eq-mfoot-top, [data-eq-mfoot-top], a.eq-mfoot-top"
      )
      .forEach(function (el) {
        el.remove();
      });
    if (root && root.querySelectorAll) {
      root
        .querySelectorAll(".eq-mfoot-brand > button, .eq-mfoot-main > button")
        .forEach(function (el) {
          if (el.id !== "eq-mfoot-cookie") el.remove();
        });
    }
  }

  function wire(host) {

    wireLinkHrefs(host);

    removeScrollControls(host);

    try {

      if (typeof window.eqI18nApply === "function") window.eqI18nApply(host);

    } catch (_) {}

    fixCompanyLine(host);

    watchCompanyLine(host);

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

      removeScrollControls(document);

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

      fixCompanyLine();

    } catch (_) {}

  });

})();


