/**
 * Opsiyonel ölçüm: Search Console doğrulama meta / GA4 yükleme.
 * Canlı ortamda <head> içine snippet koymak istemezseniz, burada kimlikleri set edin:
 *   <script>window.EQUSTO_GA4_ID="G-XXXX";</script>
 *   <script src="/eq-analytics.js" defer></script>
 */
(function () {
  if (typeof document === "undefined") return;
  var id = typeof window !== "undefined" && window.EQUSTO_GA4_ID ? String(window.EQUSTO_GA4_ID).trim() : "";
  if (!id) return;
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", id);
})();
