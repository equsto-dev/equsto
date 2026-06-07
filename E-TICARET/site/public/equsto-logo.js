/* EQUSTO wordmark — PNG: koyu bantta beyaz, açık zeminde siyah (filter yok; şeffaf PNG + invert kutusu yapar). */

(function () {
  var LOGO_V = "20260519wordmark3";
  var LOGO_PATH_DARK = "/images/equsto-logo.png";
  var LOGO_PATH_LIGHT = "/images/equsto-logo-white.png";

  window.EQUSTO_LOGO_V = LOGO_V;
  /** @deprecated SVG yerine PNG */
  window.EQUSTO_LOGO_SVG = "";

  var STYLE_PROPS = ["display", "visibility", "pointer-events", "width", "height", "overflow"];

  function encodeRel(rel) {
    return String(rel || "")
      .split("/")
      .map(function (seg) {
        return seg ? encodeURIComponent(seg) : "";
      })
      .join("/");
  }

  function resolveLogoHref(publicPath) {
    var rel = String(publicPath || "")
      .replace(/^\//, "")
      .split("?")[0];
    var q = "?v=" + LOGO_V;
    try {
      if (typeof window.equstoCdnAssetHref === "function") {
        var via = window.equstoCdnAssetHref(rel);
        if (via) return via + q;
      }
      var base = String(window.__EQUSTO_ASSET_CDN || "")
        .trim()
        .replace(/\/$/, "");
      if (base) return base + "/" + encodeRel(rel) + q;
    } catch (_) {}
    return publicPath + q;
  }

  function publishLogoGlobals() {
    window.EQUSTO_LOGO_SRC = resolveLogoHref(LOGO_PATH_DARK);
    window.EQUSTO_LOGO_SRC_LIGHT = resolveLogoHref(LOGO_PATH_LIGHT);
    window.EQUSTO_LOGO_IMG_HTML =
      '<img src="' +
      window.EQUSTO_LOGO_SRC +
      '" alt="EQUSTO" class="eq-logo-img eq-logo-wordmark" width="409" height="74" decoding="async" fetchpriority="high">';
  }

  publishLogoGlobals();

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
    return resolveLogoHref(wantsLightWordmark(el) ? LOGO_PATH_LIGHT : LOGO_PATH_DARK);
  }

  function imgHtml(src) {
    return (
      '<img src="' +
      src +
      '" alt="EQUSTO" class="eq-logo-img eq-logo-wordmark" width="409" height="74" decoding="async" fetchpriority="high">'
    );
  }

  function logoBase(src) {
    return String(src || "").split("?")[0].replace(/^https?:\/\/[^/]+/i, "");
  }

  function isStaleImg(img, el) {
    if (!img) return true;
    var want = logoSrcFor(el);
    var src = img.getAttribute("src") || "";
    if (src === want) return false;
    if (logoBase(src) !== logoBase(want)) return true;
    if (src.indexOf("20260520logo") >= 0) return true;
    if (img.getAttribute("width") === "284") return true;
    if (!img.getAttribute("alt")) return true;
    /* Faz B: yerel /images/ kaldı, CDN hazır */
    if (/^(\/)?images\/equsto-logo/i.test(logoBase(src)) && /^https:\/\//i.test(want)) return true;
    return true;
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
    publishLogoGlobals();
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

  try {
    var chromeRoot = document.getElementById("eq-shop-chrome-root");
    if (chromeRoot) {
      new MutationObserver(schedule).observe(chromeRoot, { childList: true, subtree: true });
    }
  } catch (_) {}
})();
