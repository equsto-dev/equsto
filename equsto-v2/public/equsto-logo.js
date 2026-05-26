/* EQUSTO wordmark — PNG: koyu bantta beyaz, açık zeminde siyah (filter yok; şeffaf PNG + invert kutusu yapar). */

(function () {
  var LOGO_V = "20260519wordmark3";
  var LOGO_DARK = "/images/equsto-logo.png?v=" + LOGO_V;
  var LOGO_LIGHT = "/images/equsto-logo-white.png?v=" + LOGO_V;

  window.EQUSTO_LOGO_SRC = LOGO_DARK;
  window.EQUSTO_LOGO_SRC_LIGHT = LOGO_LIGHT;
  window.EQUSTO_LOGO_V = LOGO_V;
  /** @deprecated SVG yerine PNG */
  window.EQUSTO_LOGO_SVG = "";

  var STYLE_PROPS = ["display", "visibility", "pointer-events", "width", "height", "overflow"];

  function clearInlineHide(el) {
    if (!el) return;
    STYLE_PROPS.forEach(function (p) {
      el.style.removeProperty(p);
    });
  }

  function wantsLightWordmark(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains("bd-hdr-wordmark")) return true;
    if (el.closest && el.closest("header.hdr")) return true;
    if (el.classList && el.classList.contains("auth-logo")) {
      return document.documentElement.getAttribute("data-theme") === "dark";
    }
    return false;
  }

  function logoSrcFor(el) {
    return wantsLightWordmark(el) ? LOGO_LIGHT : LOGO_DARK;
  }

  function imgHtml(src) {
    return (
      '<img src="' +
      src +
      '" alt="EQUSTO" class="eq-logo-img eq-logo-wordmark" width="454" height="82" decoding="async" fetchpriority="high">'
    );
  }

  window.EQUSTO_LOGO_IMG_HTML = imgHtml(LOGO_DARK);

  function isStaleImg(img, el) {
    if (!img) return true;
    var want = logoSrcFor(el);
    var src = img.getAttribute("src") || "";
    if (src !== want) return true;
    if (src.indexOf("20260520logo") >= 0) return true;
    if (img.getAttribute("width") === "284") return true;
    if (!img.getAttribute("alt")) return true;
    return false;
  }

  function inject(el) {
    if (!el) return;
    if (el.classList && el.classList.contains("logo--text")) return;
    var src = logoSrcFor(el);
    var img = el.querySelector(".eq-logo-img");
    if (!img || isStaleImg(img, el)) {
      el.innerHTML = imgHtml(src);
      el.removeAttribute("aria-hidden");
      img = el.querySelector(".eq-logo-img");
    } else if (img.getAttribute("src") !== src) {
      img.setAttribute("src", src);
    }
    if (img) img.style.removeProperty("filter");
    clearInlineHide(el);
  }

  function run() {
    document.querySelectorAll("a.logo, a.bd-hdr-wordmark, button.auth-logo").forEach(inject);
    if (!window.matchMedia("(max-width: 768px)").matches) {
      document.querySelectorAll("header.hdr a.logo").forEach(clearInlineHide);
    }
  }

  window.EQUSTO_LOGO_REFRESH = run;

  function schedule() {
    run();
    [0, 50, 200, 800].forEach(function (ms) {
      setTimeout(run, ms);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
  window.addEventListener("load", run);
  window.addEventListener("pageshow", run);
  window.addEventListener(
    "resize",
    function () {
      if (!window.matchMedia("(max-width: 768px)").matches) run();
    },
    { passive: true }
  );

  try {
    new MutationObserver(run).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
  } catch (_) {}
})();
