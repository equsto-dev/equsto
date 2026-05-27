/**
 * ═══════════════════════════════════════════════════════════════════════════
 * KİLİT: E-ticaret katalog yükleme (ekipmanlar). Davranış onaylı ve çalışır durumda.
 * Değiştirmeden önce kullanıcıdan açık onay alın. Ayrıntı: public/data/ekipmanlar-KILIT.txt
 * Cursor: .cursor/rules/ekipmanlar-katalog-kilit.mdc
 * ═══════════════════════════════════════════════════════════════════════════
 */
;(function(){
  'use strict';

  /** v3: tek kaynak `ekipmanlar.json`; lite (11 örnek) kaldırıldı — eski LS önbelleği temizlensin. */
  var STORAGE_KEY = 'equsto-ecom-ekipmanlar-json-v3';
  var DEFAULT_URL = './data/ekipmanlar.json';
  var __eqCatMem = null;
  var __eqCatInflight = null;

  /**
   * `/en/pisirme.html` vb.: `./data/...` tarayıcıda `/en/data/...` olur (404).
   * `/en` önekini pathname'den çıkarıp, HTML ile aynı kök altında `data/` dosyasına bağlanır.
   */
  function publicDataFileHref(relPath) {
    relPath = String(relPath || 'data/ekipmanlar.json').replace(/^\.\//, '');
    try {
      var u = new URL(location.href);
      var path = u.pathname || '/';
      if (path.indexOf('/en') === 0) {
        if (path === '/en' || path === '/en/') path = '/';
        else if (path.indexOf('/en/') === 0) path = path.slice(3) || '/';
      }
      /* /shop/pisirme ve /shop/pisirme/urun-slug — data/ kökten (shop/data/ 404 olmasın) */
      if (/^\/shop\/(pisirme|sogutma|kahve|yikama|hazirlik|icecek)(\/[^/]+)?\/?$/i.test(path)) {
        return u.origin + '/' + relPath.replace(/^\//, '');
      }
      var baseDir = path.replace(/\/[^/]*$/, '/');
      if (baseDir === '//') baseDir = '/';
      return new URL(relPath, u.origin + baseDir).href;
    } catch (_) {}
    return './' + relPath;
  }

  function safeParse(s){ try{ return JSON.parse(s); }catch(_){ return null; } }
  function safeGet(){ try{ return localStorage.getItem(STORAGE_KEY); }catch(_){ return null; } }
  function safeSet(v){ try{ localStorage.setItem(STORAGE_KEY, v); return true; }catch(_){ return false; } }
  function safeRemove(){ try{ localStorage.removeItem(STORAGE_KEY); return true; }catch(_){ return false; } }

  function isFileProtocol() {
    return typeof location !== 'undefined' && location.protocol === 'file:';
  }

  /**
   * file://: tam katalog script (`ekipmanlar-file-fallback.js`); küçük lite yedeği yoktur.
   * timeoutMs > 0: büyük tam yedeğin parse’da takılması / donma hissi için üst süre (ms).
   */
  function loadEkipmanlarScriptUrl(url, scriptId, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (!url) {
        reject(new Error('script url yok'));
        return;
      }
      if (typeof document === 'undefined') {
        reject(new Error('no document'));
        return;
      }
      var prev = document.getElementById(scriptId);
      if (prev) prev.remove();
      var settled = false;
      var s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.src = url;
      var tid =
        timeoutMs != null && timeoutMs > 0
          ? setTimeout(function () {
              if (settled) return;
              settled = true;
              try {
                s.remove();
              } catch (_) {}
              reject(new Error('script timeout (' + timeoutMs + 'ms): ' + url));
            }, timeoutMs)
          : null;
      function done(fn, arg) {
        if (settled) return;
        settled = true;
        if (tid) clearTimeout(tid);
        try {
          s.remove();
        } catch (_) {}
        fn(arg);
      }
      s.onload = function () {
        var g = typeof window !== 'undefined' ? window.__EQUSTO_EKIPMANLAR_FILE : null;
        if (Array.isArray(g) && g.length) done(resolve, g);
        else done(reject, new Error('ekipmanlar script boş'));
      };
      s.onerror = function () {
        done(reject, new Error('script yüklenemedi: ' + url));
      };
      document.head.appendChild(s);
    });
  }

  function isPreviewOnlyArray(arr) {
    if (!Array.isArray(arr) || !arr.length) return false;
    return arr.every(function (x) {
      return x && x.__equstoPreview === true;
    });
  }

  /**
   * file://: yalnızca `ekipmanlar-file-fallback.js` (kaynak: ekipmanlar.json, `npm run data:fallback`).
   * Küçük “11 ürün” lite yedeği kullanılmaz (tam katalog gerekir).
   */
  function loadFromScriptFallback() {
    return new Promise(function (resolve, reject) {
      if (typeof window !== 'undefined' && Array.isArray(window.__EQUSTO_EKIPMANLAR_FILE) && window.__EQUSTO_EKIPMANLAR_FILE.length) {
        if (!isPreviewOnlyArray(window.__EQUSTO_EKIPMANLAR_FILE)) {
          resolve(window.__EQUSTO_EKIPMANLAR_FILE);
          return;
        }
        try {
          delete window.__EQUSTO_EKIPMANLAR_FILE;
        } catch (_) {
          window.__EQUSTO_EKIPMANLAR_FILE = undefined;
        }
      }
      var heavy = '';
      try {
        heavy = publicDataFileHref('data/ekipmanlar-file-fallback.js');
      } catch (_) {}
      function afterOk(arr) {
        clearFilePreviewUI();
        resolve(arr);
      }
      if (!heavy) {
        reject(new Error('file fallback url yok'));
        return;
      }
      loadEkipmanlarScriptUrl(heavy, 'equsto-ekip-file-fallback', 240000)
        .then(afterOk)
        .catch(function (e) {
          reject(e);
        });
    });
  }

  /** Eski sürümde kalan dosya-önizleme şeridini kaldırır (artık başarılı file:// yüklemesinde gösterilmez). */
  function clearFilePreviewUI() {
    try {
      delete window.__EQUSTO_FILE_PREVIEW_MODE;
    } catch (_) {}
    if (typeof document === 'undefined') return;
    var b = document.getElementById('equsto-file-preview-bar');
    if (b) b.remove();
    var fb = document.getElementById('equsto-ekip-file-fallback');
    if (fb) try { fb.remove(); } catch (_) {}
  }

  /** Tek doğru kayıt dosyası: public/data/ekipmanlar.json */
  function fetchUrlCandidates(){
    var out = ['/data/ekipmanlar.json', publicDataFileHref('data/ekipmanlar.json')];
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
      out.push('./data/ekipmanlar.json', 'data/ekipmanlar.json', DEFAULT_URL);
    }
    return out.filter(function (u, i, a) { return u && a.indexOf(u) === i; });
  }

  async function fetchEkipmanlarFromNetwork(){
    if (isFileProtocol()) {
      try {
        var embedded = await loadFromScriptFallback();
        if (Array.isArray(embedded) && embedded.length) {
          clearFilePreviewUI();
          return embedded;
        }
      } catch (e) {
        var msg =
          'file://: Katalog yüklenemedi (data/ekipmanlar-file-fallback.js). ' +
          (e && e.message ? e.message : String(e)) +
          ' — Sayfayı yerel sunucudan açın (Katalogu-Ac.bat veya npm run dev).';
        var fe = new Error(msg);
        fe.cause = e;
        throw fe;
      }
      var emptyErr = new Error(
        'file://: Katalog boş döndü. data/ekipmanlar-file-fallback.js güncelleyin (npm run data:fallback) veya http:// ile açın.'
      );
      throw emptyErr;
    }

    var urls = fetchUrlCandidates();
    var errors = [];
    for (var i = 0; i < urls.length; i++) {
      try {
        var r = await fetch(urls[i], { cache: 'default', headers: { Accept: 'application/json' } });
        if (!r.ok) {
          errors.push(urls[i] + ' → HTTP ' + r.status);
          continue;
        }
        var data = await r.json();
        if (Array.isArray(data) && data.length) {
          clearFilePreviewUI();
          return data;
        }
        if (data && Array.isArray(data.items) && data.items.length) {
          clearFilePreviewUI();
          return data.items;
        }
        errors.push(urls[i] + ' → boş veya beklenmeyen şema');
      } catch (e) {
        errors.push(urls[i] + ' → ' + (e && e.message ? e.message : String(e)));
      }
    }
    var err = new Error('ekipmanlar fetch: ' + errors.join(' · '));
    err.details = errors;
    throw err;
  }

  async function loadEkipmanlar(){
    if (__eqCatMem != null) return __eqCatMem;
    if (__eqCatInflight) return __eqCatInflight;

    var stored = safeGet();
    if (stored) {
      var j = safeParse(stored);
      if (Array.isArray(j) && j.length) {
        /* Önizleme-only önbellek (file veya http): tam katalog / file script yedeğine bırak */
        if (isPreviewOnlyArray(j)) {
          safeRemove();
        } else {
          clearFilePreviewUI();
          __eqCatMem = j;
          return j;
        }
      }
      if (j && Array.isArray(j.items) && j.items.length) {
        if (isPreviewOnlyArray(j.items)) {
          safeRemove();
        } else {
          clearFilePreviewUI();
          __eqCatMem = j.items;
          return j.items;
        }
      }
      // Geçersiz / boş önbellek: tekrar dosyadan dene (Admin’de 0 ürün + kırmızı şerit sebebi olabiliyor)
      safeRemove();
    }
    __eqCatInflight = fetchEkipmanlarFromNetwork()
      .then(function (data) {
        __eqCatMem = data;
        return data;
      })
      .finally(function () {
        __eqCatInflight = null;
      });
    return __eqCatInflight;
  }

  function storeJsonText(jsonText){
    var j = safeParse(jsonText);
    if(!j) throw new Error('hatalı JSON');
    if(!(Array.isArray(j) || (j && Array.isArray(j.items)))) throw new Error('JSON dizi olmalı (veya {items:[]})');
    safeSet(JSON.stringify(j, null, 2));
    __eqCatMem = Array.isArray(j) ? j : j && Array.isArray(j.items) ? j.items : null;
    return j;
  }

  async function fetchFresh() {
    __eqCatMem = null;
    __eqCatInflight = null;
    var data = await fetchEkipmanlarFromNetwork();
    __eqCatMem = data;
    return data;
  }

  window.EqustoEcomData = {
    storageKey: STORAGE_KEY,
    loadEkipmanlar: loadEkipmanlar,
    publicDataFileHref: publicDataFileHref,
    /** Ağdan doğrudan dener (çoklu URL); bellek önbelleğini sıfırlar. */
    fetchFresh: fetchFresh,
    getStored: function(){ return safeGet(); },
    storeJsonText: storeJsonText,
    clear: function(){ safeRemove(); __eqCatMem = null; __eqCatInflight = null; },
  };
})();

