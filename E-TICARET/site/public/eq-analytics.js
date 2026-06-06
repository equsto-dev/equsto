/**
 * GA4 + Google Ads (gtag) — NEXT_PUBLIC_GA4_ID / NEXT_PUBLIC_GOOGLE_ADS_ID
 * Dönüşüm: window.equstoTrackConversion("lead"|"quote"|"order", { ... })
 */
(function () {
  if (typeof document === "undefined") return;

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

  if (!window.gtag) {
    var s = document.createElement("script");
    s.async = true;
    s.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(primary);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
  }

  if (ga4) window.gtag("config", ga4, { send_page_view: true });
  if (ads) window.gtag("config", ads);

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
