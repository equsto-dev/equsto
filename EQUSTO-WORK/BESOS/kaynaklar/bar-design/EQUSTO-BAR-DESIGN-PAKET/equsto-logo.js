/* EQUSTO wordmark — /images/equsto-logo.png (tüm a.logo, .bd-hdr-wordmark, auth-logo). */

(function () {
  var LOGO_V = "20260520logo";
  var LOGO_SRC = "/images/equsto-logo.png?v=" + LOGO_V;
  var IMG_HTML =
    '<img src="' +
    LOGO_SRC +
    '" alt="" class="eq-logo-img eq-logo-wordmark" width="284" height="52" decoding="async" fetchpriority="high">';

  window.EQUSTO_LOGO_SRC = LOGO_SRC;
  window.EQUSTO_LOGO_IMG_HTML = IMG_HTML;
  /** @deprecated SVG yerine PNG; geriye dönük uyumluluk */
  window.EQUSTO_LOGO_SVG = "";

  var STYLE_PROPS = ["display", "visibility", "pointer-events", "width", "height", "overflow"];

  function clearInlineHide(el) {
    if (!el) return;
    STYLE_PROPS.forEach(function (p) {
      el.style.removeProperty(p);
    });
  }

  function needsInject(el) {
    if (!el) return false;
    if (el.classList && el.classList.contains("logo--text")) return false;
    var img = el.querySelector(".eq-logo-img");
    if (!img) return true;
    var src = img.getAttribute("src") || "";
    return src.indexOf("equsto-logo.png") < 0;
  }

  function inject(el) {
    if (!el) return;
    if (el.classList && el.classList.contains("logo--text")) return;
    if (needsInject(el)) {
      el.innerHTML = IMG_HTML;
      el.removeAttribute("aria-hidden");
    } else {
      var img = el.querySelector(".eq-logo-img");
      if (img && img.getAttribute("src") !== LOGO_SRC) img.setAttribute("src", LOGO_SRC);
    }
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
})();
