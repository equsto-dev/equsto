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
    var pass2Wrap = document.getElementById("auth-password2-wrap");
    if (pass2Wrap) pass2Wrap.style.display = isReg ? "block" : "none";
    var pass2El = document.getElementById("auth-password2");
    if (pass2El) {
      pass2El.required = isReg;
      if (!isReg) pass2El.value = "";
    }
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
    if (pass && isReg) pass.placeholder = "En az 8 karakter";
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
        if (window.google && window.google.accounts) {
          resolve();
          return;
        }
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
      s.onload = function () {
        resolve();
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function prefetchGoogleAuth() {
    try {
      if (!document.querySelector('link[rel="preconnect"][href="https://accounts.google.com"]')) {
        var pc = document.createElement("link");
        pc.rel = "preconnect";
        pc.href = "https://accounts.google.com";
        document.head.appendChild(pc);
      }
    } catch (_) {}
    loadGoogleScript().catch(function () {});
    if (typeof window.equstoAuthFetchConfig === "function") {
      window.equstoAuthFetchConfig().catch(function () {});
    }
  }

  function googleBtnPixelWidth() {
    var slot = document.getElementById("google-btn-slot");
    var safety = 28;
    var fallback = 264;
    var w = 0;
    if (slot) {
      w = slot.getBoundingClientRect().width || slot.clientWidth;
    }
    if (!(w > 0)) {
      var card = document.querySelector(".auth-card");
      if (card) {
        var styles = window.getComputedStyle(card);
        var padL = parseFloat(styles.paddingLeft) || 22;
        var padR = parseFloat(styles.paddingRight) || 22;
        w = card.clientWidth - padL - padR;
      }
    }
    if (w > 0) {
      return Math.max(200, Math.min(270, Math.floor(w - safety)));
    }
    return fallback;
  }

  var googleBtnResizeTimer = null;
  var googleBtnClientId = "";

  function scheduleGoogleButtonResize(clientId) {
    if (!clientId) return;
    googleBtnClientId = clientId;
    if (window.__eqGoogleBtnResizeBound) return;
    window.__eqGoogleBtnResizeBound = true;
    window.addEventListener("resize", function () {
      if (!googleBtnClientId) return;
      clearTimeout(googleBtnResizeTimer);
      googleBtnResizeTimer = setTimeout(function () {
        renderGoogleButton(googleBtnClientId);
      }, 120);
    });
  }

  function renderGoogleButton(clientId) {
    var slot = document.getElementById("google-btn-slot");
    if (!slot || !clientId || !window.google || !window.google.accounts) return;
    scheduleGoogleButtonResize(clientId);

    function paint() {
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
          width: googleBtnPixelWidth(),
          text: "continue_with",
          locale: document.documentElement.lang === "en" ? "en" : "tr",
        });
      } catch (e) {
        console.warn("[auth-social] Google button", e);
      }
    }

    requestAnimationFrame(paint);
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
    prefetchGoogleAuth();
    bootAuthPage();
    if (typeof window.equstoAuthFetchConfig === "function") {
      window.equstoAuthFetchConfig()
        .then(function () {
          if (typeof window.equstoInitSocialAuth === "function") {
            window.equstoInitSocialAuth();
          }
        })
        .catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAfterApi);
  } else {
    bootAfterApi();
  }
})();
