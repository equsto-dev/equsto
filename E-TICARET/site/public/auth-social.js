/**
 * Üye girişi — sekmeler, Google GSI, oturum paneli.
 */
;(function () {
  "use strict";

  window.__eqAuthMode = window.__eqAuthMode || "login";

  function setAuthMode(mode) {
    window.__eqAuthMode = mode;
    var isReg = mode === "register";
    var tabLogin = document.getElementById("auth-tab-login");
    var tabReg = document.getElementById("auth-tab-register");
    if (tabLogin) tabLogin.classList.toggle("auth-tab--active", !isReg);
    if (tabReg) tabReg.classList.toggle("auth-tab--active", isReg);
    var nameWrap = document.getElementById("auth-name-wrap");
    if (nameWrap) nameWrap.style.display = isReg ? "block" : "none";
    var phoneWrap = document.getElementById("auth-phone-wrap");
    if (phoneWrap) phoneWrap.style.display = isReg ? "block" : "none";
    var phoneEl = document.getElementById("auth-phone");
    if (phoneEl) phoneEl.required = isReg;
    var submit = document.getElementById("auth-submit-btn");
    if (submit) {
      submit.textContent = isReg ? "Hesap oluştur" : "E-posta ile giriş yap";
      submit.setAttribute(
        "data-i18n",
        isReg ? "login.submit_register" : "login.submit_login"
      );
    }
    var title = document.getElementById("auth-title");
    var sub = document.getElementById("auth-sub");
    if (title) title.textContent = isReg ? "Üye kaydı" : "Üye girişi";
    if (sub) {
      sub.textContent = isReg
        ? "E-posta ile ücretsiz hesap oluşturun. Cep telefonu PFOS teklif ve WhatsApp gönderimi için kullanılır. Şifre en az 8 karakter olmalıdır."
        : "E-posta ve şifrenizle giriş yapın veya Google ile devam edin.";
    }
    var pass = document.getElementById("auth-password");
    if (pass) pass.autocomplete = isReg ? "new-password" : "current-password";
    try {
      if (typeof window.eqI18nApply === "function") {
        var card = document.querySelector(".auth-card");
        if (card) window.eqI18nApply(card);
      }
    } catch (_) {}
  }

  function showLoggedIn() {
    if (typeof window.equstoIsMemberLoggedIn !== "function" || !window.equstoIsMemberLoggedIn()) {
      return;
    }
    var next = new URLSearchParams(location.search).get("next");
    if (next) {
      setTimeout(function () {
        location.href = next;
      }, 300);
      return;
    }
    var m = typeof window.equstoGetMember === "function" ? window.equstoGetMember() : null;
    var forms = document.getElementById("auth-forms-wrap");
    if (forms) forms.style.display = "none";
    var div = document.querySelector(".auth-divider");
    if (div) div.style.display = "none";
    var panel = document.getElementById("auth-logged-panel");
    if (panel) panel.style.display = "block";
    var nameEl = document.getElementById("auth-logged-name");
    if (nameEl) {
      nameEl.textContent =
        "Hoş geldiniz, " + (m && (m.displayName || m.name || m.email) || "üye");
    }
  }

  function loadGoogleScript() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }
      var existing = document.getElementById("gsi-client");
      if (existing) {
        existing.addEventListener("load", function () {
          resolve();
        });
        existing.addEventListener("error", reject);
        return;
      }
      var s = document.createElement("script");
      s.id = "gsi-client";
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.defer = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function renderGoogleButton(clientId) {
    var slot = document.getElementById("google-btn-slot");
    if (!slot || !clientId || !window.google || !window.google.accounts) return;
    slot.innerHTML = "";
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: function (res) {
          if (!res || !res.credential) return;
          if (typeof window.equstoAuthGoogleCredential === "function") {
            window.equstoAuthGoogleCredential(res.credential);
          }
        },
        auto_select: false,
      });
      window.google.accounts.id.renderButton(slot, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: Math.min(360, slot.offsetWidth || 320),
        text: "continue_with",
        locale: document.documentElement.lang === "en" ? "en" : "tr",
      });
    } catch (e) {
      console.warn("[auth-social] Google button", e);
    }
  }

  function googleClientIdOrFetch(cb) {
    var id = (window.EQUSTO_AUTH && window.EQUSTO_AUTH.googleClientId) || "";
    if (id) {
      cb(id);
      return;
    }
    if (typeof window.equstoAuthFetchConfig !== "function") {
      cb("");
      return;
    }
    window.equstoAuthFetchConfig().then(function () {
      cb((window.EQUSTO_AUTH && window.EQUSTO_AUTH.googleClientId) || "");
    });
  }

  window.equstoGoogleSignIn = function () {
    googleClientIdOrFetch(function (clientId) {
      if (!clientId) {
        var el = document.getElementById("auth-social-msg");
        if (el) {
          el.textContent =
            "Google girişi yapılandırılmamış (GOOGLE_CLIENT_ID). Vercel ortam değişkenini kontrol edin.";
          el.className = "auth-msg";
          el.style.display = "block";
        }
        return;
      }
      equstoGoogleSignInWithClient(clientId);
    });
  };

  function equstoGoogleSignInWithClient(clientId) {
    loadGoogleScript()
      .then(function () {
        if (!window.google || !window.google.accounts) throw new Error("gsi");
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: function (res) {
            if (res && res.credential && window.equstoAuthGoogleCredential) {
              window.equstoAuthGoogleCredential(res.credential);
            }
          },
        });
        window.google.accounts.id.prompt();
      })
      .catch(function () {
        var el = document.getElementById("auth-social-msg");
        if (el) {
          el.textContent = "Google oturum penceresi açılamadı.";
          el.className = "auth-msg";
          el.style.display = "block";
        }
      });
  }

  window.equstoInitSocialAuth = function () {
    googleClientIdOrFetch(function (clientId) {
      if (!clientId) return;
      loadGoogleScript()
        .then(function () {
          renderGoogleButton(clientId);
        })
        .catch(function () {});
    });
  };

  function bindTabs() {
    var tabLogin = document.getElementById("auth-tab-login");
    var tabReg = document.getElementById("auth-tab-register");
    if (tabLogin) tabLogin.addEventListener("click", function () {
      setAuthMode("login");
    });
    if (tabReg) tabReg.addEventListener("click", function () {
      setAuthMode("register");
    });
  }

  function bindLogout() {
    var btn = document.getElementById("auth-logout-btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var p =
        typeof window.equstoAuthLogout === "function"
          ? window.equstoAuthLogout()
          : Promise.resolve();
      p.finally(function () {
        try {
          if (typeof window.equstoClearMemberSession === "function") {
            window.equstoClearMemberSession();
          }
        } catch (_) {}
        if (typeof window.equstoUrl === "function") {
          location.href = window.equstoUrl("home");
        } else {
          location.href = "/";
        }
      });
    });
  }

  function bootAuthPage() {
    bindTabs();
    bindLogout();
    var modeParam = new URLSearchParams(location.search).get("mode");
    if (modeParam === "register") {
      setAuthMode("register");
    } else {
      setAuthMode(window.__eqAuthMode || "login");
    }
    if (typeof window.equstoInitSocialAuth === "function") {
      window.equstoInitSocialAuth();
    }
    showLoggedIn();
    try {
      if (typeof window.eqI18nApply === "function") {
        var card = document.querySelector(".auth-card");
        if (card) window.eqI18nApply(card);
      }
    } catch (_) {}
  }

  function bootAfterApi() {
    var ready = window.__eqAuthApiReady || Promise.resolve();
    ready.then(function () {
      var chain = Promise.resolve();
      if (typeof window.equstoAuthBootstrap === "function") {
        chain = window.equstoAuthBootstrap();
      }
      chain
        .then(function (j) {
          var el = document.getElementById("auth-social-msg");
          if (j && j.success && el) {
            el.innerHTML = "";
            el.style.display = "none";
          }
        })
        .finally(bootAuthPage);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAfterApi);
  } else {
    bootAfterApi();
  }
})();
