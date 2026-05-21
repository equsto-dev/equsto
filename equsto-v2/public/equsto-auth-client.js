/**
 * Equsto üye API istemcisi — /api/auth/*
 */
;(function () {
  'use strict';

  function apiBase() {
    var c = window.EQUSTO_AUTH || {};
    if (c.apiBase) return String(c.apiBase).replace(/\/$/, '');
    return '';
  }

  function authUrl(path) {
    return apiBase() + '/api/auth' + path;
  }

  function setMsg(html, isInfo) {
    var el = document.getElementById('auth-social-msg');
    if (!el) return;
    el.innerHTML = html || '';
    el.className = 'auth-msg' + (isInfo ? ' auth-msg--info' : '');
    el.style.display = html ? 'block' : 'none';
  }

  function applySession(data) {
    if (!data || !data.user) return;
    if (typeof window.equstoSetMemberActive === 'function') {
      window.equstoSetMemberActive({
        active: true,
        token: data.token || '',
        email: data.user.email || '',
        name: data.user.name || '',
        displayName: data.user.name || data.user.email || '',
        provider: data.user.provider || 'email',
        picture: data.user.picture || '',
        expiresAt: data.expiresAt || null,
      });
    }
    if (typeof window.equstoRefreshMemberHeader === 'function') {
      window.equstoRefreshMemberHeader();
    }
    try {
      document.dispatchEvent(new CustomEvent('equsto-member-session'));
    } catch (e) {}
  }

  function apiUnavailableMsg(status) {
    if (status === 404) {
      return (
        'Üye girişi API’si bulunamadı (HTTP 404). Canlı sitede <code>claude-api-proxy</code> çalışmalı ' +
        've <code>/api/auth</code> yolu erişilebilir olmalı. cPanel Node veya <code>auth-api-base.json</code> ' +
        'ile harici API adresi tanımlayın.'
      );
    }
    return 'Sunucuya ulaşılamadı' + (status ? ' (HTTP ' + status + ')' : '') + '.';
  }

  function apiFetch(path, opts) {
    opts = opts || {};
    var headers = Object.assign({ Accept: 'application/json' }, opts.headers || {});
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    var token =
      (typeof window.equstoGetMemberToken === 'function' && window.equstoGetMemberToken()) || '';
    if (token) {
      headers.Authorization = 'Bearer ' + token;
      headers['X-Equsto-Authorization'] = token;
    }
    var url = authUrl(path);
    if (token && (opts.method || 'GET') === 'GET' && url.indexOf('access_token=') < 0) {
      url += (url.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
    }
    if (opts.json !== undefined && token) {
      opts.json = Object.assign({}, opts.json, { token: token });
    }
    var cred = apiBase() ? 'omit' : 'same-origin';
    return fetch(url, {
      method: opts.method || 'GET',
      credentials: cred,
      headers: headers,
      body: opts.json !== undefined ? JSON.stringify(opts.json) : opts.body,
    })
      .then(function (r) {
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) {
          return {
            success: false,
            error: apiUnavailableMsg(r.status),
            _httpStatus: r.status,
            _notJson: true,
          };
        }
        return r.json().then(function (j) {
          if (!r.ok && j && !j.error) j.error = 'İstek başarısız (' + r.status + ')';
          if (!r.ok && r.status === 404 && j && !j.error) j.error = apiUnavailableMsg(404);
          j._httpStatus = r.status;
          if (r.status === 401 && typeof window.equstoClearMemberSession === 'function') {
            window.equstoClearMemberSession();
          }
          return j;
        });
      })
      .catch(function () {
        return {
          success: false,
          error:
            'Ağ hatası — API çalışmıyor olabilir. Yerelde: <code>npm run dev:all</code>. Canlıda: Node API kurulumu.',
          _network: true,
        };
      });
  }

  window.equstoAuthFetchConfig = function () {
    return apiFetch('/config').then(function (j) {
      if (j && j.success) {
        window.EQUSTO_AUTH = window.EQUSTO_AUTH || {};
        if (j.googleClientId) window.EQUSTO_AUTH.googleClientId = j.googleClientId;
        if (j.appleClientId) window.EQUSTO_AUTH.appleClientId = j.appleClientId;
        if (j.appleRedirectURI) window.EQUSTO_AUTH.appleRedirectURI = j.appleRedirectURI;
      }
      return j;
    });
  };

  window.equstoAuthEmailLogin = function (email, password) {
    return apiFetch('/login', { method: 'POST', json: { email: email, password: password } }).then(function (j) {
      if (j && j.success) applySession(j);
      return j;
    });
  };

  window.equstoAuthEmailRegister = function (email, password, name) {
    return apiFetch('/register', {
      method: 'POST',
      json: { email: email, password: password, name: name || '' },
    }).then(function (j) {
      if (j && j.success) applySession(j);
      return j;
    });
  };

  window.equstoAuthGoogleCredential = function (credential) {
    return apiFetch('/google', { method: 'POST', json: { credential: credential } }).then(function (j) {
      if (j && j.success) {
        applySession(j);
        setMsg('');
        var next = new URLSearchParams(location.search).get('next') || 'index.html';
        setTimeout(function () {
          if (typeof window.eqGo === 'function') window.eqGo('home');
          else location.href = next;
        }, 400);
      } else if (j && j.error) {
        setMsg(j.error, false);
      }
      return j;
    });
  };

  window.equstoAuthAppleResult = function (res) {
    var idToken =
      (res && res.authorization && res.authorization.id_token) ||
      (res && res.id_token) ||
      '';
    return apiFetch('/apple', { method: 'POST', json: { id_token: idToken, authorization: res && res.authorization } }).then(
      function (j) {
        if (j && j.success) {
          applySession(j);
          setMsg('');
          setTimeout(function () {
            if (typeof window.eqGo === 'function') window.eqGo('home');
            else location.href = 'index.html';
          }, 400);
        } else if (j && j.error) {
          setMsg(j.error, false);
        }
        return j;
      },
    );
  };

  window.equstoAuthLogout = function () {
    return apiFetch('/logout', { method: 'POST', json: {} }).finally(function () {
      if (typeof window.equstoClearMemberSession === 'function') {
        window.equstoClearMemberSession();
      }
      if (typeof window.equstoRefreshMemberHeader === 'function') {
        window.equstoRefreshMemberHeader();
      }
    });
  };

  window.equstoAuthValidateSession = function () {
    var token =
      (typeof window.equstoGetMemberToken === 'function' && window.equstoGetMemberToken()) || '';
    if (!token) return Promise.resolve(false);
    return apiFetch('/me').then(function (j) {
      if (j && j.success && j.user) {
        applySession(j);
        return true;
      }
      if (typeof window.equstoClearMemberSession === 'function') {
        window.equstoClearMemberSession();
      }
      return false;
    });
  };

  window.equstoAuthBootstrap = function () {
    return window.equstoAuthFetchConfig().catch(function () {
      return { success: false };
    });
  };

  window.equstoAuthEmailSubmit = function (ev, mode) {
    if (ev) ev.preventDefault();
    var emailEl = document.getElementById('auth-email');
    var passEl = document.getElementById('auth-password');
    var nameEl = document.getElementById('auth-name');
    var email = emailEl ? emailEl.value.trim() : '';
    var password = passEl ? passEl.value : '';
    var name = nameEl ? nameEl.value.trim() : '';
    var btn = document.getElementById('auth-submit-btn');
    if (btn) btn.disabled = true;
    setMsg('İşleniyor…', true);
    var p =
      mode === 'register'
        ? window.equstoAuthEmailRegister(email, password, name)
        : window.equstoAuthEmailLogin(email, password);
    return p
      .then(function (j) {
        if (j && j.success) {
          setMsg(
            mode === 'register' ? 'Kayıt tamamlandı. Yönlendiriliyorsunuz…' : 'Giriş başarılı. Yönlendiriliyorsunuz…',
            true,
          );
          var next = new URLSearchParams(location.search).get('next') || 'index.html';
          setTimeout(function () {
            if (typeof window.eqGo === 'function' && /index|home/i.test(next)) window.eqGo('home');
            else location.href = next;
          }, 500);
        } else {
          setMsg((j && j.error) || 'İşlem başarısız', false);
        }
        return j;
      })
      .catch(function (err) {
        var j = err && err.error ? err : null;
        setMsg(
          (j && j.error) ||
            'Sunucuya ulaşılamadı. Yerelde <code>npm run dev:all</code>; canlıda API sunucusu kurulu olmalı.',
          false,
        );
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  };
})();
