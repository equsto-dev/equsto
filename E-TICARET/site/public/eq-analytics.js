/**
 * GA4 + Google Ads (gtag) — NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_GOOGLE_ADS_ID
 * Consent Mode v2 + dönüşüm: window.equstoTrackConversion("lead"|"quote"|"order", { ... })
 * Lead kaynakları: whatsapp_click, phone_click, pfos_cta_click (data-eq-track veya delegasyon)
 */
(function () {
  if (typeof document === "undefined") return;

  /** Kamu telefon — lib/site/public-phone.ts HIDE_PUBLIC_PHONE ile senkron tutun */
  window.EQUSTO_HIDE_PUBLIC_PHONE = false;

  var CONSENT_KEY = "equsto_cookie_consent";

  var ga4 =
    typeof window !== "undefined" && window.EQUSTO_GA4_ID
      ? String(window.EQUSTO_GA4_ID).trim()
      : "";
  var ads =
    typeof window !== "undefined" && window.EQUSTO_GOOGLE_ADS_ID
      ? String(window.EQUSTO_GOOGLE_ADS_ID).trim()
      : "";
  var primary = ga4 || ads;
  if (!primary) {
    /** Env yokken de tıklama event API'si dursun (no-op); ajans kurulumu sonrası çalışır */
    window.equstoTrackEvent = window.equstoTrackEvent || function () {};
    window.equstoTrackConversion = window.equstoTrackConversion || function () {};
    window.equstoTrackLead = window.equstoTrackLead || function () {};
    bindLeadDelegates();
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  /** Google Consent Mode v2 — varsayılan denied (AB/EEA uyumu) */
  window.gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });

  function applyConsent(granted) {
    var state = granted ? "granted" : "denied";
    window.gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }

  window.equstoUpdateConsent = function (granted) {
    try {
      localStorage.setItem(CONSENT_KEY, granted ? "granted" : "denied");
    } catch (_) {}
    applyConsent(!!granted);
  };

  try {
    if (localStorage.getItem(CONSENT_KEY) === "granted") {
      applyConsent(true);
    }
  } catch (_) {}

  var s = document.createElement("script");
  s.async = true;
  s.src =
    "https://www.googletagmanager.com/gtag/js?id=" +
    encodeURIComponent(primary);
  document.head.appendChild(s);
  window.gtag("js", new Date());

  if (ga4) window.gtag("config", ga4, { send_page_view: true });
  if (ads) {
    window.gtag("config", ads);
    if (!ga4) window.gtag("event", "page_view");
  }

  window.equstoTrackEvent = function (name, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  };

  /** Google Ads dönüşüm etiketleri — env ile (opsiyonel) */
  window.equstoTrackConversion = function (type, params) {
    var p = params || {};
    window.equstoTrackEvent("equsto_" + type, p);
    var labels = window.EQUSTO_ADS_CONVERSION_LABELS || {};
    var label = labels[type];
    if (ads && label) {
      window.gtag("event", "conversion", {
        send_to: ads + "/" + label,
        value: p.value,
        currency: p.currency || "TRY",
      });
    }
  };

  /**
   * İletişim lead'i (WA / telefon / PFOS CTA).
   * Ads'te lead conversion label'ı doluysa conversion da gönderilir.
   */
  window.equstoTrackLead = function (source, params) {
    var p = Object.assign({ source: source || "unknown" }, params || {});
    window.equstoTrackEvent(String(source || "lead_click"), p);
    window.equstoTrackConversion("lead", p);
  };

  bindLeadDelegates();

  function bindLeadDelegates() {
    if (window.__eqLeadTrackBound) return;
    window.__eqLeadTrackBound = true;

    document.addEventListener(
      "click",
      function (ev) {
        var el = ev.target;
        if (!el || !el.closest) return;
        var tracked = el.closest("[data-eq-track]");
        if (tracked) {
          var kind = tracked.getAttribute("data-eq-track") || "";
          var src = tracked.getAttribute("data-eq-track-source") || "dom";
          if (kind === "whatsapp_click" || kind === "phone_click" || kind === "pfos_cta_click") {
            try {
              (window.equstoTrackLead || function () {})(kind, {
                source: src,
                href: tracked.getAttribute("href") || "",
                path: location.pathname,
              });
            } catch (_) {}
          }
          return;
        }

        var tel = el.closest('a[href^="tel:"]');
        if (tel) {
          try {
            (window.equstoTrackLead || function () {})("phone_click", {
              source: "tel_link",
              href: tel.getAttribute("href") || "",
              path: location.pathname,
            });
          } catch (_) {}
          return;
        }

        var waFab = el.closest(".equsto-contact-wa-fab");
        if (waFab) {
          try {
            (window.equstoTrackLead || function () {})("whatsapp_click", {
              source: waFab.classList.contains("equsto-contact-wa-fab--tabbar")
                ? "tabbar_fab"
                : "floating_fab",
              path: location.pathname,
            });
          } catch (_) {}
          return;
        }

        var waBtn = el.closest(".eq-cmf-btn--wa");
        if (waBtn) {
          try {
            (window.equstoTrackLead || function () {})("whatsapp_click", {
              source: "pdp_buybox",
              path: location.pathname,
            });
          } catch (_) {}
          return;
        }

        var pfos = el.closest("a.eq-cmf-btn--pfos, a[href*='/pfos']");
        if (pfos && pfos.tagName === "A") {
          var href = pfos.getAttribute("href") || "";
          if (/\/pfos(\/|$|\?|#)/i.test(href) || pfos.classList.contains("eq-cmf-btn--pfos")) {
            try {
              (window.equstoTrackLead || function () {})("pfos_cta_click", {
                source: pfos.classList.contains("eq-cmf-btn--pfos") ? "pdp_buybox" : "link",
                href: href,
                path: location.pathname,
              });
            } catch (_) {}
          }
        }
      },
      true
    );
  }
})();
