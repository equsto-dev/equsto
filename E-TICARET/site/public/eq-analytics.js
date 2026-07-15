/**
 * GA4 + Google Ads (gtag) — NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_GOOGLE_ADS_ID
 * Consent Mode v2 + dönüşüm: window.equstoTrackConversion("lead"|"quote"|"order", { ... })
 */
(function () {
  if (typeof document === "undefined") return;

  /** Geçici: kamu telefon satırı (footer) — true = gizle. Geri: false */
  window.EQUSTO_HIDE_PUBLIC_PHONE = true;

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
  if (!primary) return;

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
})();
