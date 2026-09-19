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
    var forgotWrap = document.getElementById("auth-forgot-link-wrap");
    if (forgotWrap) forgotWrap.style.display = isReg ? "none" : "block";
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

  function setSocialMsg(html, isInfo) {
    var el = document.getElementById("auth-social-msg");
    if (!el) return;
    el.innerHTML = html || "";
    el.className = "auth-msg" + (isInfo ? " auth-msg--info" : "");
    el.style.display = html ? "block" : "none";
  }

  function prefetchGoogleAuth() {
    if (typeof window.equstoAuthFetchConfig === "function") {
      window.equstoAuthFetchConfig().catch(function () {});
    }
  }

  window.equstoGoogleSignIn = function () {
    var href =
      typeof window.equstoGoogleStartHref === "function"
        ? window.equstoGoogleStartHref()
        : "/api/auth/google/start";
    setSocialMsg("Google ile yönlendiriliyorsunuz…", true);
    location.href = href;
  };

  window.equstoInitSocialAuth = function () {
    var slot = document.getElementById("google-btn-slot");
    if (slot) slot.innerHTML = "";
    var fallback = document.getElementById("auth-google-fallback");
    if (fallback) fallback.style.display = "flex";
  };

  function handleGoogleReturn() {
    var q = new URLSearchParams(location.search);
    var err = q.get("google_error");
    if (err) {
      setSocialMsg(
        err + " E-posta ile giriş yapmayı deneyebilirsiniz.",
        false,
      );
      return;
    }
    if (q.get("google") !== "ok") return;
    setSocialMsg("Google ile giriş yapılıyor…", true);
    var p =
      typeof window.equstoAuthValidateSession === "function"
        ? window.equstoAuthValidateSession()
        : Promise.resolve(false);
    p.then(function (ok) {
      if (ok) {
        showLoggedIn();
        return;
      }
      setSocialMsg(
        "Google girişi tamamlandı ama oturum okunamadı. Sayfayı yenileyin veya e-posta ile devam edin.",
        false,
      );
    });
  }

  function bindForgotPassword() {
    var showBtn = document.getElementById("auth-show-forgot");
    var backBtn = document.getElementById("auth-forgot-back");
    var sendBtn = document.getElementById("auth-forgot-send-btn");
    var saveBtn = document.getElementById("auth-forgot-save-btn");
    var formsWrap = document.getElementById("auth-forms-wrap");
    var forgotPanel = document.getElementById("auth-forgot-panel");
    var stepReq = document.getElementById("auth-forgot-step-request");
    var stepReset = document.getElementById("auth-forgot-step-reset");
    var loginEmail = document.getElementById("auth-email");
    var forgotEmail = document.getElementById("auth-forgot-email");

    function setMsg(html, isInfo) {
      var el = document.getElementById("auth-social-msg");
      if (!el) return;
      el.innerHTML = html || "";
      el.className = "auth-msg" + (isInfo ? " auth-msg--info" : "");
      el.style.display = html ? "block" : "none";
    }

    function openForgot() {
      document.body.classList.add("auth-forgot-open");
      if (formsWrap) formsWrap.style.display = "none";
      if (forgotPanel) forgotPanel.style.display = "block";
      if (stepReq) stepReq.style.display = "block";
      if (stepReset) stepReset.style.display = "none";
      if (forgotEmail && loginEmail && loginEmail.value.trim()) {
        forgotEmail.value = loginEmail.value.trim();
      }
      var title = document.getElementById("auth-title");
      var sub = document.getElementById("auth-sub");
      if (title) title.textContent = "Şifre sıfırlama";
      if (sub) sub.textContent = "E-posta adresinize kurtarma kodu gönderin.";
      setMsg("");
      if (forgotEmail) forgotEmail.focus();
    }

    function closeForgot() {
      document.body.classList.remove("auth-forgot-open");
      if (forgotPanel) forgotPanel.style.display = "none";
      if (formsWrap) formsWrap.style.display = "block";
      setAuthMode(window.__eqAuthMode || "login");
      setMsg("");
    }

    if (showBtn) showBtn.addEventListener("click", openForgot);
    if (backBtn) backBtn.addEventListener("click", closeForgot);

    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        var email = forgotEmail ? forgotEmail.value.trim() : "";
        if (!email) {
          setMsg("E-posta adresinizi girin.", false);
          return;
        }
        sendBtn.disabled = true;
        sendBtn.textContent = "Gönderiliyor…";
        var p =
          typeof window.equstoAuthForgotPassword === "function"
            ? window.equstoAuthForgotPassword(email)
            : Promise.resolve({ success: false, error: "Auth istemcisi yüklenemedi" });
        p.then(function (j) {
          if (j && j.success) {
            setMsg(j.message || "Kurtarma kodu gönderildi.", true);
            if (stepReq) stepReq.style.display = "none";
            if (stepReset) stepReset.style.display = "block";
            var codeEl = document.getElementById("auth-forgot-code");
            if (codeEl) codeEl.focus();
          } else {
            setMsg((j && j.error) || "Kod gönderilemedi", false);
          }
        }).finally(function () {
          sendBtn.disabled = false;
          sendBtn.textContent = "Kurtarma kodu gönder";
        });
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var email = forgotEmail ? forgotEmail.value.trim() : "";
        var code = document.getElementById("auth-forgot-code");
        var pw = document.getElementById("auth-forgot-password");
        var pw2 = document.getElementById("auth-forgot-password2");
        var codeVal = code ? code.value.trim() : "";
        var pwVal = pw ? pw.value : "";
        var pw2Val = pw2 ? pw2.value : "";
        if (!email || !codeVal) {
          setMsg("E-posta ve kurtarma kodu gerekli.", false);
          return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = "Kaydediliyor…";
        var p =
          typeof window.equstoAuthResetPassword === "function"
            ? window.equstoAuthResetPassword(email, codeVal, pwVal, pw2Val)
            : Promise.resolve({ success: false, error: "Auth istemcisi yüklenemedi" });
        p.then(function (j) {
          if (j && j.success) {
            setMsg(j.message || "Şifreniz güncellendi. Giriş yapabilirsiniz.", true);
            if (loginEmail) loginEmail.value = email;
            closeForgot();
          } else {
            setMsg((j && j.error) || "Şifre güncellenemedi", false);
          }
        }).finally(function () {
          saveBtn.disabled = false;
          saveBtn.textContent = "Şifreyi kaydet";
        });
      });
    }
  }

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
    bindForgotPassword();
    var modeParam = new URLSearchParams(location.search).get("mode");
    if (modeParam === "register") {
      setAuthMode("register");
    } else {
      setAuthMode(window.__eqAuthMode || "login");
    }
    if (typeof window.equstoInitSocialAuth === "function") {
      window.equstoInitSocialAuth();
    }
    handleGoogleReturn();
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
