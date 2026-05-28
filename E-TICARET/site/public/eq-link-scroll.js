/**
 * Orta tuş (roller) — link üzerinde:
 * - Basılı tutup hareket: sayfa kaydırır (yeni sekme açılmaz)
 * - Hızlı bas-bırak: linki yeni sekmede açar
 * Tekerlek: yatay şeritlerde dikey kaydırma sayfaya iletilir.
 */
(function () {
  "use strict";

  var SKIP =
    "input,textarea,select,option,[contenteditable='true'],iframe,.eq-yt,.eq-yt iframe";

  var HORIZ_ZONE =
    ".eq-rail,.eq-mbg-track,.eq-product-family-scroll--carousel," +
    "nav.topnav,.topnav-inner,.topnav,.eq-drawer-scroll,.eq-mcat-scroll," +
    "#bd-vitrum-jump,.bd-hdr-nav";

  var DRAG_PX = 5;

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

  function linkFrom(el) {
    if (!el || !el.closest) return null;
    var a = el.closest("a[href]");
    if (!a) return null;
    var href = (a.getAttribute("href") || "").trim();
    if (!href || href === "#") return null;
    return a;
  }

  function openLinkNewTab(a) {
    if (!a) return;
    var raw = (a.getAttribute("href") || "").trim();
    if (!raw || raw === "#") return;
    var url = raw;
    if (typeof window.equstoResolveNavHref === "function") {
      url = window.equstoResolveNavHref(raw);
    }
    if (!url || url === "#") return;
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (_) {}
  }

  /* ── Tekerlek: yatay şerit → dikey tekerlek sayfayı kaydırır ── */
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

  /* ── Orta tuş: tut + sürükle = kaydır; tık = yeni sekme ── */
  var mid = null;

  function endMid() {
    mid = null;
  }

  document.addEventListener(
    "mousedown",
    function (e) {
      if (e.button !== 1) return;
      if (skipped(e.target)) return;
      var a = linkFrom(e.target);
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      mid = {
        a: a,
        x0: e.clientX,
        y0: e.clientY,
        scroll0: window.scrollY || document.documentElement.scrollTop || 0,
        didDrag: false,
      };
    },
    true
  );

  document.addEventListener(
    "mousemove",
    function (e) {
      if (!mid || (e.buttons & 4) === 0) return;
      var dy = e.clientY - mid.y0;
      if (!mid.didDrag && Math.abs(dy) < DRAG_PX && Math.abs(e.clientX - mid.x0) < DRAG_PX) return;
      mid.didDrag = true;
      window.scrollTo(0, mid.scroll0 - dy);
    },
    true
  );

  document.addEventListener(
    "mouseup",
    function (e) {
      if (e.button !== 1 || !mid) return;
      if (!mid.didDrag) openLinkNewTab(mid.a);
      endMid();
    },
    true
  );

  window.addEventListener("blur", endMid);

  document.addEventListener(
    "auxclick",
    function (e) {
      if (e.button !== 1) return;
      if (skipped(e.target)) return;
      if (!linkFrom(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );
})();
