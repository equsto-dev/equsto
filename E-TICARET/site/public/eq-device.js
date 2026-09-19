/**
 * Equsto cihaz sınıfı — telefon iskelesi viewport daraltmasından bağımsız.
 * html.eq-device-phone | eq-device-tablet | eq-device-desktop
 */
(function () {
  "use strict";

  var KEY = "eq-device-force";

  function qs(name) {
    try {
      return new URLSearchParams(location.search).get(name);
    } catch (e) {
      return null;
    }
  }

  function uaPhone() {
    var ua = navigator.userAgent || "";
    if (/iPhone|iPod|Windows Phone|webOS|BlackBerry/i.test(ua)) return true;
    if (/Android/i.test(ua) && /Mobile/i.test(ua)) return true;
    return false;
  }

  function uaTablet() {
    var ua = navigator.userAgent || "";
    if (/iPad/i.test(ua)) return true;
    if (/Android/i.test(ua) && !/Mobile/i.test(ua)) return true;
    if (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;
    return false;
  }

  function chMobile() {
    try {
      var ch = navigator.userAgentData;
      if (ch && ch.mobile === true) return true;
    } catch (e) {}
    return false;
  }

  function coarse() {
    try {
      return window.matchMedia("(pointer: coarse)").matches;
    } catch (e) {
      return false;
    }
  }

  function persist(kind) {
    try {
      sessionStorage.setItem(KEY, kind);
    } catch (e) {}
  }

  function resolve() {
    var force = qs("mobile") || qs("eq-device");
    if (force === "1" || force === "phone") {
      persist("phone");
      return "phone";
    }
    if (force === "0" || force === "desktop") {
      persist("desktop");
      return "desktop";
    }
    if (force === "tablet") {
      persist("tablet");
      return "tablet";
    }
    try {
      var stored = sessionStorage.getItem(KEY);
      if (stored === "phone" || stored === "tablet" || stored === "desktop") return stored;
    } catch (e2) {}
    if (chMobile() || uaPhone()) return "phone";
    if (uaTablet()) return "tablet";
    if (coarse() && window.innerWidth <= 900) return "phone";
    if (coarse()) return "tablet";
    return "desktop";
  }

  function apply(kind) {
    var root = document.documentElement;
    root.classList.remove("eq-device-phone", "eq-device-tablet", "eq-device-desktop");
    root.classList.add("eq-device-" + kind);
    root.setAttribute("data-eq-device", kind);
    try {
      window.__eqDevice = kind;
    } catch (e) {}
  }

  window.eqDeviceKind = function () {
    var d = document.documentElement.getAttribute("data-eq-device");
    return d || resolve();
  };

  window.eqIsPhoneShell = function () {
    return window.eqDeviceKind() === "phone";
  };

  apply(resolve());
})();
