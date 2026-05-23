/**
 * Equsto vitrin sepeti: katalog kartlarından satır toplama, localStorage, WhatsApp metni.
 * contact.js (defer) sonrası yüklenir; equstoOpenWhatsAppWebWindow varsa onu kullanır.
 */
;(function () {
  'use strict';

  var STORAGE_KEY = 'equsto-ecom-cart-v1';
  var MAX_LINES = 250;
  var BULK_MAX_LINES = 500;

  function escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/\r?\n/g, ' ');
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

  function lineId(it) {
    var s = (it.c || '') + '\t' + (it.b || '') + '\t' + (it.n || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return 'eq' + (h >>> 0).toString(36);
  }

  var syncPushTimer = null;
  var syncPullInFlight = false;

  function isLoggedIn() {
    return typeof window.equstoIsMemberLoggedIn === 'function' && window.equstoIsMemberLoggedIn();
  }

  function authToken() {
    return typeof window.equstoGetMemberToken === 'function' ? window.equstoGetMemberToken() : '';
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

  function whenAuthApiReady(fn) {
    var p = window.__eqAuthApiReady;
    if (p && typeof p.then === 'function') p.then(fn);
    else fn();
  }

  function cartApiFetch(method, items) {
    var token = authToken();
    if (!token) return Promise.resolve(null);
    var opts = {
      method: method,
      credentials: cartApiBase() ? 'omit' : 'same-origin',
      headers: { Accept: 'application/json', Authorization: 'Bearer ' + token },
    };
    if (items !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify({ items: items });
    }
    return fetch(cartAuthUrl(), opts)
      .then(function (r) {
        var ct = (r.headers.get('content-type') || '').toLowerCase();
        if (!r.ok) return { success: false, _httpStatus: r.status };
        if (!ct.includes('application/json')) return { success: false, _notJson: true };
        return r.json();
      })
      .catch(function () {
        return { success: false, _network: true };
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

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var j = JSON.parse(raw);
      return Array.isArray(j) ? j : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocal(arr) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  function schedulePush(arr) {
    if (!isLoggedIn() || !authToken()) return;
    if (syncPushTimer) clearTimeout(syncPushTimer);
    var payload = arr || load();
    syncPushTimer = setTimeout(function () {
      syncPushTimer = null;
      cartApiFetch('PUT', payload);
    }, 400);
  }

  function flushPush() {
    if (!isLoggedIn() || !authToken()) return;
    var payload = load();
    if (syncPushTimer) {
      clearTimeout(syncPushTimer);
      syncPushTimer = null;
    }
    try {
      fetch(cartAuthUrl(), {
        method: 'PUT',
        credentials: cartApiBase() ? 'omit' : 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + authToken(),
        },
        body: JSON.stringify({ items: payload }),
        keepalive: true,
      });
    } catch (e) {}
  }

  function save(arr) {
    saveLocal(arr);
    schedulePush(arr);
  }

  function syncFromServer() {
    if (!isLoggedIn() || !authToken()) return Promise.resolve(false);
    if (syncPullInFlight) return Promise.resolve(false);
    syncPullInFlight = true;
    var localBefore = load();
    return cartApiFetch('GET')
      .then(function (j) {
        if (!j || !j.success) {
          if (j && (j._httpStatus === 404 || j._network) && isLocalDev()) {
            if (typeof window.equstoClearMemberSession === 'function') {
              window.equstoClearMemberSession();
            }
            return false;
          }
          if (j && j._httpStatus !== 401 && localBefore.length) schedulePush(localBefore);
          return false;
        }
        var remote = Array.isArray(j.items) ? j.items : [];
        var merged = localBefore.length ? mergeCartLines(remote, localBefore) : remote;
        saveLocal(merged);
        schedulePush(merged);
        syncBadge();
        renderPanelList();
        return true;
      })
      .finally(function () {
        syncPullInFlight = false;
      });
  }

  function totalQty(arr) {
    var t = 0;
    for (var i = 0; i < arr.length; i++) t += arr[i].q > 0 ? arr[i].q : 1;
    return t;
  }

  function parseItemFromEl(el) {
    if (!el) return null;
    return {
      n: el.getAttribute('data-eq-n') || '',
      b: el.getAttribute('data-eq-b') || '',
      c: el.getAttribute('data-eq-c') || '',
      p: el.getAttribute('data-eq-p') || '',
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
    if (!n && !b) return null;
    return { n: n, b: b, c: c, p: p };
  }

  function addFromCard(card) {
    var it = parseItemFromCard(card);
    if (!it) {
      toast('Ürün bilgisi okunamadı.');
      return false;
    }
    addFromItem(it);
    return true;
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
    if (el) el.textContent = '\uD83D\uDED2 ' + q;
    var bn = document.getElementById('eq-bnav-cart-badge');
    if (bn) bn.textContent = q > 99 ? '99+' : String(q);
  }

  function extractPrice(raw) {
    if (raw == null || raw === '') return '';
    var s = String(raw).split('\n')[0] || String(raw);
    return s.replace(/₺/g, '').replace(/\+ KDV/gi, '').trim();
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
    if (!p && x.price) p = extractPrice(x.price);
    return {
      n: x.name || x.ad || '',
      b: x.brand || x.marka_ad || '',
      c: x.category || x.kategori || '',
      p: p,
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
    if (!it || (!it.n && !it.b)) return 'skip';
    var id = lineId(it);
    var qty = Math.max(1, Math.round(Number(it.q) || 1));
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].q = (arr[i].q || 1) + qty;
        return 'merged';
      }
    }
    if (arr.length >= cap) return 'full';
    arr.push({ id: id, n: it.n, b: it.b, c: it.c, p: it.p, q: qty });
    return 'added';
  }

  function addFromItem(it) {
    if (!it || (!it.n && !it.b)) return;
    var arr = load();
    var st = mergeIntoCart(arr, it, { maxLines: MAX_LINES });
    if (st === 'full') {
      toast('Sepet çok fazla satır içeriyor.');
      return;
    }
    save(arr);
    syncBadge();
    toast('Sepete eklendi');
  }

  function loadSiteCatalog() {
    if (window.EqustoShopCatalog && typeof window.EqustoShopCatalog.load === 'function') {
      return window.EqustoShopCatalog.load();
    }
    if (window.EqustoEcomData && typeof window.EqustoEcomData.loadEkipmanlar === 'function') {
      return window.EqustoEcomData.loadEkipmanlar().then(function (j) {
        if (Array.isArray(j)) return j;
        if (j && Array.isArray(j.items)) return j.items;
        return [];
      });
    }
    return fetch('./data/ekipmanlar.json', { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        return Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : [];
      });
  }

  /** Sitedeki tüm katalog (ekipmanlar.json) → sepet; üst sınır BULK_MAX_LINES */
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
      var msg =
        added +
        ' ürün sepete eklendi' +
        (merged ? ' (' + merged + ' mevcut satır güncellendi)' : '') +
        (total ? ' · katalog: ' + total : '');
      if (capped) msg += ' · ' + capped + ' kalem sepet sınırı nedeniyle atlandı (max ' + cap + ')';
      toast(msg);
      return { added: added, merged: merged, skipped: skipped, capped: capped, total: total, lines: arr.length };
    });
  }

  /** PFOS teklif satırları → sepet (önce katalog eşlemesi, yoksa satır fiyatı) */
  function addPfosRows(rows, opts) {
    opts = opts || {};
    var list = Array.isArray(rows) ? rows : [];
    if (!list.length) {
      toast('Teklif listesi boş.');
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
      toast(added ? added + ' teklif kalemi sepete eklendi' : 'Sepet dolu — bazı kalemler eklenemedi');
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
    save([]);
    syncBadge();
    renderPanelList();
  }

  function buildWaText() {
    var arr = load();
    if (!arr.length) return '';
    var lines = ['Merhaba, equsto.com sepetimden yazıyorum:', '', 'Ürünler:'];
    arr.forEach(function (x, i) {
      var qty = x.q > 1 ? ' (x' + x.q + ')' : '';
      lines.push(
        i + 1 + '. ' + x.n + ' — ' + x.b + ' — ' + x.c + ' — ₺' + x.p + qty
      );
    });
    lines.push('', 'Kalem çeşidi: ' + arr.length + ' · Toplam adet: ' + totalQty(arr));
    return lines.join('\n');
  }

  function openWhatsApp() {
    var text = buildWaText();
    if (!text) {
      toast('Sepet boş.');
      return;
    }
    var phone = resolveWaDigits();
    if (window.equstoOpenWhatsAppWebWindow && phone) {
      window.equstoOpenWhatsAppWebWindow(phone, text);
      closePanel();
      return;
    }
    if (!phone) {
      window.alert(
        'WhatsApp numarası ayarlı değil.\n\nYönetici: public/contact.js içinde EQUSTO_WHATSAPP_E164.'
      );
      return;
    }
    window.location.assign(
      'https://web.whatsapp.com/send?phone=' +
        encodeURIComponent(phone) +
        '&text=' +
        encodeURIComponent(text)
    );
    closePanel();
  }

  function renderPanelList() {
    var sc = document.getElementById('equsto-cart-scroll');
    if (!sc) return;
    var arr = load();
    if (!arr.length) {
      sc.innerHTML =
        '<p style="color:var(--eq-text-muted,#888);padding:12px 4px;margin:0;line-height:1.55;font-size:12px;">Sepetiniz boş. Ürün kartına tıklayarak satır ekleyebilirsiniz.</p>';
      return;
    }
    sc.innerHTML = arr
      .map(function (x) {
        var qtyHtml =
          x.q > 1
            ? ' <span style="color:var(--eq-text-muted,#888);">×' + escAttr(String(x.q)) + '</span>'
            : '';
        return (
          '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--eq-border-soft,#f0f0f0);">' +
          '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:500;margin-bottom:4px;">' +
          escAttr(x.n) +
          '</div>' +
          '<div style="font-size:11px;color:var(--eq-text-muted,#888);">' +
          escAttr(x.b) +
          ' · ' +
          escAttr(x.c) +
          '</div>' +
          '<div style="font-size:11px;margin-top:4px;">₺' +
          escAttr(x.p) +
          qtyHtml +
          '</div></div>' +
          '<button type="button" class="equsto-cart-remove" data-id="' +
          escAttr(x.id) +
          '" style="flex:none;font-size:10px;padding:4px 8px;border:1px solid var(--eq-border,#e5e5e5);background:transparent;cursor:pointer;border-radius:4px;">Çıkar</button>' +
          '</div>'
        );
      })
      .join('');
    sc.querySelectorAll('.equsto-cart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        removeLine(btn.getAttribute('data-id'));
      });
    });
  }

  function ensureOverlay() {
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'equsto-cart-overlay';
    ov.style.cssText =
      'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:410;' +
      'align-items:center;justify-content:center;padding:16px;';
    ov.innerHTML =
      '<div id="equsto-cart-panel" style="width:100%;max-width:440px;max-height:86vh;overflow:hidden;display:flex;flex-direction:column;' +
      'background:var(--eq-surface,#fff);color:var(--eq-text,#111);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.22);' +
      'border:1px solid var(--eq-border,#e5e5e5);">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--eq-border,#e5e5e5);font-weight:600;font-size:14px;">Alışveriş sepeti' +
      '<button type="button" id="equsto-cart-close" aria-label="Kapat" style="border:none;background:transparent;cursor:pointer;font-size:18px;line-height:1;color:inherit;padding:4px 8px;">✕</button></div>' +
      '<div id="equsto-cart-scroll" style="overflow-y:auto;flex:1;padding:10px 14px;"></div>' +
      '<div style="padding:12px 14px;border-top:1px solid var(--eq-border,#e5e5e5);display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;">' +
      '<button type="button" id="equsto-cart-clear" style="font-size:11px;padding:8px 12px;border:1px solid var(--eq-border);background:var(--eq-surface-2,#f5f5f5);cursor:pointer;border-radius:6px;color:inherit;">Sepeti temizle</button>' +
      '<button type="button" id="equsto-cart-wa" style="font-size:11px;padding:8px 12px;border:1px solid var(--eq-border);background:var(--eq-surface,#fff);cursor:pointer;border-radius:6px;color:inherit;">WhatsApp ile gönder</button>' +
      '<button type="button" id="equsto-cart-order" style="font-size:11px;padding:8px 14px;border:1px solid var(--eq-topnav-dept-bg,#001e50);background:var(--eq-topnav-dept-bg,#001e50);color:#fff;cursor:pointer;border-radius:6px;font-weight:600;">Siparişi oluştur</button>' +
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
    var ordBtn = document.getElementById('equsto-cart-order');
    if (ordBtn) ordBtn.addEventListener('click', submitOrder);
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
    var t = String(s).replace(/[^\d,.\-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
    var n = parseFloat(t);
    return Number.isFinite(n) ? n : 0;
  }

  function submitOrder() {
    var arr = load();
    if (!arr.length) { toast('Sepet boş.'); return; }
    var ad = (window.prompt('Ad Soyad:') || '').trim();
    if (!ad) { toast('Sipariş iptal: ad gerekli.'); return; }
    var tel = (window.prompt('Telefon (ör. 0532…):') || '').trim();
    if (!tel) { toast('Sipariş iptal: telefon gerekli.'); return; }
    var eposta = (window.prompt('E-posta (opsiyonel):') || '').trim();
    var not = (window.prompt('Not (opsiyonel):') || '').trim();
    var btn = document.getElementById('equsto-cart-order');
    if (btn) { btn.disabled = true; btn.textContent = 'Gönderiliyor…'; }
    var kalemler = arr.map(function (x) {
      var birim = parsePriceNum(x.p);
      var adet = x.q > 0 ? x.q : 1;
      return {
        kategori: x.c || '',
        marka: x.b || '',
        ad: x.n || '',
        birim_fiyat_tl: birim,
        adet: adet,
        ara_toplam_tl: birim * adet
      };
    });
    var toplam = kalemler.reduce(function (s, k) { return s + (k.ara_toplam_tl || 0); }, 0);
    var payload = {
      musteri: { ad: ad, telefon: tel, eposta: eposta },
      not: not,
      kalemler: kalemler,
      toplam_kalem: kalemler.length,
      toplam_adet: totalQty(arr),
      toplam_tl: toplam,
      kaynak: 'web-sepet'
    };
    fetch(eqApiBase() + '/siparisler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().then(function (j) { return { ok: r.ok, j: j }; });
    }).then(function (res) {
      if (btn) { btn.disabled = false; btn.textContent = 'Siparişi oluştur'; }
      if (!res.ok || !(res.j && res.j.success)) {
        var msg = (res.j && (res.j.error || res.j.message)) || ('HTTP hata');
        toast('Sipariş gönderilemedi: ' + msg);
        return;
      }
      var no = (res.j.data && (res.j.data.siparis_no || res.j.data.id)) || '';
      toast('Sipariş alındı' + (no ? ' (' + no + ')' : ''));
      clearAll();
      closePanel();
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = 'Siparişi oluştur'; }
      var em = e && e.message ? e.message : String(e);
      toast('Sipariş gönderilemedi: ' + em);
    });
  }

  function openPanel() {
    if (isLoggedIn() && authToken()) syncFromServer();
    ensureOverlay();
    renderPanelList();
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) ov.style.display = 'flex';
  }

  function closePanel() {
    var ov = document.getElementById('equsto-cart-overlay');
    if (ov) ov.style.display = 'none';
  }

  function onDocClick(e) {
    if (!e.target || !e.target.closest) return;
    var trig = e.target.closest("[data-equsto-cart='1']");
    if (trig) {
      e.preventDefault();
      e.stopPropagation();
      addFromItem(parseItemFromEl(trig));
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
  }

  function bootCartSync() {
    whenAuthApiReady(function () {
      if (isLoggedIn() && authToken()) {
        syncFromServer();
        return;
      }
      if (typeof window.equstoAuthValidateSession === 'function') {
        window.equstoAuthValidateSession().then(function (ok) {
          if (ok) syncFromServer();
        });
      }
    });
  }

  function init() {
    if (window.__equstoCartInit) return;
    window.__equstoCartInit = true;
    syncBadge();
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('equsto-member-session', function () {
      syncFromServer();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') bootCartSync();
    });
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) bootCartSync();
    });
    window.addEventListener('pagehide', flushPush);
    var h = document.getElementById('equsto-hdr-cart');
    if (h) {
      h.addEventListener('click', openPanel);
      h.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openPanel();
        }
      });
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
      '" aria-label="Sepete ekle"'
    );
  }

  window.EqustoCart = {
    dataAttrs: dataAttrs,
    cardWrapAttrs: cardWrapAttrs,
    cartAddButtonAttrs: cartAddButtonAttrs,
    itemKey: lineId,
    openPanel: openPanel,
    closePanel: closePanel,
    syncBadge: syncBadge,
    addFromItem: addFromItem,
    addAllSiteCatalog: addAllSiteCatalog,
    addPfosRows: addPfosRows,
    loadSiteCatalog: loadSiteCatalog,
    parseItemFromCard: parseItemFromCard,
    addFromCard: addFromCard,
    clear: clearAll,
    syncFromServer: syncFromServer,
    _load: load,
  };

  function scheduleCartInit() {
    if (document.readyState === 'complete') {
      init();
      return;
    }
    document.addEventListener('DOMContentLoaded', init);
  }
  scheduleCartInit();
})();
