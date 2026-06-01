/**
 * Admin şifre kapısı — kapalı (panel doğrudan açılır).
 * API yazma işlemleri hâlâ EQUSTO_ADMIN_BEARER ile korunur (admin-config.js).
 */
(function () {
  const SESSION_OK = 'equsto_admin_ok';
  const TOKEN_KEY = 'equsto_admin_bearer';
  const REMEMBER_KEY = 'equsto_admin_remember';
  const REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;
  let cachedPwHash = null;

  function isLocalDev() {
    var h = (location.hostname || '').toLowerCase();
    return (
      location.protocol === 'file:' ||
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === '[::1]'
    );
  }

  function gateRequired() {
    return false;
  }

  function apiBase() {
    if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\/$/, '');
    if (isLocalDev()) return 'http://127.0.0.1:3001/api';
    return '/api';
  }

  async function sha256Hex(text) {
    var enc = new TextEncoder().encode(String(text));
    var buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf))
      .map(function (b) {
        return b.toString(16).padStart(2, '0');
      })
      .join('');
  }

  async function fetchRemotePwHash() {
    try {
      var r = await fetch('data/admin-auth.json?' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return null;
      var j = await r.json();
      return j && j.pw_sha256 ? String(j.pw_sha256) : null;
    } catch (_e) {
      return null;
    }
  }

  async function getActivePwHash() {
    if (cachedPwHash) return cachedPwHash;
    var remote = await fetchRemotePwHash();
    if (remote) {
      cachedPwHash = remote;
      return cachedPwHash;
    }
    if (window.EQUSTO_ADMIN_PW_SHA256) {
      cachedPwHash = window.EQUSTO_ADMIN_PW_SHA256;
    }
    return cachedPwHash;
  }

  function applyBearer(tok) {
    if (tok) {
      window.EQUSTO_ADMIN_BEARER = tok;
      sessionStorage.setItem(TOKEN_KEY, tok);
    }
    sessionStorage.setItem(SESSION_OK, '1');
  }

  function syncYonetimBearer() {
    try {
      var pro = (localStorage.getItem('equsto_pro_admin_token') || '').trim();
      if (pro) applyBearer(pro);
    } catch (_e) {}
  }

  function clearRemember() {
    try {
      localStorage.removeItem(REMEMBER_KEY);
    } catch (_e) {}
  }

  function saveRemember(tok) {
    try {
      localStorage.setItem(
        REMEMBER_KEY,
        JSON.stringify({ until: Date.now() + REMEMBER_MS, token: tok || '' })
      );
    } catch (_e) {}
  }

  function restoreRemember() {
    try {
      var raw = localStorage.getItem(REMEMBER_KEY);
      if (!raw) return false;
      var o = JSON.parse(raw);
      if (!o || !o.until || Date.now() > Number(o.until)) {
        clearRemember();
        return false;
      }
      applyBearer(o.token || '');
      return true;
    } catch (_e) {
      clearRemember();
      return false;
    }
  }

  function isAuthed() {
    return sessionStorage.getItem(SESSION_OK) === '1';
  }

  function showOverlay(show) {
    var ov = document.getElementById('login-overlay');
    if (!ov) return;
    if (show) {
      ov.classList.remove('hidden');
      document.body.classList.add('admin-locked');
    } else {
      ov.classList.add('hidden');
      document.body.classList.remove('admin-locked');
    }
  }

  function showLoginPanel() {
    document.getElementById('admin-login-panel-login')?.classList.remove('hidden');
    document.getElementById('admin-login-panel-forgot')?.classList.add('hidden');
    document.getElementById('admin-login-pw')?.focus();
  }

  function showForgotPanel() {
    document.getElementById('admin-login-panel-login')?.classList.add('hidden');
    document.getElementById('admin-login-panel-forgot')?.classList.remove('hidden');
    document.getElementById('admin-forgot-code')?.focus();
  }

  async function tryLogin(password) {
    var pw = String(password || '').trim();
    if (!pw) return false;

    try {
      var r = await fetch(apiBase() + '/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) {
        var j = await r.json();
        if (j && j.success && j.token) {
          applyBearer(j.token);
          return true;
        }
      }
    } catch (_e) {}

    var activeHash = await getActivePwHash();
    if (activeHash) {
      var h = await sha256Hex(pw);
      if (h === activeHash) {
        applyBearer(window.EQUSTO_ADMIN_BEARER || '');
        return true;
      }
    }

    if (isLocalDev() && !activeHash && pw === 'equsto2025') {
      applyBearer('equsto2025');
      return true;
    }

    return false;
  }

  async function resetPassword(code, password, passwordConfirm) {
    var r = await fetch(apiBase() + '/admin/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        recovery_code: code,
        password: password,
        password_confirm: passwordConfirm,
      }),
    });
    var j = {};
    try {
      j = await r.json();
    } catch (_e) {}
    if (!r.ok || !j.success) {
      throw new Error((j && j.error) || 'Şifre sıfırlanamadı (API kapalı olabilir)');
    }
    if (j.pw_sha256) {
      cachedPwHash = j.pw_sha256;
      window.EQUSTO_ADMIN_PW_SHA256 = j.pw_sha256;
    }
    if (j.token) applyBearer(j.token);
    return j;
  }

  function bindOverlay() {
    var btn = document.getElementById('admin-login-btn');
    var inp = document.getElementById('admin-login-pw');
    var err = document.getElementById('admin-login-err');
    var showForgot = document.getElementById('admin-show-forgot');
    var showLogin = document.getElementById('admin-show-login');
    var forgotBtn = document.getElementById('admin-forgot-btn');
    var forgotErr = document.getElementById('admin-forgot-err');

    if (showForgot) showForgot.addEventListener('click', showForgotPanel);
    if (showLogin) showLogin.addEventListener('click', showLoginPanel);

    if (!btn || !inp) return;

    async function submitLogin() {
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = '…';
      var ok = await tryLogin(inp.value);
      btn.disabled = false;
      btn.textContent = 'Giriş';
      if (ok) {
        var remember = document.getElementById('admin-login-remember');
        if (remember && remember.checked) {
          saveRemember(sessionStorage.getItem(TOKEN_KEY) || '');
        } else {
          clearRemember();
        }
        showOverlay(false);
        window.dispatchEvent(new CustomEvent('equsto-admin-unlocked'));
        return;
      }
      err.textContent = 'Şifre hatalı.';
      inp.focus();
      inp.select();
    }

    btn.addEventListener('click', submitLogin);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') submitLogin();
    });

    if (forgotBtn) {
      forgotBtn.addEventListener('click', async function () {
        forgotErr.textContent = '';
        var code = (document.getElementById('admin-forgot-code')?.value || '').trim();
        var pw = document.getElementById('admin-forgot-pw')?.value || '';
        var pw2 = document.getElementById('admin-forgot-pw2')?.value || '';
        if (!code) {
          forgotErr.textContent = 'Kurtarma kodu girin.';
          return;
        }
        if (pw.length < 8) {
          forgotErr.textContent = 'Yeni şifre en az 8 karakter olmalı.';
          return;
        }
        if (pw !== pw2) {
          forgotErr.textContent = 'Şifreler eşleşmiyor.';
          return;
        }
        forgotBtn.disabled = true;
        forgotBtn.textContent = '…';
        try {
          await resetPassword(code, pw, pw2);
          showLoginPanel();
          inp.value = pw;
          err.textContent = '';
          forgotErr.textContent = '';
          await submitLogin();
        } catch (e) {
          forgotErr.textContent = e.message || String(e);
        }
        forgotBtn.disabled = false;
        forgotBtn.textContent = 'Şifreyi kaydet';
      });
    }
  }

  window.equstoAdminGateReady = function () {
    if (!gateRequired()) return true;
    return isAuthed();
  };

  window.equstoAdminLogout = function () {
    sessionStorage.removeItem(SESSION_OK);
    sessionStorage.removeItem(TOKEN_KEY);
    clearRemember();
    location.reload();
  };

  document.addEventListener('DOMContentLoaded', function () {
    syncYonetimBearer();
    bindOverlay();
    if (gateRequired() && !isAuthed()) restoreRemember();
    if (!gateRequired() || isAuthed()) {
      showOverlay(false);
      return;
    }
    showOverlay(true);
    showLoginPanel();
  });
})();
