/**
 * Link üzerindeyken dikey kaydırma:
 * - Orta tuş (roller): yeni sekme yerine sürükleyerek sayfa kaydırma
 * - Tekerlek: yatay taşırıcı şerit / link üstünde dikey niyet → sayfa scroll
 */
(function () {
  "use strict";

  var SKIP =
    "input,textarea,select,option,[contenteditable='true'],iframe,.eq-yt,.eq-yt iframe";

  function skipped(el) {
    return !!(el && el.closest && el.closest(SKIP));
  }

  function wheelPixelsY(e) {
    var dy = e.deltaY;
    if (e.deltaMode === 1) return dy * 32;
    if (e.deltaMode === 2) return dy * (window.innerHeight || 600);
    return dy;
  }

  function findHorizScrollHost(el) {
    for (var n = el; n && n !== document.documentElement; n = n.parentElement) {
      try {
        var st = window.getComputedStyle(n);
        var ox = st.overflowX;
        if (ox !== "auto" && ox !== "scroll" && ox !== "overlay") continue;
        if (n.scrollWidth > n.clientWidth + 2) return n;
      } catch (_) {}
    }
    return null;
  }

  /* ── Tekerlek: yatay bant üstünde dikey scroll sayfaya ── */
  document.addEventListener(
    "wheel",
    function (e) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey) return;
      if (skipped(e.target)) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      var host = findHorizScrollHost(e.target);
      if (!host) return;
      var dy = wheelPixelsY(e);
      if (!dy) return;
      window.scrollBy(0, dy);
      e.preventDefault();
    },
    { passive: false, capture: true }
  );

  /* ── Orta tuş linkte: yeni sekme açma, sürükleyerek kaydır ── */
  var midDrag = null;

  document.addEventListener(
    "mousedown",
    function (e) {
      if (e.button !== 1) return;
      if (skipped(e.target)) return;
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;
      e.preventDefault();
      e.stopPropagation();
      midDrag = {
        y0: e.clientY,
        scroll0: window.scrollY || document.documentElement.scrollTop || 0,
      };
    },
    true
  );

  document.addEventListener(
    "mousemove",
    function (e) {
      if (!midDrag || (e.buttons & 4) === 0) return;
      var dy = e.clientY - midDrag.y0;
      window.scrollTo(0, midDrag.scroll0 - dy);
    },
    true
  );

  function endMidDrag() {
    midDrag = null;
  }

  document.addEventListener("mouseup", function (e) {
    if (e.button === 1) endMidDrag();
  }, true);
  document.addEventListener("mouseleave", endMidDrag, true);
  window.addEventListener("blur", endMidDrag);

  document.addEventListener(
    "auxclick",
    function (e) {
      if (e.button !== 1) return;
      if (skipped(e.target)) return;
      if (e.target.closest && e.target.closest("a[href]")) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
})();
