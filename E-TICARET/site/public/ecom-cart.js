/**
 * Equsto vitrin sepeti: katalog kartlarından satır toplama, localStorage, WhatsApp metni.
 * contact.js (defer) sonrası yüklenir; equstoOpenWhatsAppWebWindow varsa onu kullanır.
 */
;(function () {
  'use strict';

  function __cartT(k, fb, vars) {
    var s = fb || k;
    try {
      if (typeof window.eqT === 'function') {
        var v = window.eqT(k, null);
        if (v != null && v !== k) s = v;
      }
    } catch (_) {}
    if (vars) {
      Object.keys(vars).forEach(function (kk) {
        s = String(s).replace(new RegExp('\\{' + kk + '\\}', 'g'), vars[kk]);
      });
    }
    return s;
  }

  var STORAGE_KEY = 'equsto-ecom-cart-v1';
  var SYNC_TOKEN_KEY = 'equsto_cart_sync_v1';
  var CHECKOUT_STORAGE_KEY = 'equsto_checkout_v1';
  var SHOP_CART_API = '/api/shop/cart';
  var MAX_LINES = 250;
  var BULK_MAX_LINES = 500;

  function escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/\r?\n/g, ' ');
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function injectCartCss() {
    if (document.getElementById('eq-cart-css')) return;
    var l = document.createElement('link');
    l.id = 'eq-cart-css';
    l.rel = 'stylesheet';
    l.href = '/eq-cart.css?v=20260601shop-cart';
    document.head.appendChild(l);
  }

  function digitsOnly(v) {
    return String(v || '').replace(/\D/g, '');
  }

  function resolveWaDigits() {
    var a = digitsOnly(window.EQUSTO_WHATSAPP_E164);
    if (a.length >= 10) return a;
    try {
      if (window.PFOS_CONFIG && PFOS_CONFIG.whatsappPhone) {
        var b = digitsOnly(PFOS_CONFIG.whatsappPhone);
        if (b.length >= 10) return b;
      }
    } catch (e) {}
    return '';
  }

  try {
    fetch('/api/magaza-ayarlar', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        var d = j && j.data ? j.data : null;
        if (!d) return;
        if (d.whatsapp_e164) window.EQUSTO_WHATSAPP_E164 = String(d.whatsapp_e164);
        if (d.whatsapp_prefill) window.EQUSTO_WHATSAPP_TEXT = String(d.whatsapp_prefill);
      })
      .catch(function () {});
  } catch (_) {}

  function lineId(it) {
    var c = String(it.c || '').trim();
    var b = String(it.b || '').trim();
    var n = String(it.n || '').trim();
    var s = c + '\t' + b + '\t' + n;
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return 'eq' + (h >>> 0).toString(36);
  }

  function isQuotePriceLabel(p) {
    var s = String(p == null ? '' : p).trim();
    if (!s) return false;
    if (/€|eur|teklif/i.test(s)) return true;
    return parsePriceNum(s) === 0 && /\d/.test(s);
  }

  function normalizeCartItem(x) {
    if (!x) return null;
    var n = String(x.n || '').trim();
    var b = String(x.b || '').trim();
    var c = String(x.c || '').trim();
    if (!n && !b) return null;
    var p = String(x.p || '').trim();
    var quote = !!(x.quote || isQuotePriceLabel(p));
    var id = lineId({ n: n, b: b, c: c });
    return {
      id: id,
      n: n,
      b: b,
      c: c,
      p: p,
      img: resolveCartItemImg(String(x.img || '').trim()),
      href: String(x.href || '').trim(),
      q: Math.max(1, Math.round(Number(x.q) || 1)),
      quote: quote,
    };
  }

  /** Aynı ürün satırlarını tekilleştirir; adetleri toplamaz (F5 çift sayım önlenir). */
  function normalizeCart(arr) {
    var map = {};
    (arr || []).forEach(function (x) {
      var it = normalizeCartItem(x);
      if (!it) return;
      if (map[it.id]) {
        map[it.id].q = Math.max(map[it.id].q, it.q);
        if (it.p) map[it.id].p = it.p;
        if (it.img && !map[it.id].img) map[it.id].img = it.img;
        if (it.href && !map[it.id].href) map[it.id].href = it.href;
        if (it.quote) map[it.id].quote = true;
      } else {
        map[it.id] = it;
      }
    });
    var out = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    }
    return out.length > MAX_LINES ? out.slice(0, MAX_LINES) : out;
  }

  var syncPushTimer = null;
  var syncPullInFlight = false;
  var syncPullQueued = false;
  var syncApiWarned = false;
  var lastSyncAt = 0;
  var sessionCartPulled = false;
  var shopCartPulled = false;
  var shopCartPullInFlight = false;
  var shopCartPushTimer = null;
  var cartClearGraceUntil = 0;
  var cartClearPending = false;
  var shopCartPullGen = 0;
  var CART_BC_NAME = 'equsto-ecom-cart-v1';
  var cartBc =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CART_BC_NAME) : null;

  function notifyCartChanged() {
    try {
      if (cartBc) cartBc.postMessage({ t: 'update', at: Date.now() });
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('equsto-cart-changed'));
    } catch (e2) {}
  }

  function onCartChangedRemote() {
    syncBadge();
    var cartOv = document.getElementById('equsto-cart-overlay');
    if (cartOv && cartOv.classList.contains('is-open')) {
      renderPanelList();
    }
    if (isCartSurface()) renderPanelList();
  }

  function readMemberFromStorage() {
    try {
      var j = JSON.parse(localStorage.getItem('equsto_member_v1') || 'null');
      return j && typeof j === 'object' ? j : null;
    } catch (e) {
      return null;
    }
  }

  function isLoggedIn() {
    if (typeof window.equstoIsMemberLoggedIn === 'function') {
      return window.equstoIsMemberLoggedIn();
    }
    var o = readMemberFromStorage();
    if (!o || o.active !== true) return false;
    if (o.expiresAt && Number(o.expiresAt) < Date.now()) return false;
    return true;
  }

  function authToken() {
    if (typeof window.equstoGetMemberToken === 'function') {
      var t = window.equstoGetMemberToken();
      if (t) return t;
    }
    var o = readMemberFromStorage();
    return o && o.token ? String(o.token) : '';
  }

  function cartApiBase() {
    try {
      if (window.EQUSTO_AUTH && window.EQUSTO_AUTH.apiBase) {
        return String(window.EQUSTO_AUTH.apiBase).replace(/\/$/, '');
      }
    } catch (e) {}
    /* Yerelde Vite /api → auth proxy (eq-auth-api.js); doğrudan :3001 kullanma. */
    return '';
  }

  function isLocalDev() {
    var h = (location.hostname || '').toLowerCase();
    return h === '127.0.0.1' || h === 'localhost';
  }

  function cartAuthUrl() {
    return cartApiBase() + '/api/auth/cart';
  }

  function newSyncToken() {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function readSyncTokenCookie() {
    try {
      var m = String(document.cookie || '').match(/(?:^|;\s*)equsto_cart_sync=([0-9a-f-]{36})/i);
      return m ? m[1] : '';
    } catch (e) {
      return '';
    }
  }

  function getSyncToken() {
    try {
      var t = localStorage.getItem(SYNC_TOKEN_KEY);
      if (t && /^[0-9a-f-]{36}$/i.test(t)) return t;
    } catch (e) {}
    var fromCookie = readSyncTokenCookie();
    if (fromCookie) {
      try {
        localStorage.setItem(SYNC_TOKEN_KEY, fromCookie);
      } catch (eCookie) {}
      return fromCookie;
    }
    var created = newSyncToken();
    try {
      localStorage.setItem(SYNC_TOKEN_KEY, created);
    } catch (e2) {}
    return created;
  }

  function setSyncToken(t) {
    if (!t || !/^[0-9a-f-]{36}$/i.test(t)) return;
    try {
      localStorage.setItem(SYNC_TOKEN_KEY, t);
    } catch (e) {}
  }

  function shopCartPayload(extra) {
    var o = readMemberFromStorage();
    var email = o && o.email ? String(o.email).trim().toLowerCase() : '';
    var base = { syncToken: getSyncToken() };
    if (email && email.indexOf('@') > 0) base.memberEmail = email;
    var token = authToken();
    if (token) base.token = token;
    if (extra && typeof extra === 'object') {
      Object.keys(extra).forEach(function (k) {
        base[k] = extra[k];
      });
    }
    return base;
  }

  function shopCartFetchHeaders() {
    var h = { Accept: 'application/json' };
    var token = authToken();
    if (token) {
      h.Authorization = 'Bearer ' + token;
      h['X-Equsto-Authorization'] = token;
    }
    return h;
  }

  function shopCartPull(opts) {
    opts = opts || {};
    if (cartClearPending) return Promise.resolve(false);
    if (shopCartPullInFlight && !opts.force) return Promise.resolve(false);
    var pullGen = ++shopCartPullGen;
    shopCartPullInFlight = true;
    var p = shopCartPayload();
    var q =
      '?syncToken=' +
      encodeURIComponent(p.syncToken) +
      (p.memberEmail ? '&memberEmail=' + encodeURIComponent(p.memberEmail) : '');
    return fetch(SHOP_CART_API + q, {
      method: 'GET',
      credentials: 'same-origin',
      headers: shopCartFetchHeaders(),
      cache: 'no-store',
    })
      .then(function (r) {
        return r.json().catch(function () {
          return { success: false };
        });
      })
      .then(function (j) {
        if (pullGen !== shopCartPullGen) return false;
        if (!j || !j.success) return false;
        shopCartPulled = true;
        if (usesAuthCartSync()) sessionCartPulled = true;
        lastSyncAt = Date.now();
        applyShopPulledCart(Array.isArray(j.items) ? j.items : []);
        return true;
      })
      .catch(function () {
        return false;
      })
      .finally(function () {
        shopCartPullInFlight = false;
      });
  }

  function pushShopCartNow(arr, opts) {
    opts = opts || {};
    var payload = shopCartPayload({ items: arr || load() });
    if (opts.replace) payload.replace = true;
    if (opts.clear) payload.clear = true;
    if (shopCartPushTimer) {
      clearTimeout(shopCartPushTimer);
      shopCartPushTimer = null;
    }
    var putHeaders = shopCartFetchHeaders();
    putHeaders['Content-Type'] = 'application/json';
    return fetch(SHOP_CART_API, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: putHeaders,
      body: JSON.stringify(payload),
      keepalive: !!opts.keepalive,
    })
      .then(function (r) {
        return r.json().catch(function () {
          return { success: false };
        });
      })
      .then(function (j) {
        if (!j || !j.success) return { ok: false, items: [] };
        var items = normalizeCart(Array.isArray(j.items) ? j.items : []);
        if (opts.clear || (opts.replace && !(arr && arr.length))) {
          saveLocal(items);
          syncBadge();
          if (isCartSurface()) renderPanelList();
        }
        return { ok: true, items: items };
      })
      .catch(function () {
        return { ok: false, items: [] };
      });
  }

  function scheduleShopCartPush(arr) {
    if (shopCartPushTimer) clearTimeout(shopCartPushTimer);
    var payload = arr || load();
    shopCartPushTimer = setTimeout(function () {
      shopCartPushTimer = null;
      if (shopCartPullInFlight) {
        scheduleShopCartPush(payload);
        return;
      }
      pushShopCartNow(payload, { replace: true });
    }, 250);
  }

  function applyShopPulledCart(remote) {
    if (cartClearPending) return;
    var remoteNorm = normalizeCart(remote || []);
    if (Date.now() < cartClearGraceUntil && remoteNorm.length) return;
    saveLocal(remoteNorm);
    syncBadge();
    if (isCartSurface()) renderPanelList();
  }

  function flushShopCartPush() {
    if (cartClearPending) {
      pushShopCartNow([], { replace: true, clear: true, keepalive: true });
      return;
    }
    if (!shopCartPushTimer) return; // Prevent overwriting newer server state with stale local state on reload
    var payload = load();
    if (!payload.length) return;
    pushShopCartNow(payload, { replace: true, keepalive: true });
  }

  function memberAuthUrl() {
    return cartApiBase() + '/api/auth/me';
  }

  function warnSyncApiOnce() {
    if (syncApiWarned) return;
    syncApiWarned = true;
    toast(
      __cartT(
        'cart.sync_server_needed',
        'Sepet sunucuya kaydedildi. Telefon ve bilgisayarda aynı sepet için giriş yapın.'
      )
    );
  }

  var sessionInvalidWarned = false;

  function handleSessionInvalid() {
    if (typeof window.equstoClearMemberSession === 'function') {
      window.equstoClearMemberSession();
    }
    if (sessionInvalidWarned) return;
    sessionInvalidWarned = true;
    toast(__cartT('cart.session_invalid', 'Oturum geçersiz — çıkış yapıp tekrar giriş yapın (Google ile).'));
  }

  function whenAuthApiReady(fn) {
    var p = window.__eqAuthApiReady;
    if (p && typeof p.then === 'function') p.then(fn);
    else fn();
  }

  function authApiFetch(url, method, bodyObj) {
    var token = authToken();
    if (!token) return Promise.resolve(null);
    var fetchUrl = url;
    if (method === 'GET' && fetchUrl.indexOf('access_token=') < 0) {
      fetchUrl +=
        (fetchUrl.indexOf('?') >= 0 ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
    }
    var payload = bodyObj;
    if (bodyObj !== undefined && method !== 'GET') {
      payload = Object.assign({}, bodyObj, { token: token });
    }
    var opts = {
      method: method,
      credentials: cartApiBase() ? 'omit' : 'same-origin',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer ' + token,
        'X-Equsto-Authorization': token,
      },
    };
    if (payload !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(payload);
    }
    return fetch(fetchUrl, opts)
      .then(function (r) {
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) {
          return { success: false, _notJson: true, _httpStatus: r.status };
        }
        return r.json().then(function (j) {
          if (!r.ok) {
            var out = j && typeof j === 'object' ? j : { success: false };
            out._httpStatus = r.status;
            if (!out.success) out.success = false;
            if (r.status === 401) handleSessionInvalid();
            return out;
          }
          return j;
        });
      })
      .catch(function () {
        return { success: false, _network: true };
      });
  }

  function cartApiFetch(method, bodyIn) {
    var body = bodyIn;
    if (bodyIn !== undefined && Array.isArray(bodyIn)) {
      body = { items: bodyIn };
    }
    return authApiFetch(cartAuthUrl(), method, body).then(function (j) {
      if (j && j._httpStatus === 404 && method === 'GET') {
        return authApiFetch(memberAuthUrl(), 'GET').then(function (me) {
          if (me && me.success && Array.isArray(me.items)) {
            return { success: true, items: me.items, _viaMe: true };
          }
          warnSyncApiOnce();
          return j;
        });
      }
      if (j && j._httpStatus === 404 && (method === 'PUT' || method === 'POST') && bodyIn !== undefined) {
        return authApiFetch(memberAuthUrl(), 'PUT', body).then(function (me) {
          if (me && me.success) {
            return {
              success: true,
              items: Array.isArray(me.items) ? me.items : body && body.items,
              _viaMe: true,
            };
          }
          warnSyncApiOnce();
          return j;
        });
      }
      if (j && j._httpStatus === 404) warnSyncApiOnce();
      return j;
    });
  }

  function mergeCartMaxQty(a, b) {
    var map = {};
    function ingest(arr) {
      (arr || []).forEach(function (x) {
        var it = normalizeCartItem(x);
        if (!it) return;
        if (map[it.id]) {
          map[it.id].q = Math.max(map[it.id].q, it.q);
          if (it.p) map[it.id].p = it.p;
          if (it.n) map[it.id].n = it.n;
          if (it.b) map[it.id].b = it.b;
          if (it.c) map[it.id].c = it.c;
        } else {
          map[it.id] = it;
        }
      });
    }
    ingest(a);
    ingest(b);
    var out = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    }
    return out.length > MAX_LINES ? out.slice(0, MAX_LINES) : out;
  }

  function cartFingerprint(arr) {
    try {
      return JSON.stringify(
        normalizeCart(arr || [])
          .map(function (x) {
            return { id: x.id, q: x.q };
          })
          .sort(function (a, b) {
            return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
          }),
      );
    } catch (e) {
      return '';
    }
  }

  function pushCartNow(arr, opts) {
    opts = opts || {};
    if (!isLoggedIn() || !authToken()) return Promise.resolve(false);
    if (!opts.force && !canPushToServer()) return Promise.resolve(false);
    var body = { items: arr || load() };
    if (opts.replace) body.replace = true;
    if (syncPushTimer) {
      clearTimeout(syncPushTimer);
      syncPushTimer = null;
    }
    return cartApiFetch('PUT', body).then(function (j) {
      return !!(j && j.success);
    });
  }

  function mergeCartLines(a, b) {
    var map = {};
    function ingest(arr) {
      (arr || []).forEach(function (x) {
        if (!x) return;
        var id = x.id || lineId(x);
        if (!id) return;
        var q = Math.max(1, Math.round(Number(x.q) || 1));
        if (map[id]) {
          map[id].q = (map[id].q || 1) + q;
          if (x.p) map[id].p = x.p;
          if (x.n) map[id].n = x.n;
          if (x.b) map[id].b = x.b;
          if (x.c) map[id].c = x.c;
        } else {
          map[id] = { id: id, n: x.n, b: x.b, c: x.c, p: x.p, q: q };
        }
      });
    }
    ingest(a);
    ingest(b);
    var out = [];
    for (var k in map) {
      if (Object.prototype.hasOwnProperty.call(map, k)) out.push(map[k]);
    }
    return out.length > MAX_LINES ? out.slice(0, MAX_LINES) : out;
  }

  function canPushToServer() {
    if (!isLoggedIn() || !authToken()) return false;
    if (!sessionCartPulled) return false;
    if (syncPullInFlight) return false;
    return true;
  }

  /** Sunucu + yerel birleşimi (aynı üründe adet = max). */
  function applyPulledCart(remote) {
    if (cartClearPending) return;
    var remoteNorm = normalizeCart(remote || []);
    if (Date.now() < cartClearGraceUntil && remoteNorm.length) return;
    saveLocal(remoteNorm);
    syncBadge();
    if (isCartSurface()) renderPanelList();
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var j = JSON.parse(raw);
      return normalizeCart(Array.isArray(j) ? j : []);
    } catch (e) {
      return [];
    }
  }

  function saveLocal(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      notifyCartChanged();
    } catch (e) {}
  }

  function schedulePush(arr) {
    if (!isLoggedIn() || !authToken()) return;
    if (!sessionCartPulled) return;
    if (syncPushTimer) clearTimeout(syncPushTimer);
    var payload = arr || load();
    syncPushTimer = setTimeout(function () {
      syncPushTimer = null;
      if (syncPullInFlight) {
        schedulePush(payload);
        return;
      }
      pushCartNow(payload, { force: true });
    }, 200);
  }

  function flushPush() {
    flushShopCartPush();
  }

  function usesAuthCartSync() {
    return isLoggedIn() && !!authToken();
  }

  function save(arr) {
    var clean = normalizeCart(arr || []);
    var isEmpty = !clean.length;
    saveLocal(clean);
    if (isEmpty) {
      if (shopCartPushTimer) clearTimeout(shopCartPushTimer);
      shopCartPushTimer = null;
      if (syncPushTimer) clearTimeout(syncPushTimer);
      syncPushTimer = null;
      return pushShopCartNow([], { replace: true, clear: true }).then(function (res) {
        if (res && res.ok) {
          shopCartPulled = true;
          lastSyncAt = Date.now();
        }
        return !!(res && res.ok);
      });
    }
    scheduleShopCartPush(clean);
    return Promise.resolve(true);
  }

  function syncFromServer(opts) {
    return shopCartPull(opts || {});
  }

  function totalQty(arr) {
    var t = 0;
    for (var i = 0; i < arr.length; i++) t += arr[i].q > 0 ? arr[i].q : 1;
    return t;
  }

  function hrefFromCartTrigger(el) {
    var node = el;
    var i;
    for (i = 0; i < 6 && node; i++) {
      if (node.tagName === 'A') {
        var own = node.getAttribute('href') || '';
        if (/\/shop\//.test(own)) return own;
      }
      if (node.querySelector) {
        var a = node.querySelector('a[href*="/shop/"]');
        if (a) return a.getAttribute('href') || '';
      }
      node = node.parentElement;
    }
    return '';
  }

  function hrefFromCatalogRow(row) {
    if (!row || typeof window.eqProductSlug !== 'function' || typeof window.eqProductPath !== 'function') {
      return '';
    }
    var slug = '';
    try {
      slug = window.eqProductSlug(row);
    } catch (eSlug) {
      slug = '';
    }
    if (!slug) return '';
    var cat = row.category || row.kategori || row.c || '';
    var dept = '';
    if (typeof window.eqCategoryToUrunlerSeg === 'function') {
      try {
        dept = window.eqCategoryToUrunlerSeg(cat) || '';
      } catch (eDept) {
        dept = '';
      }
    }
    if (!dept) dept = String(row.dept || 'pisirme');
    try {
      return window.eqProductPath(dept, slug);
    } catch (ePath) {
      return '';
    }
  }

  function parseItemFromEl(el) {
    if (!el) return null;
    var q = 1;
    var qtyWrap = el.closest(".eq-cmf-buybox, .eq-epdp-buybox");
    if (qtyWrap) {
      var valEl = qtyWrap.querySelector(".eq-cmf-qty__val");
      if (valEl) q = Math.max(1, Math.min(99, parseInt(valEl.textContent, 10) || 1));
    }
    return {
      n: el.getAttribute('data-eq-n') || '',
      b: el.getAttribute('data-eq-b') || '',
      c: el.getAttribute('data-eq-c') || '',
      p: el.getAttribute('data-eq-p') || '',
      img: el.getAttribute('data-eq-img') || '',
      href: hrefFromCartTrigger(el),
      quote: el.getAttribute('data-eq-quote') === '1',
      q: q,
    };
  }

  /** Ürün kartı (.prod-card-wrap) — önce data-equsto-cart düğmesi, yoksa .prod-* metinleri. */
  function parseItemFromCard(card) {
    if (!card) return null;
    var btn = card.querySelector('[data-equsto-cart="1"]');
    if (btn) {
      var fromBtn = parseItemFromEl(btn);
      if (fromBtn && (fromBtn.n || fromBtn.b)) return fromBtn;
    }
    var tagged = card.querySelector('[data-eq-n]');
    if (tagged) {
      var fromTag = parseItemFromEl(tagged);
      if (fromTag && (fromTag.n || fromTag.b)) return fromTag;
    }
    var nameEl = card.querySelector('.prod-name');
    var brandEl = card.querySelector('.prod-brand');
    var priceEl = card.querySelector('.prod-price');
    var n = nameEl ? String(nameEl.textContent || '').trim() : '';
    var b = brandEl ? String(brandEl.textContent || '').trim() : '';
    var pRaw = priceEl ? String(priceEl.textContent || '').trim() : '';
    var p = pRaw.replace(/^₺\s*/, '').trim();
    var c = card.getAttribute('data-eq-c') || '';
    var imgEl = card.querySelector('.prod-img img, .eq-rail-card-img img, .eq-dept-plp-card__img img');
    var imgRaw = imgEl
      ? imgEl.getAttribute('data-eq-img-raw') ||
        imgEl.getAttribute('data-eq-img') ||
        ''
      : '';
    var imgSrc = imgEl ? imgEl.getAttribute('src') || imgEl.currentSrc || '' : '';
    var img = imgRaw || imgSrc || card.getAttribute('data-eq-img') || '';
    if (!n && !b) return null;
    return { n: n, b: b, c: c, p: p, img: img };
  }

  function addFromCard(card) {
    var it = parseItemFromCard(card);
    if (!it) {
      toast(__cartT('cart.product_read_fail', 'Ürün bilgisi okunamadı.'));
      return false;
    }
    addFromItem(it);
    return true;
  }

  function dismissCartAddedToast() {
    var t = document.getElementById('equsto-cart-added-toast');
    if (!t) return;
    t.classList.remove('is-visible');
    clearTimeout(t._remove);
    t._remove = setTimeout(function () {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 220);
  }

  function positionCartAddedToast(bar) {
    var top = 8;
    var hdr = document.querySelector('header.hdr');
    if (hdr) {
      var hr = hdr.getBoundingClientRect();
      top = Math.max(top, hr.bottom + 8);
    }
    var nav = document.querySelector('nav.topnav, .topnav');
    if (nav) {
      var cs = window.getComputedStyle(nav);
      if (cs.display !== 'none' && cs.visibility !== 'hidden') {
        var nr = nav.getBoundingClientRect();
        if (nr.height > 0) top = Math.max(top, nr.bottom + 8);
      }
    }
    bar.style.top = top + 'px';
  }

  function toastCartAdded(name) {
    dismissCartAddedToast();
    injectCartCss();
    var bar = document.createElement('div');
    bar.id = 'equsto-cart-added-toast';
    bar.className = 'eq-cart-added-toast';
    bar.setAttribute('role', 'status');
    bar.innerHTML =
      '<span class="eq-cart-added-toast__icon" aria-hidden="true">✓</span>' +
      '<span class="eq-cart-added-toast__body">' +
      '<strong>' + escHtml(__cartT('cart.added_strong', 'Sepete eklendi')) + '</strong>' +
      (name ? '<span>' + escHtml(name) + '</span>' : '') +
      '</span>';
    document.body.appendChild(bar);
    positionCartAddedToast(bar);
    requestAnimationFrame(function () {
      bar.classList.add('is-visible');
    });
    clearTimeout(bar._hide);
    bar._hide = setTimeout(dismissCartAddedToast, 5000);
  }

  function toast(msg) {
    var id = 'equsto-cart-toast';
    var t = document.getElementById(id);
    if (!t) {
      t = document.createElement('div');
      t.id = id;
      t.setAttribute('role', 'status');
      t.style.cssText =
        'position:fixed;bottom:88px;left:50%;transform:translateX(-50%);z-index:450;' +
        'background:var(--eq-text,#1a1a1a);color:var(--eq-surface,#fff);padding:10px 18px;border-radius:8px;' +
        'font-size:12px;box-shadow:0 4px 20px rgba(0,0,0,.25);opacity:0;transition:opacity .2s ease;' +
        'pointer-events:none;max-width:92vw;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._hide);
    t._hide = setTimeout(function () {
      t.style.opacity = '0';
    }, 1800);
  }

  function syncBadge() {
    var arr = load();
    var q = totalQty(arr);
    var el = document.getElementById('equsto-cart-count');
    if (el) {
      el.innerHTML =
        '<span class="eq-hdr-cart-badge" aria-hidden="true">' +
        escHtml(q > 99 ? '99+' : String(q)) +
        '</span>';
      try {
        if (typeof window.eqI18nApply === 'function') {
          var cartRoot = document.getElementById('equsto-hdr-cart');
          if (cartRoot) window.eqI18nApply(cartRoot);
        }
      } catch (_) {}
    }
    var bn = document.getElementById('eq-bnav-cart-badge');
    if (bn) bn.textContent = q > 99 ? '99+' : String(q);
  }

  function extractPrice(raw, item) {
    if (window.EqustoPriceDisplay && typeof window.EqustoPriceDisplay.formatCard === 'function') {
      var card = window.EqustoPriceDisplay.formatCard(item || { price: raw });
      if (card) {
        return card
          .replace(/€/g, '')
          .replace(/₺/g, '')
          .replace(/\+?\s*KDV/gi, '')
          .replace(/KDV\s*dahil/gi, '')
          .trim();
      }
    }
    if (item && item.fiyat_tl != null && item.fiyat_tl !== '') {
      var ft = Number(item.fiyat_tl);
      if (Number.isFinite(ft) && ft > 0) {
        try {
          return ft.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch (_) {
          return String(ft);
        }
      }
    }
    if (raw == null || raw === '') return '';
    var s = String(raw).split('\n')[0] || String(raw);
    return s
      .replace(/€/g, '')
      .replace(/₺/g, '')
      .replace(/\+?\s*KDV/gi, '')
      .replace(/KDV\s*dahil/gi, '')
      .trim();
  }

  function itemFromEkipmanlar(x) {
    if (!x) return null;
    var p = '';
    if (x.fiyat_tl != null && x.fiyat_tl !== '') {
      var n = Number(x.fiyat_tl);
      if (Number.isFinite(n) && n > 0) {
        try {
          p = n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } catch (_) {
          p = String(n);
        }
      }
    }
    if (!p && x.price) p = extractPrice(x.price, x);
    var img0 =
      Array.isArray(x.images) && x.images[0]
        ? String(x.images[0]).replace(/\\/g, '/')
        : String(x.img || x.gorsel_url || '').trim();
    return {
      n: x.name || x.ad || '',
      b: x.brand || x.marka_ad || '',
      c: x.category || x.kategori || '',
      p: p,
      img: img0,
    };
  }

  function itemFromPfosRow(r) {
    if (!r) return null;
    var n = String(r.pfN || r.ad || r.catalogAd || '').trim();
    var b = String(r.pfB || r.marka || r.catalogMarka || '').trim();
    var birim = Number(r.birim) || 0;
    var p = '';
    if (birim > 0) {
      try {
        p = birim.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } catch (_) {
        p = String(birim);
      }
    }
    return {
      n: n,
      b: b,
      c: String(r.pfDept || r.dept || '').trim(),
      p: p,
      q: Math.max(1, Math.round(Number(r.adet) || 1)),
    };
  }

  function mergeIntoCart(arr, it, opts) {
    opts = opts || {};
    var cap = opts.maxLines != null ? opts.maxLines : MAX_LINES;
    var norm = normalizeCartItem(it);
    if (!norm) return 'skip';
    var id = norm.id;
    var qty = norm.q;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].q = Math.min(99, (arr[i].q || 1) + qty);
        if (norm.p) arr[i].p = norm.p;
        if (norm.img) arr[i].img = resolveCartItemImg(norm.img);
        if (norm.quote) arr[i].quote = true;
        return 'merged';
      }
    }
    if (arr.length >= cap) return 'full';
    arr.push(norm);
    return 'added';
  }

  function addFromItem(it, opts) {
    opts = opts || {};
    if (!it || (!it.n && !it.b)) return;
    var arr = normalizeCart(load());
    var st = mergeIntoCart(arr, it, { maxLines: MAX_LINES });
    if (st === 'full') {
      toast(__cartT('cart.too_many_lines', 'Sepet çok fazla satır içeriyor.'));
      return;
    }
    save(arr);
    syncBadge();
    if (!opts.silent) toastCartAdded(it && it.n ? it.n : '');
  }

  function loadSiteCatalog() {
    if (window.EqustoShopCatalog && typeof window.EqustoShopCatalog.loadMergedCatalog === "function") {
      return window.EqustoShopCatalog.loadMergedCatalog();
    }
    if (window.EqustoShopCatalog && typeof window.EqustoShopCatalog.load === "function") {
      return window.EqustoShopCatalog.load();
    }
    if (window.EqustoEcomData && typeof window.EqustoEcomData.loadEkipmanlar === "function") {
      return window.EqustoEcomData.loadEkipmanlar().then(function (j) {
        if (Array.isArray(j)) return j;
        if (j && Array.isArray(j.items)) return j.items;
        return [];
      });
    }
    return Promise.reject(new Error("katalog yükleyici yok (dept birleşimi)"));
  }

  /** Sitedeki tüm katalog (dept birleşimi) → sepet; üst sınır BULK_MAX_LINES */
  function addAllSiteCatalog(opts) {
    opts = opts || {};
    var cap = opts.maxLines != null ? opts.maxLines : BULK_MAX_LINES;
    return loadSiteCatalog().then(function (all) {
      var arr = opts.replace ? [] : load();
      var added = 0;
      var merged = 0;
      var skipped = 0;
      var capped = 0;
      (all || []).forEach(function (x) {
        var it = itemFromEkipmanlar(x);
        if (!it || (!it.n && !it.b)) {
          skipped += 1;
          return;
        }
        var st = mergeIntoCart(arr, it, { maxLines: cap });
        if (st === 'added') added += 1;
        else if (st === 'merged') merged += 1;
        else if (st === 'full') capped += 1;
        else skipped += 1;
      });
      save(arr);
      syncBadge();
      var total = (all || []).length;
      if (added > 0) {
        toastCartAdded(added > 1 ? added + ' ürün' : '');
      } else {
        var msg =
          (merged
            ? __cartT('cart.bulk_updated', '{n} satır güncellendi', { n: merged })
            : __cartT('cart.bulk_failed', 'Sepete eklenemedi')) +
          (total ? ' · katalog: ' + total : '');
        if (capped) msg += ' · ' + capped + ' kalem sepet sınırı nedeniyle atlandı (max ' + cap + ')';
        toast(msg);
      }
      return { added: added, merged: merged, skipped: skipped, capped: capped, total: total, lines: arr.length };
    });
  }

  /** PFOS teklif satırları → sepet (önce katalog eşlemesi, yoksa satır fiyatı) */
  function addPfosRows(rows, opts) {
    opts = opts || {};
    var list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      toast(__cartT('cart.quote_empty', 'Teklif listesi boş.'));
      return Promise.resolve({ added: 0 });
    }
    function applyRows(catalog) {
      var arr = opts.replace ? [] : load();
      var added = 0;
      var cap = opts.maxLines != null ? opts.maxLines : MAX_LINES;
      list.forEach(function (r) {
        var it = itemFromPfosRow(r);
        if (!it) return;
        if (catalog && catalog.length) {
          var tip = String(r.tip_kodu || '').trim();
          var hit = null;
          if (tip) {
            for (var i = 0; i < catalog.length; i++) {
              var c = catalog[i];
              if (c && String(c.tip_kodu || '').trim() === tip) {
                hit = c;
                break;
              }
            }
          }
          if (!hit && it.n) {
            var nn = it.n.toLocaleLowerCase('tr');
            for (var j = 0; j < catalog.length; j++) {
              var c2 = catalog[j];
              if (!c2 || !c2.name) continue;
              if (String(c2.name).toLocaleLowerCase('tr') === nn) {
                hit = c2;
                break;
              }
            }
          }
          if (hit) {
            var catIt = itemFromEkipmanlar(hit);
            if (catIt) {
              it.n = catIt.n || it.n;
              it.b = catIt.b || it.b;
              it.c = catIt.c || it.c;
              if (catIt.p) it.p = catIt.p;
            }
          }
        }
        var st = mergeIntoCart(arr, it, { maxLines: cap });
        if (st === 'added' || st === 'merged') added += 1;
      });
      save(arr);
      syncBadge();
      if (added > 0) {
        toastCartAdded(added > 1 ? added + ' kalem' : '');
      } else {
        toast(__cartT('cart.full_partial', 'Sepet dolu — bazı kalemler eklenemedi'));
      }
      return { added: added, lines: arr.length };
    }
    if (opts.skipCatalog) return Promise.resolve(applyRows(null));
    return loadSiteCatalog()
      .then(applyRows)
      .catch(function () {
        return applyRows(null);
      });
  }

  function removeLine(id) {
    var arr = load().filter(function (x) {
      return x.id !== id;
    });
    save(arr);
    syncBadge();
    renderPanelList();
  }

  function clearAll() {
    cartClearPending = true;
    cartClearGraceUntil = Date.now() + 60000;
    shopCartPullGen += 1;
    if (shopCartPushTimer) clearTimeout(shopCartPushTimer);
    shopCartPushTimer = null;
    if (syncPushTimer) clearTimeout(syncPushTimer);
    syncPushTimer = null;
    saveLocal([]);
    syncBadge();
    renderPanelList();
    return pushShopCartNow([], { replace: true, clear: true }).then(function (res) {
      cartClearPending = false;
      if (!res || !res.ok) {
        toast(__cartT('cart.clear_failed', 'Sepet sunucuda temizlenemedi — tekrar deneyin.'));
        shopCartPull({ force: true });
        return false;
      }
      saveLocal(normalizeCart(res.items || []));
      syncBadge();
      renderPanelList();
      shopCartPulled = true;
      sessionCartPulled = true;
      lastSyncAt = Date.now();
      cartClearGraceUntil = Date.now() + 8000;
      return true;
    });
  }

  function buildWaText() {
    var arr = load();
    if (!arr.length) return '';
    var lines = [__cartT('cart.wa_intro', 'Merhaba, equsto.com sepetimden yazıyorum:'), '', __cartT('cart.wa_products', 'Ürünler:')];
    arr.forEach(function (x, i) {
      var qty = x.q > 1 ? ' (x' + x.q + ')' : '';
      var price = String(x.p || '').trim();
      if (x.quote || isQuotePriceLabel(price)) {
        lines.push(i + 1 + '. ' + x.n + ' — ' + x.b + ' — ' + price + qty);
      } else {
        lines.push(i + 1 + '. ' + x.n + ' — ' + x.b + ' — ' + x.c + ' — ₺' + price + qty);
      }
    });
    lines.push(
      '',
      __cartT('cart.wa_line_types', 'Kalem çeşidi: {n}', { n: arr.length }) +
        (cartIsQuoteOnly(arr) ? '' : __cartT('cart.wa_total_qty', ' · Toplam adet: {q}', { q: totalQty(arr) }))
    );
    var faturaLine = formatFaturaNote(readFaturaForm());
    if (faturaLine) {
      lines.push('', faturaLine);
    }
    return lines.join('\n');
  }

  function openWhatsApp() {
    var text = buildWaText();
    if (!text) {
      toast(__cartT('cart.empty', 'Sepet boş.'));
      return;
    }
    var phone = resolveWaDigits();
    if (window.equstoOpenWhatsAppWebWindow && phone) {
      window.equstoOpenWhatsAppWebWindow(phone, text);
      dismissCartUi();
      return;
    }
    if (!phone) {
      window.alert(
        'WhatsApp numarası ayarlı değil.\n\nYönetici: public/contact.js içinde EQUSTO_WHATSAPP_E164.'
      );
      return;
    }
    if (typeof window.equstoOpenWhatsApp === 'function') {
      window.EQUSTO_WHATSAPP_TEXT = text;
      window.equstoOpenWhatsApp(null);
      dismissCartUi();
      return;
    }
    toast(__cartT('cart.wa_unavailable', 'Sohbet kartı yüklenemedi.'));
  }

  function cartPageHref() {
    if (typeof window.equstoUrl === 'function') return window.equstoUrl('cart');
    return '/sepet';
  }

  function isCartPage() {
    return !!document.getElementById('equsto-cart-page');
  }

  function isCheckoutPage() {
    return !!document.getElementById('equsto-checkout-page');
  }

  function isCartSurface() {
    return isCartPage() || isCheckoutPage();
  }

  function cartListRoot() {
    return document.getElementById('equsto-cart-scroll') || document.getElementById('equsto-checkout-lines');
  }

  function checkoutPageHref() {
    var path = String(location.pathname || '');
    if (path.indexOf('/en/') === 0) return '/en/odeme';
    return '/odeme';
  }

  function goToCheckout() {
    if (!load().length) {
      toast('Sepet boş.');
      return;
    }
    location.href = checkoutPageHref();
  }

  function goToCartPage() {
    var target = cartPageHref();
    try {
      var cur = String(location.pathname || '').replace(/\/+$/, '') || '/';
      var norm = String(target).replace(/\/+$/, '') || '/';
      if (cur === norm || /\/sepet\.html$/i.test(cur)) {
        renderPanelList();
        updateCartSummary();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    } catch (_) {}
    location.href = target;
  }

  function formatMoneyTL(n) {
    if (!Number.isFinite(n) || n <= 0) return '—';
    try {
      return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (_) {
      return String(n);
    }
  }

  function lineUnitNum(x) {
    if (x && (x.quote || isQuotePriceLabel(x.p))) return 0;
    return parsePriceNum(x && x.p);
  }

  function lineTotalNum(x) {
    var u = lineUnitNum(x);
    var q = x && x.q > 0 ? x.q : 1;
    return u > 0 ? u * q : 0;
  }

  function cartIsQuoteOnly(arr) {
    if (!arr || !arr.length) return false;
    for (var i = 0; i < arr.length; i++) {
      if (!arr[i].quote && !isQuotePriceLabel(arr[i].p)) return false;
    }
    return true;
  }

  function cartSubtotal(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += lineTotalNum(arr[i]);
    return s;
  }

  function cartImgSrc(img) {
    if (!img) return '';
    if (typeof window.eqProductImgSrc === 'function') return window.eqProductImgSrc(img);
    if (typeof window.equstoDataAssetHref === 'function' && /^images\//i.test(img)) {
      return window.equstoDataAssetHref(img);
    }
    return img.charAt(0) === '/' ? img : '/' + String(img).replace(/^\.\//, '');
  }

  function resolveCartItemImg(img) {
    var raw = String(img || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return cartImgSrc(raw.replace(/^\/data\/images\//i, 'images/').replace(/^\//, ''));
  }

  function setLineQty(id, qty) {
    qty = Math.round(Number(qty) || 0);
    if (qty <= 0) {
      removeLine(id);
      return;
    }
    qty = Math.min(99, qty);
    var arr = load();
    var ok = false;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].q = qty;
        ok = true;
        break;
      }
    }
    if (!ok) return;
    save(arr);
    syncBadge();
    renderPanelList();
  }

  function changeLineQty(id, delta) {
    var arr = load();
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        setLineQty(id, (arr[i].q || 1) + delta);
        return;
      }
    }
  }

  function renderQtyControls(x, q) {
    var minus =
      '<button type="button" class="eq-cart-qty__btn equsto-cart-qty-minus" data-id="' +
      escAttr(x.id) +
      '" aria-label="' +
      escAttr(__cartT('cart.remove_line', 'Sepetten kaldır')) +
      '">−</button>';
    return (
      '<div class="eq-cart-qty" role="group" aria-label="' +
      escAttr(__cartT('cart.qty_aria', 'Adet')) +
      '">' +
      minus +
      '<span class="eq-cart-qty__val">' +
      escHtml(String(q)) +
      '</span>' +
      '<button type="button" class="eq-cart-qty__btn equsto-cart-qty-plus" data-id="' +
      escAttr(x.id) +
      '" aria-label="' +
      escAttr(__cartT('cart.increase', 'Artır')) +
      '"' +
      (q >= 99 ? ' disabled' : '') +
      '>+</button></div>'
    );
  }

  function normalizeNameBrandKey(n, b) {
    var name = String(n || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
    var brand = String(b || '')
      .trim()
      .toUpperCase()
      .split(/\s+/)[0];
    return name + '|' + brand;
  }

  function oztiKodFromImgRel(img) {
    var t = String(img || '')
      .trim()
      .replace(/\\/g, '/');
    var m = t.match(/\/ozti-([a-z0-9-]+)\.(?:jpe?g|png|webp)(\?|#|$)/i);
    if (!m) return '';
    return m[1].replace(/-/g, '.').toUpperCase();
  }

  function isEqustoLiveCartHost() {
    try {
      var h = (location.hostname || '').toLowerCase();
      return h === 'equsto.com' || h.slice(-12) === '.equsto.com';
    } catch (_) {
      return false;
    }
  }

  function oztiKodFromCartLine(line) {
    if (!line) return '';
    var c = String(line.c || '').trim();
    if (/^[0-9A-Z]{2,8}\.[A-Z0-9.\-]{2,}$/i.test(c)) return c.toUpperCase();
    var fromImg = oztiKodFromImgRel(line.img);
    if (fromImg) return fromImg;
    var tokens = String(line.n || '').toUpperCase().split(/\s+/);
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (/^[0-9A-Z]{2,8}\.[A-Z0-9.\-]{2,}$/i.test(t)) return t;
      if (/^[0-9]{3,5}\.[A-Z0-9.\-]{2,}$/i.test(t)) return t;
    }
    return '';
  }

  function cartOztiAxSrc(line) {
    var kod = oztiKodFromCartLine(line);
    if (!kod || typeof window.eqOztiAxImageFromSku !== 'function') return '';
    return window.eqOztiAxImageFromSku(kod) || '';
  }

  function cartLineImageSrc(line) {
    if (!line) return '';
    var ax = cartOztiAxSrc(line);
    if (ax && (isEqustoLiveCartHost() || !String(line.img || '').trim())) return ax;
    var raw = String(line.img || '').trim();
    if (!raw) return ax || '';
    if (ax && /catalog\/ozti\//i.test(raw.replace(/\\/g, '/'))) return ax;
    return resolveCartItemImg(raw);
  }

  function cartLineResolvedSrc(line) {
    if (!line) return '';
    var raw = String(line.img || '').trim();
    if (!raw) return '';
    return resolveCartItemImg(raw);
  }

  function cartLineNeedsCatalog(line) {
    if (!line) return false;
    var img = String(line.img || '').trim();
    if (!img) return true;
    if (isEqustoLiveCartHost() && /^https:\/\/oztiryakiler\.com\.tr\/ax-images\//i.test(img)) return false;
    if (isEqustoLiveCartHost() && /catalog\/ozti\//i.test(img.replace(/\\/g, '/'))) return true;
    return !cartLineResolvedSrc(line);
  }

  function catalogRelFromRow(row) {
    if (!row) return '';
    if (row.images && row.images.length) return String(row.images[0] || '').trim();
    var sku = row.sku || row.urun_kodu || row.model || row.modelCode || '';
    if (sku && typeof window.eqOztiWebRelFromSku === 'function') {
      var relSku = window.eqOztiWebRelFromSku(sku);
      if (relSku) return relSku;
    }
    return String(row.img || row.gorsel_url || '').trim();
  }

  function cartImgFromCatalogRow(row) {
    if (!row) return '';
    var sku = String(row.sku || row.urun_kodu || row.model || '')
      .replace(/\s+/g, '')
      .toUpperCase();
    if (sku && typeof window.eqOztiAxImageFromSku === 'function') {
      var axSku = window.eqOztiAxImageFromSku(sku);
      if (axSku && (isEqustoLiveCartHost() || !row.images || !row.images.length)) return axSku;
    }
    var rel = '';
    if (row.images && row.images.length) rel = String(row.images[0] || '').trim();
    if (!rel && typeof window.eqOztiWebRelFromSku === 'function') {
      rel = window.eqOztiWebRelFromSku(sku) || '';
    }
    if (!rel && sku && typeof window.eqOztiAxImageFromSku === 'function') {
      var ax = window.eqOztiAxImageFromSku(sku);
      if (ax) return ax;
    }
    if (!rel) return '';
    if (isEqustoLiveCartHost() && /catalog\/ozti\//i.test(rel)) {
      var axLive = cartOztiAxSrc({ img: rel, c: sku });
      if (axLive) return axLive;
    }
    if (typeof window.eqProductImgSrc === 'function') {
      try {
        return resolveCartItemImg(window.eqProductImgSrc(rel));
      } catch (eRel) {}
    }
    return resolveCartItemImg(rel);
  }

  function enrichCartLineImagesFromCatalog(arr, catalog) {
    if (!Array.isArray(catalog) || !catalog.length || !arr || !arr.length) return false;
    var byId = Object.create(null);
    var byNameBrand = Object.create(null);
    for (var ci = 0; ci < catalog.length; ci++) {
      var row = catalog[ci];
      if (!row) continue;
      var n = row.name || row.ad || '';
      var b = row.brand || row.brand_ad || row.marka_ad || '';
      var k = lineId({ c: row.category || row.kategori || '', b: b, n: n });
      if (k && !byId[k]) byId[k] = row;
      var nb = normalizeNameBrandKey(n, b);
      if (nb && !byNameBrand[nb]) byNameBrand[nb] = row;
    }
    var changed = false;
    for (var li = 0; li < arr.length; li++) {
      var line = arr[li];
      if (!line) continue;
      var hit = byId[line.id] || byNameBrand[normalizeNameBrandKey(line.n, line.b)];
      if (!hit) {
        var oz = oztiKodFromCartLine(line);
        if (oz) {
          for (var cj = 0; cj < catalog.length && !hit; cj++) {
            var cr = catalog[cj];
            if (!cr) continue;
            var cs = String(cr.sku || cr.urun_kodu || cr.model || '').toUpperCase();
            if (cs === oz) hit = cr;
          }
        }
      }
      if (hit && !line.href) {
        var href = hrefFromCatalogRow(hit);
        if (href) {
          line.href = href;
          changed = true;
        }
      }
      if (!cartLineNeedsCatalog(line)) continue;
      if (!hit) continue;
      var imgUrl = cartImgFromCatalogRow(hit);
      if (imgUrl) {
        line.img = imgUrl;
        changed = true;
        continue;
      }
      var rel = catalogRelFromRow(hit);
      if (rel) {
        line.img = rel.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/data\/images\//i, 'images/');
        changed = true;
      }
    }
    return changed;
  }

  function enrichCartLineImages(arr) {
    var changed = false;
    for (var i = 0; i < arr.length; i++) {
      var line = arr[i];
      if (!line) continue;
      if (!cartLineNeedsCatalog(line)) continue;
      var oz = oztiKodFromCartLine(line);
      if (oz && typeof window.eqOztiAxImageFromSku === 'function') {
        var axSku = window.eqOztiAxImageFromSku(oz);
        if (axSku) {
          line.img = axSku;
          changed = true;
          continue;
        }
      }
      if (oz && !isEqustoLiveCartHost() && typeof window.eqOztiWebRelFromSku === 'function') {
        var relOz = window.eqOztiWebRelFromSku(oz);
        if (relOz) {
          line.img = relOz;
          changed = true;
          continue;
        }
      }
    }
    if (changed) saveLocal(arr);
    return arr;
  }

  function renderCartLineHtml(x) {
    var q = x.q > 0 ? x.q : 1;
    var isQuote = !!(x.quote || isQuotePriceLabel(x.p));
    var unit = lineUnitNum(x);
    var total = lineTotalNum(x);
    var rawRel = String(x.img || '')
      .replace(/\\/g, '/')
      .replace(/^\.\//, '')
      .replace(/^\/data\/images\//i, 'images/')
      .replace(/^\//, '');
    if (rawRel && !/^images\//i.test(rawRel) && /\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(rawRel)) {
      rawRel = 'images/' + rawRel;
    }
    var ozKod = oztiKodFromCartLine(x);
    var src = cartLineImageSrc(x);
    if (!src && rawRel && typeof window.equstoDataAssetHref === 'function') {
      try {
        src = resolveCartItemImg(window.equstoDataAssetHref(rawRel));
      } catch (eImg) {}
    }
    if (!src && typeof window.eqProductImgSrc === 'function' && rawRel) {
      try {
        src = window.eqProductImgSrc(rawRel);
      } catch (eProd) {}
    }
    var media = src
      ? '<img src="' +
        escAttr(src) +
        '"' +
        (rawRel ? ' data-eq-img-raw="' + escAttr(rawRel) + '" data-eq-img-step="0"' : '') +
        (ozKod ? ' data-eq-ozti-kod="' + escAttr(ozKod) + '"' : '') +
        ' alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
      : '<span class="eq-cart-line__ph" aria-hidden="true">📦</span>';
    var unitLbl = isQuote
      ? ''
      : unit > 0
        ? '₺' + formatMoneyTL(unit) + ' / adet'
        : 'Fiyat için teklif';
    var totalLbl = isQuote ? '' : total > 0 ? '₺' + formatMoneyTL(total) : '';
    var totalBlock = isQuote
      ? '<div class="eq-cart-line__total eq-cart-line__total--quote">' +
        escHtml(__cartT('cart.quote_for_contact', 'Teklif için iletişim')) +
        '</div>'
      : '<div class="eq-cart-line__total">' + escHtml(totalLbl || '—') + '</div>';
    var qtyHtml = renderQtyControls(x, q);
    var href = String(x.href || '').trim();
    var nameInner = escHtml(x.n);
    var nameHtml = href
      ? '<a class="eq-cart-line__name" href="' + escAttr(href) + '">' + nameInner + '</a>'
      : '<div class="eq-cart-line__name">' + nameInner + '</div>';
    var mediaHtml = href
      ? '<a class="eq-cart-line__media" href="' + escAttr(href) + '">' + media + '</a>'
      : '<div class="eq-cart-line__media">' + media + '</div>';
    return (
      '<article class="eq-cart-line' +
      (isQuote ? ' eq-cart-line--quote' : '') +
      '" data-cart-id="' +
      escAttr(x.id) +
      '">' +
      mediaHtml +
      '<div class="eq-cart-line__main">' +
      '<div class="eq-cart-line__row eq-cart-line__row--head">' +
      nameHtml +
      totalBlock +
      '</div>' +
      '<div class="eq-cart-line__meta">' +
      escHtml(x.b) +
      (isQuote ? ' · ' + escHtml(__cartT('cart.quote_line_hint', 'Teklif kalemi')) : '') +
      '</div>' +
      '<div class="eq-cart-line__row eq-cart-line__row--foot' +
      (isQuote ? ' eq-cart-line__row--quote-foot' : '') +
      '">' +
      (unitLbl
        ? '<div class="eq-cart-line__unit">' + escHtml(unitLbl) + '</div>'
        : '') +
      '<div class="eq-cart-line__actions">' +
      qtyHtml +
      '<button type="button" class="eq-cart-line__remove equsto-cart-remove" data-id="' +
      escAttr(x.id) +
      '">Sil</button>' +
      '</div></div></div></article>'
    );
  }

  function renderSummaryRows() {
    var nodes = [
      document.getElementById('equsto-cart-summary-rows'),
      document.getElementById('equsto-checkout-summary-rows'),
    ].filter(Boolean);
    if (!nodes.length) return;
    var arr = load();
    var html = '';
    if (arr.length) {
      var sub = cartSubtotal(arr);
      if (cartIsQuoteOnly(arr)) {
        html =
          '<li><span>' +
          escHtml(__cartT('cart.quote_line_label', 'Teklif kalemi')) +
          '</span><span>' +
          escHtml(String(arr.length)) +
          '</span></li>';
      } else {
        html =
          '<li><span>' +
          escHtml(__cartT('cart.subtotal_n', 'Ara toplam ({n} kalem)', { n: arr.length })) +
          '</span><span>₺' +
          escHtml(formatMoneyTL(sub)) +
          '</span></li>' +
          '<li><span>' +
          escHtml(__cartT('cart.total_qty_label', 'Toplam adet')) +
          '</span><span>' +
          escHtml(String(totalQty(arr))) +
          '</span></li>' +
          '<li class="eq-cart-summary-rows__total"><span>' +
          escHtml(__cartT('cart.grand_total', 'Genel toplam')) +
          '</span><span>₺' +
          escHtml(formatMoneyTL(sub)) +
          '</span></li>';
      }
    }
    nodes.forEach(function (rowsEl) {
      if (rowsEl.id === 'equsto-checkout-summary-rows' && arr.length && !cartIsQuoteOnly(arr)) {
        var sum = cartSubtotal(arr);
        rowsEl.innerHTML =
          '<li><span>Ara toplam</span><span>₺' +
          escHtml(formatMoneyTL(sum)) +
          '</span></li>' +
          '<li class="eq-cart-summary-rows__total"><span>Genel toplam</span><span>₺' +
          escHtml(formatMoneyTL(sum)) +
          '</span></li>';
        return;
      }
      rowsEl.innerHTML = html;
    });
  }

  function updateCartSummary() {
    var arr = load();
    var head = document.getElementById('equsto-cart-summary');
    if (head) {
      if (!arr.length) {
        head.textContent = '';
        head.hidden = true;
      } else {
        head.hidden = false;
        head.textContent = __cartT('cart.lines_summary', '{n} kalem · {q} adet', {
          n: arr.length,
          q: totalQty(arr),
        });
      }
    }
    var aside = document.getElementById('equsto-cart-aside');
    if (aside) aside.classList.toggle('is-empty', !arr.length);
    renderSummaryRows();
  }

  function dismissCartUi() {
    if (!isCartPage()) closePanel();
  }

  function bindCartLineEvents(root) {
    if (!root) return;
    root.querySelectorAll('.equsto-cart-qty-minus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeLineQty(btn.getAttribute('data-id'), -1);
      });
    });
    root.querySelectorAll('.equsto-cart-qty-plus').forEach(function (btn) {
      btn.addEventListener('click', function () {
        changeLineQty(btn.getAttribute('data-id'), 1);
      });
    });
    root.querySelectorAll('.equsto-cart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeLine(btn.getAttribute('data-id'));
      });
    });
    if (typeof window.eqFixDataImagesInDom === 'function') window.eqFixDataImagesInDom(root);
    root.querySelectorAll('.eq-cart-line__media img').forEach(function (imgEl) {
      if (imgEl.getAttribute('data-eq-cart-img-bound') === '1') return;
      imgEl.setAttribute('data-eq-cart-img-bound', '1');
      imgEl.addEventListener('error', function () {
        if (typeof window.__eqImgFail === 'function') window.__eqImgFail(imgEl);
        var media = imgEl.closest('.eq-cart-line__media');
        if (!media || media.querySelector('.eq-cart-line__ph')) return;
        imgEl.style.display = 'none';
        var ph = document.createElement('span');
        ph.className = 'eq-cart-line__ph';
        ph.setAttribute('aria-hidden', 'true');
        ph.textContent = '📦';
        media.appendChild(ph);
      });
    });
  }

  function renderPanelList() {
    var sc = cartListRoot();
    if (!sc) return;
    var arr = enrichCartLineImages(load());
    var needsCatalog = isCartPage();
    if (!needsCatalog) {
      for (var ni = 0; ni < arr.length; ni++) {
        if (cartLineNeedsCatalog(arr[ni])) {
          needsCatalog = true;
          break;
        }
      }
    }
    if (
      needsCatalog &&
      !renderPanelList._catalogPending &&
      window.EqustoEcomData &&
      typeof window.EqustoEcomData.loadEkipmanlar === 'function'
    ) {
      renderPanelList._catalogPending = true;
      window.EqustoEcomData.loadEkipmanlar()
        .then(function (catalog) {
          renderPanelList._catalogPending = false;
          var latest = enrichCartLineImages(load());
          if (enrichCartLineImagesFromCatalog(latest, catalog)) save(latest);
          renderPanelListInner(enrichCartLineImages(load()));
        })
        .catch(function () {
          renderPanelList._catalogPending = false;
          renderPanelListInner(arr);
        });
      return;
    }
    renderPanelListInner(arr);
  }

  function renderCheckoutMiniHtml(x) {
    var q = x.q > 0 ? x.q : 1;
    var total = lineTotalNum(x);
    var src = '';
    try {
      src = cartLineImageSrc(x) || '';
    } catch (eImg) {
      src = '';
    }
    var media = src
      ? '<img src="' + escAttr(src) + '" alt="" />'
      : '<span class="eq-pay-line__ph" aria-hidden="true"></span>';
    var price = total > 0 ? formatMoneyTL(total) + ' TL' : 'Teklif';
    return (
      '<article class="eq-pay-line">' +
      '<div class="eq-pay-line__media">' +
      media +
      '</div>' +
      '<div class="eq-pay-line__body">' +
      '<div class="eq-pay-line__name">' +
      escHtml(x.n) +
      '</div>' +
      '<div class="eq-pay-line__meta">' +
      escHtml(x.b || '') +
      '</div>' +
      '<div class="eq-pay-line__qty">' +
      escHtml(String(q)) +
      ' adet</div>' +
      '<div class="eq-pay-line__price">' +
      escHtml(price) +
      '</div></div></article>'
    );
  }

  function renderPanelListInner(arr) {
    var sc = cartListRoot();
    if (!sc) return;
    if (!arr.length) {
      sc.innerHTML =
        '<div class="eq-cart-empty">' +
        '<div class="eq-cart-empty__icon" aria-hidden="true">🛒</div>' +
        '<h2 class="eq-cart-empty__title">' +
        escHtml(__cartT('cart.empty_title', 'Sepetiniz boş')) +
        '</h2>' +
        '<p class="eq-cart-empty__text">' +
        escHtml(__cartT('cart.empty_text', 'Katalogdan ürün ekleyerek teklif veya sipariş talebi oluşturabilirsiniz.')) +
        '</p>' +
        '<a href="/" class="eq-cart-btn eq-cart-btn--primary">' +
        escHtml(__cartT('cart.start_shopping', 'Alışverişe başla')) +
        '</a>' +
        '</div>';
      updateCartSummary();
      updatePanelMode();
      return;
    }
    var mini = sc.id === 'equsto-checkout-lines';
    if (mini) sc.classList.remove('eq-cart-lines');
    else sc.classList.add('eq-cart-lines');
    sc.innerHTML = arr.map(mini ? renderCheckoutMiniHtml : renderCartLineHtml).join('');
    if (!mini) bindCartLineEvents(sc);
    if (typeof window.eqFixDataImagesInDom === 'function') window.eqFixDataImagesInDom(sc);
    updateCartSummary();
    updatePanelMode();
  }

  function pairCreateCode() {
    var btn = document.getElementById('eq-cart-pair-gen-btn');
    var disp = document.getElementById('eq-cart-pair-code-display');
    var valEl = document.getElementById('eq-cart-pair-code-val');
    if (btn) btn.disabled = true;
    var payload = shopCartPayload({ action: 'create' });
    fetch('/api/shop/cart/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success && j.code) {
          if (disp && valEl) {
            valEl.textContent = j.code;
            disp.style.display = 'inline-block';
            disp.removeAttribute('hidden');

            var syncUrl = location.origin + '/sepet?sync=' + j.code;
            var qrImg = document.getElementById('eq-cart-pair-qr-img');
            if (qrImg) {
              qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(syncUrl);
              qrImg.style.display = 'block';
            }
            var waBtn = document.getElementById('eq-cart-pair-wa-btn');
            if (waBtn) {
              waBtn.href = 'https://wa.me/?text=' + encodeURIComponent('Equsto sepetimi bu cihazla eşleştirmek için tıklayın: ' + syncUrl);
            }
          }
        } else {
          alert('Kod oluşturulamadı: ' + (j && j.error || 'Bilinmeyen hata'));
        }
      })
      .catch(function () {
        alert('Sunucu hatası, lütfen tekrar deneyin.');
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function pairJoinCode(code) {
    var btn = document.getElementById('eq-cart-pair-join-btn');
    var statusEl = document.getElementById('eq-cart-pair-status');
    if (btn) btn.disabled = true;
    if (statusEl) {
      statusEl.textContent = 'Eşleştiriliyor...';
      statusEl.className = 'eq-cart-sync__msg eq-cart-sync__msg--ok';
      statusEl.removeAttribute('hidden');
      statusEl.style.display = 'block';
    }
    fetch('/api/shop/cart/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'join', code: code })
    })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j && j.success) {
          if (j.syncToken) {
            setSyncToken(j.syncToken);
            document.cookie = 'equsto_cart_sync=' + j.syncToken + '; Path=/; Max-Age=31536000; Secure; SameSite=Lax';
          }
          saveLocal(Array.isArray(j.items) ? j.items : []);
          syncBadge();
          if (statusEl) {
            statusEl.textContent = 'Başarıyla eşleştirildi! Sayfa yenileniyor...';
            statusEl.className = 'eq-cart-sync__msg eq-cart-sync__msg--ok';
          }
          setTimeout(function () {
            location.reload();
          }, 1200);
        } else {
          if (statusEl) {
            statusEl.textContent = 'Hata: ' + (j && j.error || 'Kod geçersiz');
            statusEl.className = 'eq-cart-sync__msg eq-cart-sync__msg--err';
          }
        }
      })
      .catch(function () {
        if (statusEl) {
          statusEl.textContent = 'Bağlantı hatası, tekrar deneyin.';
          statusEl.className = 'eq-cart-sync__msg eq-cart-sync__msg--err';
        }
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function bindCartPageActions() {
    if (!isCartPage()) return;
    var clearBtn = document.getElementById('equsto-cart-clear');
    if (clearBtn && clearBtn.dataset.eqCartBound !== '1') {
      clearBtn.dataset.eqCartBound = '1';
      clearBtn.addEventListener('click', function () {
        if (
          window.confirm(
            __cartT('cart.confirm_clear', 'Sepetteki tüm ürünleri kaldırmak istiyor musunuz?'),
          )
        ) {
          clearAll();
        }
      });
    }
    var waBtn = document.getElementById('equsto-cart-wa');
    if (waBtn && waBtn.dataset.eqCartBound !== '1') {
      waBtn.dataset.eqCartBound = '1';
      waBtn.addEventListener('click', openWhatsApp);
    }
    var checkoutBtn = document.getElementById('equsto-cart-checkout');
    if (checkoutBtn && checkoutBtn.dataset.eqCartBound !== '1') {
      checkoutBtn.dataset.eqCartBound = '1';
      checkoutBtn.addEventListener('click', goToCheckout);
    }
    var ordBtn = document.getElementById('equsto-cart-order');
    if (ordBtn && ordBtn.dataset.eqCartBound !== '1') {
      ordBtn.dataset.eqCartBound = '1';
      ordBtn.addEventListener('click', submitOrder);
    }
    var payBtn = document.getElementById('equsto-cart-pay');
    if (payBtn && payBtn.dataset.eqCartBound !== '1') {
      payBtn.dataset.eqCartBound = '1';
      payBtn.addEventListener('click', submitPayOrder);
    }
    refreshPayButton();
    var genBtn = document.getElementById('eq-cart-pair-gen-btn');
    if (genBtn && genBtn.dataset.eqCartBound !== '1') {
      genBtn.dataset.eqCartBound = '1';
      genBtn.addEventListener('click', pairCreateCode);
    }
    var joinBtn = document.getElementById('eq-cart-pair-join-btn');
    if (joinBtn && joinBtn.dataset.eqCartBound !== '1') {
      joinBtn.dataset.eqCartBound = '1';
      joinBtn.addEventListener('click', function () {
        var inp = document.getElementById('eq-cart-pair-input');
        var val = inp ? inp.value.trim().toUpperCase() : '';
        if (val.length < 6) {
          alert('Lütfen 6 haneli eşleştirme kodunu girin.');
          return;
        }
        pairJoinCode(val);
      });
    }

    if (window.URLSearchParams) {
      var params = new URLSearchParams(location.search);
      var syncCode = params.get('sync');
      if (syncCode && syncCode.trim().length === 6) {
        var cleanUrl = location.protocol + '//' + location.host + location.pathname;
        history.replaceState({ path: cleanUrl }, '', cleanUrl);
        pairJoinCode(syncCode.trim().toUpperCase());
      }
    }
  }

  function patchCartPanelChrome() {
    var head = document.querySelector('#equsto-cart-panel .eq-cart-drawer__head');
    if (!head || document.getElementById('equsto-cart-panel-title')) return;
    var close = document.getElementById('equsto-cart-close');
    var title = document.createElement('span');
    title.id = 'equsto-cart-panel-title';
    var txt = '';
    for (var i = 0; i < head.childNodes.length; i++) {
      if (head.childNodes[i].nodeType === 3) txt += head.childNodes[i].textContent;
    }
    title.textContent =
      String(txt || __cartT('common.cart', 'Alışveriş sepeti')).trim() ||
      __cartT('common.cart', 'Alışveriş sepeti');
    while (head.firstChild && head.firstChild !== close) head.removeChild(head.firstChild);
    head.insertBefore(title, close || null);
  }

  function updatePanelMode() {
    patchCartPanelChrome();
    var arr = load();
    var quoteOnly = cartIsQuoteOnly(arr);
    var titleEl = document.getElementById('equsto-cart-panel-title');
    if (titleEl)
      titleEl.textContent = quoteOnly
        ? __cartT('cart.quote_list_title', 'Teklif listesi')
        : __cartT('common.cart', 'Alışveriş sepeti');
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) ov.classList.toggle('eq-cart-overlay--quote', quoteOnly);
    var gotoBtn = document.getElementById('equsto-cart-goto-page');
    if (gotoBtn) gotoBtn.hidden = quoteOnly;
    var clearBtn = document.getElementById('equsto-cart-clear');
    if (clearBtn) clearBtn.hidden = quoteOnly;
    var foot = document.querySelector('#equsto-cart-panel .eq-cart-drawer__foot');
    if (foot) foot.classList.toggle('eq-cart-drawer__foot--quote', quoteOnly);
  }

  function ensureOverlay() {
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) return ov;
    injectCartCss();
    ov = document.createElement('div');
    ov.id = 'equsto-cart-overlay';
    ov.className = 'eq-cart-overlay';
    ov.innerHTML =
      '<div id="equsto-cart-panel" class="eq-cart-drawer" role="dialog" aria-label="Alışveriş sepeti">' +
      '<div class="eq-cart-drawer__head"><span id="equsto-cart-panel-title">Alışveriş sepeti</span>' +
      '<button type="button" id="equsto-cart-close" class="eq-cart-drawer__close" aria-label="Kapat">×</button></div>' +
      '<div id="equsto-cart-scroll" class="eq-cart-drawer__body eq-cart-lines"></div>' +
      '<div class="eq-cart-drawer__foot">' +
      '<a href="' +
      escAttr(cartPageHref()) +
      '" class="eq-cart-btn eq-cart-btn--primary" id="equsto-cart-goto-page">Sepete git</a>' +
      '<button type="button" id="equsto-cart-wa" class="eq-cart-btn eq-cart-btn--wa">WhatsApp</button>' +
      '<button type="button" id="equsto-cart-clear" class="eq-cart-btn eq-cart-btn--muted">Temizle</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov) closePanel();
    });
    document.getElementById('equsto-cart-close').addEventListener('click', closePanel);
    document.getElementById('equsto-cart-panel').addEventListener('click', function (e) {
      e.stopPropagation();
    });
    document.getElementById('equsto-cart-clear').addEventListener('click', function () {
      if (window.confirm('Sepetteki tüm ürünleri kaldırmak istiyor musunuz?')) clearAll();
    });
    document.getElementById('equsto-cart-wa').addEventListener('click', openWhatsApp);
    return ov;
  }

  function eqApiBase() {
    if (typeof window.EQUSTO_API_BASE === 'string') return window.EQUSTO_API_BASE.replace(/\/$/, '');
    var h = (location.hostname || '').toLowerCase();
    if (h === '127.0.0.1' || h === 'localhost') return 'http://127.0.0.1:3001/api';
    return '/api';
  }

  function parsePriceNum(s) {
    if (s == null) return 0;
    var raw = String(s);
    if (/€|eur/i.test(raw)) return 0;
    var t = raw.replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    var n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  }

  function readCheckoutStorage() {
    try {
      var j = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || 'null');
      return j && typeof j === 'object' ? j : null;
    } catch (e) {
      return null;
    }
  }

  function saveCheckoutStorage(data) {
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  var faturaProvinces = [];

  function memberCheckoutDefaults() {
    var m = readMemberFromStorage();
    var saved = readCheckoutStorage() || {};
    var ad = (m && (m.ad || m.displayName || m.name)) || saved.ad || '';
    var eposta = (m && (m.email || m.eposta)) || saved.eposta || '';
    var tel = (m && (m.telefon || m.phone)) || saved.telefon || saved.tel || '';
    return {
      ad: String(ad).trim(),
      tel: String(tel).trim(),
      eposta: String(eposta).trim(),
      not: '',
      kupon: '',
    };
  }

  function readCheckoutForm() {
    return memberCheckoutDefaults();
  }

  function faturaField(id) {
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function faturaTip() {
    var sel = document.getElementById('eq-fatura-tur');
    if (sel && sel.value) return sel.value === 'kurumsal' ? 'kurumsal' : 'bireysel';
    var checked = document.querySelector('input[name="eq-fatura-tip"]:checked');
    return checked && checked.value === 'kurumsal' ? 'kurumsal' : 'bireysel';
  }

  function readFaturaForm() {
    var tip = faturaTip();
    return {
      tip: tip,
      ad: faturaField('eq-fatura-ad'),
      tckn: faturaField('eq-fatura-tckn').replace(/\D/g, ''),
      unvan: faturaField('eq-fatura-unvan'),
      vergi_dairesi: faturaField('eq-fatura-vd'),
      vkn: faturaField('eq-fatura-vkn').replace(/\D/g, ''),
      eposta: faturaField('eq-fatura-eposta'),
      telefon: faturaField('eq-fatura-tel'),
      il: faturaField('eq-fatura-il'),
      ilce: faturaField('eq-fatura-ilce'),
      adres: faturaField('eq-fatura-adres'),
    };
  }

  function formatFaturaNote(f) {
    if (!f) return '';
    var head = '';
    if (f.tip === 'kurumsal') {
      if (!f.unvan && !f.vkn) return '';
      head =
        'Fatura (kurumsal): ' +
        (f.unvan || '—') +
        (f.vergi_dairesi ? ' · VD: ' + f.vergi_dairesi : '') +
        (f.vkn ? ' · VN: ' + f.vkn : '');
    } else {
      if (!f.ad && !f.tckn) return '';
      head = 'Fatura (bireysel): ' + (f.ad || '—') + (f.tckn ? ' · TCKN: ' + f.tckn : '');
    }
    var addr = [f.adres, f.ilce, f.il].filter(Boolean).join(', ');
    return addr ? head + '\n' + addr : head;
  }

  function faturaError(msg) {
    var el =
      document.getElementById('equsto-checkout-error') ||
      document.getElementById('equsto-cart-fatura-error');
    if (!el) {
      if (msg) toast(msg);
      return;
    }
    if (!msg) {
      el.hidden = true;
      el.textContent = '';
      return;
    }
    el.hidden = false;
    el.textContent = msg;
  }

  function validateFatura(f) {
    if (!f) return 'Fatura bilgileri gerekli.';
    if (f.tip === 'kurumsal') {
      if (!f.unvan) return 'Firma ünvanı gerekli.';
      if (!f.vergi_dairesi) return 'Vergi dairesi gerekli.';
      if (!/^\d{10}$/.test(f.vkn)) return 'Vergi numarası 10 haneli olmalı.';
    } else {
      var foreign = document.getElementById('eq-fatura-foreign');
      if (!(foreign && foreign.checked) && !/^\d{11}$/.test(f.tckn)) {
        return 'T.C. kimlik no 11 haneli olmalı.';
      }
    }
    if (!f.eposta || f.eposta.indexOf('@') < 1) return 'Geçerli bir e-posta girin.';
    if (String(f.telefon || '').replace(/\D/g, '').length < 10) return 'Telefon gerekli.';
    if (!f.il || !f.ilce) return 'İl ve ilçe seçin.';
    if (String(f.adres || '').length < 8) return 'Açık adresi yazın.';
    return '';
  }

  function applyFaturaTip() {
    var kurumsal = faturaTip() === 'kurumsal';
    document.querySelectorAll('.eq-cart-fatura__bireysel').forEach(function (el) {
      el.hidden = kurumsal;
    });
    document.querySelectorAll('.eq-cart-fatura__kurumsal').forEach(function (el) {
      el.hidden = !kurumsal;
    });
  }

  function faturaSameAsDelivery() {
    var diff = document.getElementById('eq-fatura-different');
    if (diff) return !diff.checked;
    var el = document.getElementById('eq-fatura-same');
    return !el || !!el.checked;
  }

  function applyFaturaSame() {
    var same = faturaSameAsDelivery();
    document.querySelectorAll('.eq-fatura-address').forEach(function (el) {
      el.hidden = same;
    });
  }

  function readDeliveryForm() {
    return {
      ad: faturaField('eq-teslimat-ad'),
      telefon: faturaField('eq-teslimat-tel'),
      eposta: faturaField('eq-teslimat-eposta'),
      il: faturaField('eq-teslimat-il'),
      ilce: faturaField('eq-teslimat-ilce'),
      adres: faturaField('eq-teslimat-adres'),
      baslik: faturaField('eq-teslimat-baslik'),
      semt: faturaField('eq-teslimat-semt'),
      posta: faturaField('eq-teslimat-posta'),
    };
  }

  function fillFaturaSelect(sel, names, placeholder, selected) {
    if (!sel) return;
    var html = '<option value="">' + escHtml(placeholder) + '</option>';
    (names || []).forEach(function (name) {
      html +=
        '<option value="' +
        escAttr(name) +
        '"' +
        (name === selected ? ' selected' : '') +
        '>' +
        escHtml(name) +
        '</option>';
    });
    sel.innerHTML = html;
    sel.disabled = !names || !names.length;
    if (selected) sel.value = selected;
    syncSearchSelect(sel);
  }

  function trFold(s) {
    return String(s || '')
      .toLocaleLowerCase('tr')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/ı/g, 'i');
  }

  function closeSearchSelects(except) {
    document.querySelectorAll('.eq-pay-combo__pop').forEach(function (pop) {
      if (except && pop === except) return;
      pop.hidden = true;
    });
  }

  function renderSearchSelect(wrap, sel, query) {
    var label = wrap.querySelector('.eq-pay-combo__value');
    var list = wrap.querySelector('.eq-pay-combo__list');
    var btn = wrap.querySelector('.eq-pay-combo__btn');
    if (!label || !list || !btn) return;
    btn.disabled = !!sel.disabled;
    var needle = trFold(String(query || '').trim());
    var current = '';
    var html = '';
    [].forEach.call(sel.options, function (opt) {
      if (!opt.value) return;
      if (opt.value === sel.value) current = opt.textContent;
      if (needle && trFold(opt.textContent).indexOf(needle) < 0) return;
      html +=
        '<li><button type="button" class="eq-pay-combo__opt" data-value="' +
        escAttr(opt.value) +
        '">' +
        escHtml(opt.textContent) +
        '</button></li>';
    });
    var emptyLabel = sel.options[0] ? sel.options[0].textContent : 'Seçin';
    label.textContent = current || emptyLabel;
    list.innerHTML = html || '<li class="eq-pay-combo__empty">Sonuç yok</li>';
  }

  function pickSearchSelect(sel, wrap, value) {
    sel.value = value || '';
    try {
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (e) {
      var ev = document.createEvent('Event');
      ev.initEvent('change', true, true);
      sel.dispatchEvent(ev);
    }
    var pop = wrap.querySelector('.eq-pay-combo__pop');
    if (pop) pop.hidden = true;
    renderSearchSelect(wrap, sel, '');
  }

  function syncSearchSelect(sel) {
    if (!sel || !sel.id || !sel.parentElement) return;
    var wrap = sel.parentElement.querySelector('.eq-pay-combo[data-for="' + sel.id + '"]');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'eq-pay-combo';
      wrap.setAttribute('data-for', sel.id);
      var searchLabel = sel.id.indexOf('ilce') >= 0 ? 'İlçe ara' : 'İl ara';
      wrap.innerHTML =
        '<button type="button" class="eq-pay-combo__btn" aria-haspopup="listbox">' +
        '<span class="eq-pay-combo__value"></span></button>' +
        '<div class="eq-pay-combo__pop" hidden>' +
        '<input class="eq-pay-combo__q" type="search" placeholder="' +
        escAttr(searchLabel) +
        '" aria-label="' +
        escAttr(searchLabel) +
        '" />' +
        '<ul class="eq-pay-combo__list" role="listbox"></ul></div>';
      sel.classList.add('eq-pay-combo-native');
      sel.setAttribute('tabindex', '-1');
      sel.setAttribute('aria-hidden', 'true');
      sel.insertAdjacentElement('afterend', wrap);
      var btn = wrap.querySelector('.eq-pay-combo__btn');
      var pop = wrap.querySelector('.eq-pay-combo__pop');
      var q = wrap.querySelector('.eq-pay-combo__q');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (sel.disabled) return;
        var willOpen = pop.hidden;
        closeSearchSelects();
        if (!willOpen) return;
        pop.hidden = false;
        q.value = '';
        renderSearchSelect(wrap, sel, '');
        q.focus();
      });
      q.addEventListener('input', function () {
        renderSearchSelect(wrap, sel, q.value);
      });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          pop.hidden = true;
          btn.focus();
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          var first = wrap.querySelector('.eq-pay-combo__opt');
          if (first) pickSearchSelect(sel, wrap, first.getAttribute('data-value'));
        }
      });
      wrap.addEventListener('click', function (e) {
        var opt = e.target.closest ? e.target.closest('.eq-pay-combo__opt') : null;
        if (!opt) return;
        e.preventDefault();
        pickSearchSelect(sel, wrap, opt.getAttribute('data-value'));
      });
      if (!document.documentElement.dataset.eqComboDoc) {
        document.documentElement.dataset.eqComboDoc = '1';
        document.addEventListener('click', function (e) {
          if (e.target.closest && e.target.closest('.eq-pay-combo')) return;
          closeSearchSelects();
        });
      }
    }
    renderSearchSelect(wrap, sel, '');
  }

  function faturaProvinceByName(name) {
    var want = String(name || '').trim();
    for (var i = 0; i < faturaProvinces.length; i++) {
      if (faturaProvinces[i] && faturaProvinces[i].name === want) return faturaProvinces[i];
    }
    return null;
  }

  function fillDistrictSelect(ilceId, il, ilce) {
    var sel = document.getElementById(ilceId);
    var province = faturaProvinceByName(il);
    var names = [];
    if (province && province.districts) {
      names = province.districts
        .map(function (d) {
          return d && d.name ? String(d.name) : '';
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return a.localeCompare(b, 'tr');
        });
    }
    fillFaturaSelect(sel, names, il ? 'İlçe seçin' : 'Önce il seçin', ilce || '');
  }

  function provinceNames() {
    return faturaProvinces
      .map(function (p) {
        return p && p.name ? String(p.name) : '';
      })
      .filter(Boolean);
  }

  function fillProvincePair(ilId, ilceId, selectedIl, selectedIlce) {
    fillFaturaSelect(document.getElementById(ilId), provinceNames(), 'Seçin', selectedIl || '');
    fillDistrictSelect(ilceId, selectedIl || '', selectedIlce || '');
  }

  function fillFaturaDistricts(il, ilce) {
    fillDistrictSelect('eq-fatura-ilce', il, ilce);
  }

  function fillFaturaProvinces(selectedIl, selectedIlce) {
    fillProvincePair('eq-fatura-il', 'eq-fatura-ilce', selectedIl, selectedIlce);
  }

  function loadFaturaProvinces(done) {
    if (faturaProvinces.length) {
      if (done) done();
      return;
    }
    fetch('/data/tr-adres.json', { cache: 'force-cache' })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        faturaProvinces = (j && j.provinces) || [];
        faturaProvinces.sort(function (a, b) {
          return String(a.name || '').localeCompare(String(b.name || ''), 'tr');
        });
      })
      .catch(function () {
        faturaProvinces = [];
      })
      .finally(function () {
        if (done) done();
      });
  }

  function memberAddressDefaults() {
    var m = readMemberFromStorage();
    var raw = m && (m.teslimatAdres || m.teslimat_adres);
    if (!raw || typeof raw !== 'object') return { il: '', ilce: '', adres: '' };
    var addr = raw;
    if (Array.isArray(raw.addresses)) {
      var picked = null;
      for (var i = 0; i < raw.addresses.length; i++) {
        if (raw.addresses[i] && raw.addresses[i].id === raw.defaultAddressId) picked = raw.addresses[i];
      }
      addr = picked || raw.addresses[0] || {};
    }
    return {
      il: String(addr.il || '').trim(),
      ilce: String(addr.ilce || '').trim(),
      adres: String(addr.acikAdres || addr.acik_adres || '').trim(),
    };
  }

  function setFaturaField(id, value) {
    var el = document.getElementById(id);
    if (!el || value == null) return;
    if (!String(el.value || '').trim()) el.value = value;
  }

  function setFieldValue(id, value) {
    var el = document.getElementById(id);
    if (!el || value == null) return;
    el.value = value;
  }

  function persistFaturaForm() {
    if (!document.getElementById('equsto-checkout-page')) return;
    var d = readDeliveryForm();
    var tip = faturaTip();
    saveCheckoutStorage({
      ad: d.ad,
      telefon: d.telefon,
      eposta: d.eposta,
      teslimat: d,
      faturaSame: faturaSameAsDelivery(),
      fatura: {
        tip: tip,
        ad: faturaField('eq-fatura-ad'),
        tckn: faturaField('eq-fatura-tckn').replace(/\D/g, ''),
        unvan: faturaField('eq-fatura-unvan'),
        vergi_dairesi: faturaField('eq-fatura-vd'),
        vkn: faturaField('eq-fatura-vkn').replace(/\D/g, ''),
        il: faturaField('eq-fatura-il'),
        ilce: faturaField('eq-fatura-ilce'),
        adres: faturaField('eq-fatura-adres'),
      },
    });
  }

  function bindCheckoutUi() {
    var root = document.getElementById('equsto-checkout-page');
    if (!root || root.dataset.eqFaturaBound === '1') return;
    root.dataset.eqFaturaBound = '1';
    root.querySelectorAll('input[name="eq-fatura-tip"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        applyFaturaTip();
        persistFaturaForm();
      });
    });
    var turSel = document.getElementById('eq-fatura-tur');
    if (turSel) {
      turSel.addEventListener('change', function () {
        applyFaturaTip();
        persistFaturaForm();
      });
    }
    var diff = document.getElementById('eq-fatura-different');
    if (diff) {
      diff.addEventListener('change', function () {
        var sameBox = document.getElementById('eq-fatura-same');
        if (sameBox) sameBox.checked = !diff.checked;
        applyFaturaSame();
        persistFaturaForm();
      });
    }
    var same = document.getElementById('eq-fatura-same');
    if (same) {
      same.addEventListener('change', function () {
        applyFaturaSame();
        persistFaturaForm();
      });
    }
    var il = document.getElementById('eq-fatura-il');
    if (il) {
      il.addEventListener('change', function () {
        fillFaturaDistricts(il.value, '');
        persistFaturaForm();
      });
    }
    var teslimatIl = document.getElementById('eq-teslimat-il');
    if (teslimatIl) {
      teslimatIl.addEventListener('change', function () {
        fillDistrictSelect('eq-teslimat-ilce', teslimatIl.value, '');
        persistFaturaForm();
      });
    }
    root.querySelectorAll('input[name="eq-odeme-yontem"]').forEach(function (inp) {
      inp.addEventListener('change', updatePlaceLabel);
    });
    root.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('change', persistFaturaForm);
      if (el.tagName !== 'SELECT') el.addEventListener('input', persistFaturaForm);
    });
    applyFaturaTip();
    applyFaturaSame();
  }

  function applySavedAddress(addr) {
    if (!addr) return;
    loadFaturaProvinces(function () {
      fillProvincePair('eq-teslimat-il', 'eq-teslimat-ilce', addr.il || '', addr.ilce || '');
      setFieldValue('eq-teslimat-adres', addr.adres || addr.acikAdres || '');
    });
  }

  function renderSavedAddress(addr) {
    var box = document.getElementById('equsto-checkout-saved');
    if (box) box.hidden = true;
    if (addr && addr.il) applySavedAddress(addr);
  }

  function prefillCheckoutForm() {
    if (!document.getElementById('equsto-checkout-page')) return;
    var base = memberCheckoutDefaults();
    var saved = readCheckoutStorage() || {};
    var savedF = saved.fatura && typeof saved.fatura === 'object' ? saved.fatura : {};
    var savedD = saved.teslimat && typeof saved.teslimat === 'object' ? saved.teslimat : {};
    var addr = memberAddressDefaults();
    var tip = savedF.tip === 'kurumsal' ? 'kurumsal' : 'bireysel';
    var tur = document.getElementById('eq-fatura-tur');
    if (tur) tur.value = tip;
    var tipInput = document.querySelector('input[name="eq-fatura-tip"][value="' + tip + '"]');
    if (tipInput) tipInput.checked = true;
    var diffEl = document.getElementById('eq-fatura-different');
    if (diffEl && saved.faturaSame === false) diffEl.checked = true;
    var sameEl = document.getElementById('eq-fatura-same');
    if (sameEl && saved.faturaSame === false) sameEl.checked = false;
    applyFaturaTip();
    applyFaturaSame();
    setFaturaField('eq-teslimat-ad', savedD.ad || base.ad);
    setFaturaField('eq-teslimat-tel', savedD.telefon || base.tel);
    setFaturaField('eq-teslimat-eposta', savedD.eposta || base.eposta);
    setFaturaField('eq-teslimat-adres', savedD.adres || addr.adres);
    setFaturaField('eq-fatura-ad', savedF.ad || base.ad);
    setFaturaField('eq-fatura-tckn', savedF.tckn || '');
    setFaturaField('eq-fatura-unvan', savedF.unvan || '');
    setFaturaField('eq-fatura-vd', savedF.vergi_dairesi || '');
    setFaturaField('eq-fatura-vkn', savedF.vkn || '');
    setFaturaField('eq-fatura-adres', savedF.adres || '');
    var login = document.getElementById('equsto-checkout-login');
    if (login) {
      login.hidden = isLoggedIn();
      var a = login.querySelector('a');
      if (a) a.href = '/login?next=' + encodeURIComponent(checkoutPageHref());
    }
    loadFaturaProvinces(function () {
      fillProvincePair(
        'eq-teslimat-il',
        'eq-teslimat-ilce',
        savedD.il || addr.il || '',
        savedD.ilce || addr.ilce || ''
      );
      fillProvincePair('eq-fatura-il', 'eq-fatura-ilce', savedF.il || '', savedF.ilce || '');
    });
    var token = authToken();
    if (!token) return;
    fetch('/api/auth/me', {
      headers: {
        Authorization: 'Bearer ' + token,
        'X-Equsto-Authorization': token,
      },
      cache: 'no-store',
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (j) {
        var user = j && j.user;
        if (!user) return;
        setFaturaField('eq-teslimat-ad', user.name || user.ad || '');
        setFaturaField('eq-teslimat-eposta', user.email || '');
        setFaturaField('eq-teslimat-tel', user.telefon || user.phone || '');
        var book = user.teslimatAdres || {};
        if (book.il) {
          renderSavedAddress({
            il: book.il,
            ilce: book.ilce,
            acikAdres: book.acikAdres || book.acik_adres || '',
          });
        }
      })
      .catch(function () {});
  }

  function collectCheckoutContact() {
    if (!document.getElementById('equsto-checkout-page')) {
      var legacy = readCheckoutForm();
      if (!legacy.ad || !legacy.tel) {
        toast(
          !legacy.tel
            ? __cartT('cart.phone_required_account', 'Telefon gerekli — Hesabım sayfasından ekleyin.')
            : __cartT('cart.name_required', 'Ad soyad gerekli.')
        );
        return null;
      }
      return {
        ad: legacy.ad,
        tel: legacy.tel,
        eposta: legacy.eposta,
        not: legacy.not || '',
        fatura: null,
      };
    }
    var d = readDeliveryForm();
    if (!d.ad) {
      faturaError('Teslimat için ad soyad gerekli.');
      return null;
    }
    var same = faturaSameAsDelivery();
    var tip = faturaTip();
    var fatura = {
      tip: tip,
      ad: same ? d.ad : faturaField('eq-fatura-ad') || d.ad,
      telefon: d.telefon,
      eposta: d.eposta,
      il: same ? d.il : faturaField('eq-fatura-il'),
      ilce: same ? d.ilce : faturaField('eq-fatura-ilce'),
      adres: same ? d.adres : faturaField('eq-fatura-adres'),
      tckn: tip === 'bireysel' ? faturaField('eq-fatura-tckn').replace(/\D/g, '') : '',
      unvan: tip === 'kurumsal' ? faturaField('eq-fatura-unvan') : '',
      vergi_dairesi: tip === 'kurumsal' ? faturaField('eq-fatura-vd') : '',
      vkn: tip === 'kurumsal' ? faturaField('eq-fatura-vkn').replace(/\D/g, '') : '',
      yabanci: !!(document.getElementById('eq-fatura-foreign') && document.getElementById('eq-fatura-foreign').checked),
    };
    var err = validateFatura(fatura);
    if (err) {
      faturaError(err);
      showCheckoutStep('adres');
      var box = document.getElementById('equsto-checkout-error');
      if (box && box.scrollIntoView) {
        try {
          box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (_) {}
      }
      return null;
    }
    faturaError('');
    persistFaturaForm();
    var ad = fatura.tip === 'kurumsal' ? fatura.unvan : d.ad;
    var note = formatFaturaNote(fatura);
    var ship = [d.adres, d.semt, d.ilce, d.il, d.posta].filter(Boolean).join(', ');
    if (d.baslik) note = 'Adres: ' + d.baslik + (note ? '\n' + note : '');
    if (ship) note = 'Teslimat: ' + ship + (note ? '\n' + note : '');
    return {
      ad: ad,
      tel: d.telefon,
      eposta: d.eposta,
      not: note,
      fatura: fatura,
      teslimat: d,
    };
  }

  function attachFaturaPayload(payload, contact) {
    if (!contact) return payload;
    var ship = contact.teslimat || contact.fatura;
    if (ship) {
      var adres = [ship.adres, ship.ilce, ship.il].filter(Boolean).join(', ');
      payload.adres = adres;
      payload.teslimat_adres = adres;
      payload.sehir = ship.il || '';
      if (contact.teslimat) payload.teslimat = contact.teslimat;
    }
    if (contact.fatura) payload.fatura = contact.fatura;
    return payload;
  }

  function placeButtonLabel() {
    var kart = document.getElementById('eq-odeme-kart');
    var wrap = document.getElementById('eq-odeme-kart-label');
    if (kart && kart.checked && wrap && !wrap.hidden) return 'Ödemeye geç';
    return 'Sipariş talebini gönder';
  }

  function updatePlaceLabel() {
    var btn = document.getElementById('equsto-checkout-place');
    if (btn && !btn.disabled) btn.textContent = placeButtonLabel();
  }

  function showCheckoutStep(step) {
    ['ozet', 'adres', 'odeme'].forEach(function (name) {
      var panel = document.getElementById('eq-step-' + name);
      if (panel) panel.hidden = name !== step;
      var btn = document.querySelector('.eq-pay-steps__btn[data-eq-step="' + name + '"]');
      if (btn) btn.classList.toggle('is-on', name === step);
    });
    try {
      var url = new URL(location.href);
      if (step === 'odeme') url.searchParams.set('adim', 'odeme');
      else url.searchParams.delete('adim');
      history.replaceState({}, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function saveAddressAndContinue() {
    if (!load().length) {
      toast('Sepet boş.');
      return;
    }
    if (!collectCheckoutContact()) return;
    saveMemberDelivery();
    showCheckoutStep('odeme');
    var panel = document.getElementById('eq-step-odeme');
    if (panel && panel.scrollIntoView) {
      try {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch (e) {}
    }
  }

  function placeCheckout() {
    if (!load().length) {
      toast('Sepet boş.');
      return;
    }
    var soz = document.getElementById('eq-sozlesme');
    if (soz && !soz.checked) {
      faturaError('Sipariş için şartlar ve koşullar onayı gerekli.');
      showCheckoutStep('odeme');
      return;
    }
    var kart = document.getElementById('eq-odeme-kart');
    var wrap = document.getElementById('eq-odeme-kart-label');
    if (kart && kart.checked && wrap && !wrap.hidden) submitPayOrder();
    else submitOrder();
  }

  function bindCheckoutPage() {
    if (!isCheckoutPage()) return;
    bindCheckoutUi();
    var saveBtn = document.getElementById('eq-adres-kaydet');
    if (saveBtn && saveBtn.dataset.eqCartBound !== '1') {
      saveBtn.dataset.eqCartBound = '1';
      saveBtn.addEventListener('click', saveAddressAndContinue);
    }
    document.querySelectorAll('.eq-pay-steps__btn').forEach(function (btn) {
      if (btn.dataset.eqStepBound === '1') return;
      btn.dataset.eqStepBound = '1';
      btn.addEventListener('click', function () {
        var step = btn.getAttribute('data-eq-step') || 'adres';
        if (step === 'odeme' && !collectCheckoutContact()) return;
        showCheckoutStep(step);
      });
    });
    var place = document.getElementById('equsto-checkout-place');
    if (place && place.dataset.eqCartBound !== '1') {
      place.dataset.eqCartBound = '1';
      place.addEventListener('click', placeCheckout);
    }
    updatePlaceLabel();
    refreshPayButton();
    renderPanelList();
    try {
      if (new URLSearchParams(location.search).get('adim') === 'odeme') {
        var d = readDeliveryForm();
        if (d.ad && d.il && d.ilce && d.adres) showCheckoutStep('odeme');
      }
    } catch (e) {}
  }


  function cartSubtotal(arr) {
    return arr.reduce(function (s, x) {
      var birim = parsePriceNum(x.p);
      var adet = x.q > 0 ? x.q : 1;
      return s + birim * adet;
    }, 0);
  }

  function setKuponMsg(text, ok) {
    var el = document.getElementById('eq-cart-kupon-msg');
    if (!el) return;
    if (!text) { el.hidden = true; el.textContent = ''; return; }
    el.hidden = false;
    el.textContent = text;
    el.style.color = ok ? 'var(--ok, #389e0d)' : 'var(--danger, #cf1322)';
  }

  function previewKupon(cb) {
    var f = readCheckoutForm();
    var arr = load();
    var toplam = cartSubtotal(arr);
    if (!f.kupon) {
      setKuponMsg('', true);
      if (cb) cb(null, toplam);
      return;
    }
    fetch(eqApiBase() + '/kupon/dogrula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kod: f.kupon, sepet_toplam_tl: toplam })
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (!res.ok || !(res.j && res.j.success)) {
        var msg = (res.j && (res.j.error || res.j.message)) || 'Kupon geçersiz';
        setKuponMsg(msg, false);
        if (cb) cb(msg, toplam);
        return;
      }
      var d = res.j.data || {};
      var ind = d.indirim_tl || 0;
      setKuponMsg(
        __cartT('cart.coupon_ok', 'Kupon uygulandı') + (ind ? ': −' + ind.toLocaleString('tr-TR') + ' ₺' : ''),
        true
      );
      if (cb) cb(null, d.yeni_toplam_tl != null ? d.yeni_toplam_tl : toplam, d);
    }).catch(function (e) {
      var em = e && e.message ? e.message : String(e);
      setKuponMsg(em, false);
      if (cb) cb(em, toplam);
    });
  }

  function loginNextHref() {
    var next = isCheckoutPage() ? checkoutPageHref() : '/sepet';
    if (typeof window.equstoUrl === 'function') {
      return window.equstoUrl('login') + '?next=' + encodeURIComponent(next);
    }
    return '/login?next=' + encodeURIComponent(next);
  }

  function checkoutRequestId() {
    var key = 'equsto_checkout_istek';
    try {
      var cur = sessionStorage.getItem(key);
      if (cur) return cur;
      var id = 'ck_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      sessionStorage.setItem(key, id);
      return id;
    } catch (e) {
      return 'ck_' + Date.now();
    }
  }

  function clearCheckoutRequestId() {
    try {
      sessionStorage.removeItem('equsto_checkout_istek');
    } catch (e) {}
  }

  function saveMemberDelivery() {
    if (!isLoggedIn() || typeof window.equstoGetMemberToken !== 'function') return;
    var token = window.equstoGetMemberToken();
    if (!token) return;
    var d = readDeliveryForm();
    if (!d.il || !d.ilce) return;
    fetch('/api/auth/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
        'X-Equsto-Authorization': token,
      },
      body: JSON.stringify({
        token: token,
        teslimatAdres: {
          title: d.baslik || 'Teslimat',
          il: d.il,
          ilce: d.ilce,
          acikAdres: d.adres,
        },
      }),
    }).catch(function () {});
  }

  function buildCheckoutPayload(contact, arr, finalToplam, kuponData, kaynak) {
    var kalemler = arr.map(function (x) {
      var birim = parsePriceNum(x.p);
      var adet = x.q > 0 ? x.q : 1;
      return {
        kategori: x.c || '',
        marka: x.b || '',
        ad: x.n || '',
        birim_fiyat_tl: birim,
        adet: adet,
        ara_toplam_tl: birim * adet,
      };
    });
    var payload = {
      musteri: { ad: contact.ad, telefon: contact.tel, eposta: contact.eposta },
      not: contact.not || '',
      kalemler: kalemler,
      toplam_kalem: kalemler.length,
      toplam_adet: totalQty(arr),
      toplam_tl: finalToplam,
      kaynak: kaynak,
      sozlesme_onay: true,
      istek_id: checkoutRequestId(),
    };
    if (kuponData && kuponData.kod) {
      payload.kupon_kod = kuponData.kod;
      payload.indirim_tl = kuponData.indirim_tl || 0;
    }
    attachFaturaPayload(payload, contact);
    return payload;
  }

  function submitOrder() {
    var arr = load();
    if (!arr.length) { toast('Sepet boş.'); return; }
    if (!isLoggedIn()) {
      toast(__cartT('cart.login_required', 'Sipariş için üye girişi gerekli.'));
      try {
        location.href = loginNextHref();
      } catch (_) {}
      return;
    }
    var contact = collectCheckoutContact();
    if (!contact) return;
    var f = readCheckoutForm();
    var ad = contact.ad;
    var tel = contact.tel;
    var eposta = contact.eposta;
    if (isLoggedIn() && typeof window.equstoSetMemberActive === 'function') {
      window.equstoSetMemberActive({ ad: ad, telefon: tel, eposta: eposta });
    }
    var btn = document.getElementById('equsto-checkout-place') || document.getElementById('equsto-cart-order');
    if (btn) { btn.disabled = true; btn.textContent = __cartT('cart.order_sending', 'Gönderiliyor…'); }

    function sendOrder(finalToplam, kuponData) {
      var payload = buildCheckoutPayload(contact, arr, finalToplam, kuponData, 'web-sepet');
      fetch(eqApiBase() + '/siparisler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        if (btn) { btn.disabled = false; btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.order', 'Sipariş talebi'); }
        if (!res.ok || !(res.j && res.j.success)) {
          var msg = (res.j && (res.j.error || res.j.message)) || ('HTTP hata');
          toast(__cartT('cart.order_failed', 'Sipariş gönderilemedi: ') + msg);
          return;
        }
        var no = (res.j.data && (res.j.data.siparis_no || res.j.data.id)) || '';
        try {
          if (typeof window.equstoTrackConversion === 'function') {
            window.equstoTrackConversion('order', {
              kaynak: 'web-sepet',
              value: finalToplam,
              currency: 'TRY',
            });
          }
        } catch (_) {}
        toast(__cartT('cart.order_received', 'Sipariş alındı') + (no ? ' (' + no + ')' : ''));
        clearCheckoutRequestId();
        clearAll();
        dismissCartUi();
      }).catch(function (e) {
        if (btn) { btn.disabled = false; btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.order', 'Sipariş talebi'); }
        var em = e && e.message ? e.message : String(e);
        toast(__cartT('cart.order_failed', 'Sipariş gönderilemedi: ') + em);
      });
    }

    previewKupon(function (err, finalToplam, kuponData) {
      if (err && f.kupon) {
        if (btn) { btn.disabled = false; btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.order', 'Sipariş talebi'); }
        toast(__cartT('cart.order_failed', 'Sipariş gönderilemedi: ') + err);
        return;
      }
      sendOrder(finalToplam != null ? finalToplam : cartSubtotal(arr), kuponData);
    });
  }

  function refreshPayButton() {
    var payBtn = document.getElementById('equsto-cart-pay');
    var kartLabel = document.getElementById('eq-odeme-kart-label');
    if (!payBtn && !kartLabel) return;
    fetch(eqApiBase() + '/odeme/status', { cache: 'no-store' })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        var enabled = !!(res.ok && res.j && res.j.success && res.j.data && res.j.data.enabled);
        if (cartIsQuoteOnly(load())) enabled = false;
        if (payBtn) payBtn.hidden = !enabled;
        if (kartLabel) {
          kartLabel.hidden = !enabled;
          var kart = document.getElementById('eq-odeme-kart');
          var havale = document.getElementById('eq-odeme-havale');
          if (enabled && kart) kart.checked = true;
          if (!enabled && havale) havale.checked = true;
          updatePlaceLabel();
        }
      })
      .catch(function () {
        if (payBtn) payBtn.hidden = true;
        if (kartLabel) kartLabel.hidden = true;
        var havale = document.getElementById('eq-odeme-havale');
        if (havale) havale.checked = true;
        updatePlaceLabel();
      });
  }

  function submitPayOrder() {
    var arr = load();
    if (!arr.length) { toast('Sepet boş.'); return; }
    if (!isLoggedIn()) {
      toast(__cartT('cart.login_required', 'Sipariş için üye girişi gerekli.'));
      try {
        location.href = loginNextHref();
      } catch (_) {}
      return;
    }
    var contact = collectCheckoutContact();
    if (!contact) return;
    var f = readCheckoutForm();
    var ad = contact.ad;
    var tel = contact.tel;
    var eposta = contact.eposta;
    if (isLoggedIn() && typeof window.equstoSetMemberActive === 'function') {
      window.equstoSetMemberActive({ ad: ad, telefon: tel, eposta: eposta });
    }
    var btn = document.getElementById('equsto-checkout-place') || document.getElementById('equsto-cart-pay');
    if (btn) {
      btn.disabled = true;
      btn.textContent = __cartT('cart.pay_sending', 'Ödeme sayfasına yönlendiriliyor…');
    }

    function sendPay(finalToplam, kuponData) {
      var payload = buildCheckoutPayload(contact, arr, finalToplam, kuponData, 'web-sepet-kart');
      fetch(eqApiBase() + '/checkout/tepeplatform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) {
        return r.json().then(function (j) { return { ok: r.ok, j: j }; });
      }).then(function (res) {
        var url =
          res.j && res.j.data && (res.j.data.checkoutUrl || res.j.data.paymentPageUrl);
        if (!res.ok || !(res.j && res.j.success) || !url) {
          if (btn) {
            btn.disabled = false;
            btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.pay', 'Ödeme Yap');
          }
          var msg = (res.j && (res.j.error || res.j.message)) || 'HTTP hata';
          toast(__cartT('cart.pay_failed', 'Ödeme başlatılamadı: ') + msg);
          return;
        }
        clearCheckoutRequestId();
        location.href = url;
      }).catch(function (e) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.pay', 'Ödeme Yap');
        }
        var em = e && e.message ? e.message : String(e);
        toast(__cartT('cart.pay_failed', 'Ödeme başlatılamadı: ') + em);
      });
    }

    previewKupon(function (err, finalToplam, kuponData) {
      if (err && f.kupon) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = document.getElementById('equsto-checkout-place') ? placeButtonLabel() : __cartT('cart.pay', 'Ödeme Yap');
        }
        toast(__cartT('cart.pay_failed', 'Ödeme başlatılamadı: ') + err);
        return;
      }
      sendPay(finalToplam != null ? finalToplam : cartSubtotal(arr), kuponData);
    });
  }

  function openPanel() {
    if (isCartPage()) {
      goToCartPage();
      return;
    }
    ensureOverlay();
    renderPanelList();
    updatePanelMode();
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) ov.classList.add('is-open');
  }

  function closePanel() {
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) ov.classList.remove('is-open');
  }

  function onDocClick(e) {
    if (!e.target || !e.target.closest) return;
    /* ShopChromePortal — üst sepet DOMContentLoaded sonrası gelir; delegasyon şart */
    if (e.target.closest('#equsto-hdr-cart')) {
      goToCartPage();
      return;
    }
    if (e.target.closest('#equsto-cart-checkout')) {
      e.preventDefault();
      goToCheckout();
      return;
    }
    if (e.target.closest('#eq-adres-kaydet')) {
      e.preventDefault();
      saveAddressAndContinue();
      return;
    }
    if (e.target.closest('#equsto-checkout-place')) {
      e.preventDefault();
      placeCheckout();
      return;
    }
    var removeBtn = e.target.closest('.equsto-cart-remove');
    if (removeBtn) {
      e.preventDefault();
      removeLine(removeBtn.getAttribute('data-id'));
      return;
    }
    var trig = e.target.closest("[data-equsto-cart='1']");
    if (trig) {
      e.preventDefault();
      e.stopPropagation();
      var it = parseItemFromEl(trig);
      var useToast = trig.getAttribute('data-eq-cart-toast') === '1';
      addFromItem(it, { silent: useToast });
      if (useToast) {
        toastCartAdded(it && it.n ? it.n : '');
      } else if (trig.getAttribute('data-eq-open-cart') === '1') {
        openPanel();
      }
      return;
    }
    var legacy = e.target.closest('[data-eq-cart]');
    if (legacy) {
      e.preventDefault();
      e.stopPropagation();
      var card = legacy.closest('.prod-card-wrap');
      if (card) addFromCard(card);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') closePanel();
    if (
      (e.key === 'Enter' || e.key === ' ') &&
      e.target &&
      e.target.closest &&
      e.target.closest('#equsto-hdr-cart')
    ) {
      e.preventDefault();
      goToCartPage();
    }
  }

  var visibleSyncTimer = null;
  var pollInterval = null;
  function pullCartFromServer(opts) {
    return shopCartPull(opts || {});
  }

  function startCartPagePolling() {
    if (pollInterval) clearInterval(pollInterval);
    if (!isCartPage()) return;
    pollInterval = setInterval(function () {
      if (!isCartPage()) {
        clearInterval(pollInterval);
        pollInterval = null;
        return;
      }
      if (document.visibilityState === 'visible' && usesAuthCartSync() && !shopCartPullInFlight) {
        pullCartFromServer({ force: true });
      }
    }, 8000);
  }

  function onAppForeground() {
    if (visibleSyncTimer) clearTimeout(visibleSyncTimer);
    visibleSyncTimer = setTimeout(function () {
      visibleSyncTimer = null;
      pullCartFromServer({ force: true });
    }, 120);
  }

  function bootCartSync() {
    whenAuthApiReady(function () {
      var runPull = function () {
        shopCartPull({ force: true }).then(function () {
          shopCartPulled = true;
          if (usesAuthCartSync()) sessionCartPulled = true;
        });
      };
      if (typeof window.equstoAuthValidateSession === 'function') {
        window.equstoAuthValidateSession().then(runPull);
        return;
      }
      runPull();
    });
  }

  var memberSyncTimer = null;
  function resetCartSyncState() {
    sessionCartPulled = false;
    lastSyncAt = 0;
    syncPullInFlight = false;
    syncPullQueued = false;
    if (syncPushTimer) {
      clearTimeout(syncPushTimer);
      syncPushTimer = null;
    }
  }

  function scheduleMemberCartSync() {
    if (memberSyncTimer) clearTimeout(memberSyncTimer);
    memberSyncTimer = setTimeout(function () {
      memberSyncTimer = null;
      if (isLoggedIn() && authToken()) syncFromServer({ force: true });
    }, 150);
  }

  function init() {
    if (window.__equstoCartInit) return;
    window.__equstoCartInit = true;
    injectCartCss();
    syncBadge();
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('equsto-member-session', function (ev) {
      var fromLogin =
        ev && ev.detail && Array.isArray(ev.detail.items) ? ev.detail.items : null;
      if (fromLogin) {
        applyShopPulledCart(fromLogin);
        shopCartPulled = true;
        sessionCartPulled = true;
        lastSyncAt = Date.now();
        return;
      }
      shopCartPull({ force: true });
    });
    window.addEventListener('equsto-member-changed', function (ev) {
      if (ev && ev.detail && ev.detail.active === false) resetCartSyncState();
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) {
        sessionCartPulled = false;
        bootCartSync();
      } else {
        onAppForeground();
      }
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') onAppForeground();
    });
    window.addEventListener('focus', onAppForeground);
    window.addEventListener('pagehide', function () {
      flushShopCartPush();
      flushPush();
    });
    window.addEventListener('storage', function (e) {
      if (e.key === STORAGE_KEY) {
        onCartChangedRemote();
        return;
      }
      if (e.key === SYNC_TOKEN_KEY) {
        shopCartPull({ force: true });
      }
    });
    if (cartBc) {
      cartBc.addEventListener('message', function () {
        onCartChangedRemote();
      });
    }
    window.addEventListener('equsto-cart-changed', onCartChangedRemote);
    if (isCartPage()) {
      bindCartPageActions();
      renderPanelList();
      startCartPagePolling();
    }
    if (isCheckoutPage()) {
      bindCheckoutPage();
      prefillCheckoutForm();
    }
    bootCartSync();
  }

  function productFieldAttrs(u, withCartTrigger) {
    if (!u) return '';
    var s =
      ' data-eq-n="' +
      escAttr(u.n) +
      '" data-eq-b="' +
      escAttr(u.b) +
      '" data-eq-c="' +
      escAttr(u.c) +
      '" data-eq-p="' +
      escAttr(u.p) +
      '"';
    if (u.img) s += ' data-eq-img="' + escAttr(u.img) + '"';
    return withCartTrigger ? ' data-equsto-cart="1"' + s : s;
  }

  function dataAttrs(u) {
    return productFieldAttrs(u, true);
  }

  /** Kart sarmalayıcı — yalnızca alanlar (tıklama tetikleyicisi yok). */
  function cardWrapAttrs(u) {
    return productFieldAttrs(u, false);
  }

  /** Ürün kartındaki «+» düğmesi (ürün sayfası bağlantısı ile çakışmasın). */
  function cartAddButtonAttrs(u) {
    if (!u) return "";
    return (
      'type="button" class="eq-cart-add" data-equsto-cart="1" data-eq-n="' +
      escAttr(u.n) +
      '" data-eq-b="' +
      escAttr(u.b) +
      '" data-eq-c="' +
      escAttr(u.c) +
      '" data-eq-p="' +
      escAttr(u.p) +
      '"' +
      (u.img ? ' data-eq-img="' + escAttr(u.img) + '"' : '') +
      ' aria-label="Sepete ekle"'
    );
  }

  window.EqustoCart = {
    dataAttrs: dataAttrs,
    cardWrapAttrs: cardWrapAttrs,
    cartAddButtonAttrs: cartAddButtonAttrs,
    itemKey: lineId,
    openPanel: openPanel,
    goToCartPage: goToCartPage,
    closePanel: closePanel,
    syncBadge: syncBadge,
    addFromItem: addFromItem,
    addAllSiteCatalog: addAllSiteCatalog,
    addPfosRows: addPfosRows,
    loadSiteCatalog: loadSiteCatalog,
    parseItemFromEl: parseItemFromEl,
    parseItemFromCard: parseItemFromCard,
    addFromCard: addFromCard,
    toastCartAdded: toastCartAdded,
    clear: clearAll,
    bindPageActions: bindCartPageActions,
    bindCheckoutPage: bindCheckoutPage,
    prefillCheckout: prefillCheckoutForm,
    syncFromServer: syncFromServer,
    render: renderPanelList,
    startPolling: startCartPagePolling,
    _load: load,
  };

  function scheduleCartInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    init();
  }
  scheduleCartInit();
})();
