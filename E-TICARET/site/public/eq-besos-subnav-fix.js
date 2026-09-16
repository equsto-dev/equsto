/**
 * Bar Design mobil: 4 kategori ikonu tek satırda (2×2 wrap / topnav-stil bozulmasını düzeltir).
 * CSS cache’inden bağımsız — inline style uygular.
 */
(function () {
  function clearInline(el) {
    if (el) el.removeAttribute("style");
  }

  function apply() {
    if (!document.body || !document.body.classList.contains("besos")) return;
    var nav = document.querySelector(".bd-besos-subnav");
    var inner = document.querySelector(".bd-besos-subnav-inner");
    if (!nav || !inner) return;

    var mobile = window.matchMedia("(max-width: 768px)").matches;
    if (!mobile) {
      clearInline(nav);
      clearInline(inner);
      var desktopLinks = inner.querySelectorAll("a, .bd-besos-subnav-link");
      for (var d = 0; d < desktopLinks.length; d++) {
        clearInline(desktopLinks[d]);
        var dIco = desktopLinks[d].querySelector(".bd-besos-subnav-ico");
        var dImg = desktopLinks[d].querySelector(".bd-besos-subnav-ico img");
        var dLab = desktopLinks[d].querySelector(".bd-besos-subnav-label");
        clearInline(dIco);
        clearInline(dImg);
        clearInline(dLab);
      }
      return;
    }

    nav.style.setProperty("display", "block", "important");
    nav.style.setProperty("background", "#222", "important");
    nav.style.setProperty("border-bottom", "2px solid #c9a227", "important");
    nav.style.setProperty("overflow", "hidden", "important");
    nav.style.setProperty("width", "100%", "important");

    inner.style.setProperty("display", "grid", "important");
    inner.style.setProperty("grid-template-columns", "repeat(4, minmax(0, 1fr))", "important");
    inner.style.setProperty("grid-template-rows", "1fr", "important");
    inner.style.setProperty("grid-auto-flow", "column", "important");
    inner.style.setProperty("grid-auto-rows", "0", "important");
    inner.style.setProperty("width", "100%", "important");
    inner.style.setProperty("max-width", "none", "important");
    inner.style.setProperty("margin", "0", "important");
    inner.style.setProperty("padding", "6px 2px 8px", "important");
    inner.style.setProperty("gap", "0", "important");
    inner.style.setProperty("flex-wrap", "nowrap", "important");
    inner.style.setProperty("overflow", "hidden", "important");

    var links = inner.querySelectorAll("a, .bd-besos-subnav-link");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.style.setProperty("display", "flex", "important");
      a.style.setProperty("flex-direction", "column", "important");
      a.style.setProperty("align-items", "center", "important");
      a.style.setProperty("justify-content", "center", "important");
      a.style.setProperty("width", "100%", "important");
      a.style.setProperty("min-width", "0", "important");
      a.style.setProperty("max-width", "100%", "important");
      a.style.setProperty("padding", "4px 2px", "important");
      a.style.setProperty("gap", "4px", "important");
      a.style.setProperty("color", "rgba(255,255,255,0.75)", "important");
      a.style.setProperty("background", "transparent", "important");
      a.style.setProperty("border-right", "none", "important");
      a.style.setProperty("white-space", "normal", "important");
      a.style.setProperty("font-size", "9px", "important");
      a.style.setProperty("text-align", "center", "important");
      a.style.setProperty("overflow", "hidden", "important");
      a.style.setProperty("box-sizing", "border-box", "important");
      a.style.setProperty("box-shadow", "none", "important");
      if (a.classList.contains("is-active")) {
        a.style.setProperty("color", "#fff", "important");
        a.style.setProperty("box-shadow", "inset 0 -2px 0 0 #c9a227", "important");
      }
      var ico = a.querySelector(".bd-besos-subnav-ico");
      if (ico) {
        ico.style.setProperty("display", "flex", "important");
        ico.style.setProperty("height", "28px", "important");
        ico.style.setProperty("width", "100%", "important");
        ico.style.setProperty("min-width", "0", "important");
        ico.style.setProperty("align-items", "center", "important");
        ico.style.setProperty("justify-content", "center", "important");
      }
      var img = a.querySelector(".bd-besos-subnav-ico img");
      if (img) {
        img.style.setProperty("display", "block", "important");
        img.style.setProperty("height", "28px", "important");
        img.style.setProperty("max-width", "40px", "important");
        img.style.setProperty("width", "auto", "important");
        img.style.setProperty("margin", "0 auto", "important");
      }
      var label = a.querySelector(".bd-besos-subnav-label");
      if (label) {
        label.style.setProperty("display", "block", "important");
        label.style.setProperty("font-size", "9px", "important");
        label.style.setProperty("line-height", "1.15", "important");
        label.style.setProperty("min-width", "0", "important");
        label.style.setProperty("max-width", "100%", "important");
        label.style.setProperty("overflow", "hidden", "important");
      }
    }
  }

  function boot() {
    apply();
    setTimeout(apply, 50);
    setTimeout(apply, 250);
    setTimeout(apply, 800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  window.addEventListener("resize", apply, { passive: true });
  document.addEventListener("equsto:i18n-ready", apply);
})();
