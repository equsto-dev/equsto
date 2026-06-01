/**
 * Üye oturumu (tarayıcı) — contact.js, login ve header ile paylaşılır.
 */
(function () {
  "use strict";

  var MEMBER_KEY = "equsto_member_v1";

  function __memberT(k, fb) {
    try {
      if (typeof window.eqT === "function") {
        var v = window.eqT(k, null);
        if (v != null && v !== k) return v;
      }
    } catch (_) {}
    return fb != null ? fb : k;
  }

  function readMember() {
    try {
      var j = localStorage.getItem(MEMBER_KEY);
      if (!j) return null;
      return JSON.parse(j);
    } catch (e) {
      return null;
    }
  }

  function equstoIsMemberLoggedIn() {
    var o = readMember();
    /* Header / teslimat bandı ile aynı: active oturum yeterli (token API için ayrı) */
    if (!o || o.active !== true) return false;
    if (o.expiresAt && Number(o.expiresAt) < Date.now()) return false;
    return true;
  }

  window.equstoGetMember = function () {
    return readMember();
  };

  window.equstoGetMemberProfile = function () {
    return readMember();
  };

  window.equstoGetMemberToken = function () {
    var o = readMember();
    return o && o.token ? String(o.token) : "";
  };

  window.equstoSetMemberActive = function (extra) {
    try {
      var prev = readMember() || {};
      var o = Object.assign({}, prev, extra && typeof extra === "object" ? extra : {}, {
        active: true,
        at: Date.now(),
      });
      if (!o.displayName && o.name) o.displayName = o.name;
      if (!o.displayName && o.email) o.displayName = String(o.email).split("@")[0];
      localStorage.setItem(MEMBER_KEY, JSON.stringify(o));
      window.equstoRefreshMemberHeader();
      try {
        document.dispatchEvent(new CustomEvent("equsto-member-session"));
      } catch (e2) {}
    } catch (e) {}
  };

  window.equstoClearMemberSession = function () {
    try {
      localStorage.removeItem(MEMBER_KEY);
      window.equstoRefreshMemberHeader();
      try {
        window.dispatchEvent(new CustomEvent("equsto-member-changed", { detail: { active: false } }));
      } catch (e2) {}
    } catch (e) {}
  };

  window.equstoIsMemberLoggedIn = equstoIsMemberLoggedIn;

  function memberFirstName(o) {
    if (!o) return __memberT("member.guest", "Üye");
    var raw = String(o.displayName || o.name || "").trim();
    if (raw) return raw.split(/\s+/)[0];
    if (o.email) return String(o.email).split("@")[0];
    return __memberT("member.guest", "Üye");
  }

  /** Üst bant: girişte «Alıcı Adem», misafirde «Teslimat Adresi» */
  function equstoRefreshDeliveryHeader() {
    var o = readMember();
    var logged = !!(o && o.active);
    var name = memberFirstName(o);
    document.querySelectorAll(".hdr-alici").forEach(function (wrap) {
      var label =
        wrap.querySelector(".st-label") ||
        wrap.querySelector("[data-i18n='common.delivery_to']") ||
        wrap.children[0];
      if (!label || label.nodeType !== 1) return;
      if (logged) {
        label.textContent = __memberT("member.buyer_prefix", "Alıcı ") + name;
        label.setAttribute("data-i18n-skip", "");
        label.removeAttribute("data-i18n");
      } else {
        label.removeAttribute("data-i18n-skip");
        if (!label.getAttribute("data-i18n")) {
          label.setAttribute("data-i18n", "common.delivery_to");
        }
        if (typeof window.eqI18nApply === "function") {
          window.eqI18nApply(label);
        } else {
          label.textContent = "Teslimat Adresi";
        }
      }
    });
  }
  window.equstoRefreshDeliveryHeader = equstoRefreshDeliveryHeader;

  window.equstoRefreshMemberHeader = function () {
    equstoRefreshDeliveryHeader();
    var links = document.querySelectorAll("a.eq-hdr-account");
    if (!links.length) return;
    var o = readMember();
    var logged = !!(o && o.active);
    links.forEach(function (a) {
      var title = a.querySelector(".eq-hdr-account-title");
      var sub = a.querySelector("span:first-of-type");
      if (logged) {
        var label = o.displayName || o.name || o.email || __memberT("member.my_account", "Hesabım");
        if (title) title.textContent = label + " ▾";
        if (sub) sub.textContent = __memberT("member.my_account", "Hesabım");
        a.setAttribute("title", o.email || __memberT("member.my_account", "Hesabım"));
        a.href =
          typeof window.equstoUrl === "function"
            ? window.equstoUrl("login")
            : typeof window.equstoResolveNavHref === "function"
              ? window.equstoResolveNavHref("login.html")
              : "/login.html";
      } else {
        if (title) title.textContent = __memberT("common.account_projects", "Projeler ve Listeler ▾");
        if (sub) sub.textContent = __memberT("member.my_account", "Hesabım");
        a.setAttribute("title", __memberT("member.login_title", "Üye girişi"));
        a.href =
          typeof window.equstoUrl === "function"
            ? window.equstoUrl("login")
            : typeof window.equstoResolveNavHref === "function"
              ? window.equstoResolveNavHref("login.html")
              : "/login.html";
      }
    });
  };

  function bootMemberUi() {
    window.equstoRefreshMemberHeader();
    if (typeof window.equstoAuthValidateSession === "function") {
      window.equstoAuthValidateSession().finally(function () {
        equstoRefreshDeliveryHeader();
      });
    }
    if (window.eqI18nReady && typeof window.eqI18nReady.then === "function") {
      window.eqI18nReady.then(function () {
        equstoRefreshDeliveryHeader();
        equstoRefreshMemberHeader();
      });
    }
    window.addEventListener("equsto:i18n-ready", function () {
      equstoRefreshDeliveryHeader();
      equstoRefreshMemberHeader();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMemberUi);
  } else {
    bootMemberUi();
  }
})();
