/**
 * Tekerlek: yatay şeritlerde dikey kaydırma sayfaya iletilir.
 * Orta tuş (roller): tarayıcı varsayılanı — linkte yeni sekme, sürükle-kaydır vb.
 */
(function () {
  "use strict";

  var SKIP =
    "input,textarea,select,option,[contenteditable='true'],iframe,.eq-yt,.eq-yt iframe";

  var HORIZ_ZONE =
    ".eq-rail,.eq-mbg-track,.eq-product-family-scroll,.eq-product-family-scroll--carousel," +
    "nav.topnav,.topnav-inner,.topnav,.eq-drawer-scroll,.eq-mcat-scroll," +
    "#bd-vitrum-jump,.bd-hdr-nav";

  function skipped(el) {
    return !!(el && el.closest && el.closest(SKIP));
  }

  function wheelPixelsY(e) {
    var dy = e.deltaY;
    if (e.deltaMode === 1) return dy * 32;
    if (e.deltaMode === 2) return dy * (window.innerHeight || 600);
    return dy;
  }

  function horizZone(el) {
    return !!(el && el.closest && el.closest(HORIZ_ZONE));
  }

  document.addEventListener(
    "wheel",
    function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      if (skipped(e.target)) return;
      if (!horizZone(e.target)) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      var dy = wheelPixelsY(e);
      if (!dy) return;
      window.scrollBy(0, dy);
      e.preventDefault();
    },
    { passive: false, capture: true }
  );
})();
