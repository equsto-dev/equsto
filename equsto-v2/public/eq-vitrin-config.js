/**
 * Ana sayfa + vitrin yapılandırması — JSON + /api/vitrin-homepage (admin kaynağı).
 */
(function (global) {
  'use strict';

  var DEFAULT_JSON = '/data/homepage-vitrin.json';
  var state = { ready: false, config: null, source: 'default' };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function attrPath(p) {
    if (typeof global.eqAttrPath === 'function') return global.eqAttrPath(p);
    return p ? String(p) : '';
  }

  function deepMerge(base, over) {
    if (!over || typeof over !== 'object') return base;
    var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
    for (var k of Object.keys(over)) {
      if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && typeof out[k] === 'object' && out[k]) {
        out[k] = deepMerge(out[k], over[k]);
      } else {
        out[k] = over[k];
      }
    }
    return out;
  }

  function apiBase() {
    if (global.EQUSTO_API_BASE) return String(global.EQUSTO_API_BASE).replace(/\/$/, '');
    try {
      if (location.protocol === 'http:' || location.protocol === 'https:') return '/api';
    } catch (_) {}
    return '';
  }

  function fetchJson(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function isImageUrl(u) {
    var s = String(u || '').trim();
    if (!s) return false;
    return /\.(jpe?g|png|webp|gif|svg)(\?|#|$)/i.test(s) || /^\/data\/images\//i.test(s) || /^\/images\//i.test(s);
  }

  function loadEtLocal() {
    try {
      return JSON.parse(localStorage.getItem('equsto_et') || '{}');
    } catch (_) {
      return {};
    }
  }

  function bannerToSlide(b, idx) {
    var url = String(b.url || '').trim() || '#';
    var imgUrl = b.image || (isImageUrl(url) ? url : '');
    var link = isImageUrl(url) ? '#' : url;
    return {
      title: String(b.baslik || '').trim(),
      subtitle: b.icon && !isImageUrl(String(b.icon)) ? String(b.icon).trim() : '',
      href: link,
      image: imgUrl,
      thumb: imgUrl || '',
      gradient: imgUrl ? '' : 'linear-gradient(120deg,#001e50,#0a3d7a)',
      aktif: b.aktif !== false,
      sort: 100 + idx,
      fromAdmin: true,
    };
  }

  function mergeEticaret(cfg, et) {
    if (!et || typeof et !== 'object') return cfg;
    var out = deepMerge({}, cfg);

    var heroB = (et.b || []).filter(function (b) {
      return b && b.aktif !== false && b.konum === 'anasayfa_hero';
    });
    if (heroB.length) {
      var adminSlides = heroB.map(bannerToSlide);
      var baseSlides = (out.heroSlides || []).filter(function (s) {
        return !s.fromAdmin;
      });
      out.heroSlides = adminSlides.concat(baseSlides);
    }

    var altB = (et.b || []).filter(function (b) {
      return b && b.aktif !== false && b.konum === 'anasayfa_alt';
    });
    if (altB.length) {
      var chips = altB.map(function (b, i) {
        return {
          strong: String(b.baslik || '').trim(),
          text: String(b.url || b.icon || '').trim(),
          aktif: true,
          sort: 80 + i,
          fromAdmin: true,
        };
      });
      var baseChips = (out.promoChips || []).filter(function (c) {
        return !c.fromAdmin;
      });
      out.promoChips = chips.concat(baseChips);
    }

    var camps = (et.k || []).filter(function (k) {
      return k && k.aktif !== false;
    });
    if (camps.length) {
      var tick = camps.map(function (k, i) {
        return {
          strong: String(k.ad || '').trim(),
          text: String(k.acik || '').trim(),
          aktif: true,
          sort: 80 + i,
          fromAdmin: true,
        };
      });
      var baseTick = (out.ticker || []).filter(function (t) {
        return !t.fromAdmin;
      });
      out.ticker = tick.concat(baseTick);
    }

    return out;
  }

  function fetchEticaret(base) {
    if (!base) return Promise.resolve(null);
    return fetch(base + '/eticaret-icerik', { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (body) {
        if (body && body.success && body.data) return body.data;
        return null;
      })
      .catch(function () {
        return null;
      });
  }

  function load() {
    return fetchJson(DEFAULT_JSON)
      .then(function (fileCfg) {
        var cfg = fileCfg;
        state.source = 'file';
        var base = apiBase();
        if (!base) {
          cfg = mergeEticaret(cfg, loadEtLocal());
          state.config = cfg;
          state.ready = true;
          return cfg;
        }
        return Promise.all([
          fetch(base + '/vitrin-homepage', { cache: 'no-store' })
            .then(function (r) {
              if (!r.ok) return null;
              return r.json();
            })
            .catch(function () {
              return null;
            }),
          fetchEticaret(base),
        ]).then(function (pair) {
          var vitrinBody = pair[0];
          var et = pair[1] || loadEtLocal();
          if (vitrinBody && vitrinBody.success && vitrinBody.data) {
            cfg = deepMerge(cfg, vitrinBody.data);
            state.source = 'api';
          }
          cfg = mergeEticaret(cfg, et);
          state.config = cfg;
          state.ready = true;
          return cfg;
        });
      })
      .catch(function () {
        state.config = { version: '1.0', layout: {} };
        state.ready = true;
        return state.config;
      });
  }

  function get() {
    return state.config || {};
  }

  function activeList(arr) {
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(function (x) {
        return x && x.aktif !== false;
      })
      .sort(function (a, b) {
        return (Number(a.sort) || 0) - (Number(b.sort) || 0);
      });
  }

  function filterPoolByDept(pool, spec) {
    if (!spec || !spec.dept || !Array.isArray(pool)) return pool;
    var dept = spec.dept;
    return pool.filter(function (u) {
      if (!u) return false;
      if (dept === 'yikama' && typeof global.eqYikamaShowcaseProduct === 'function') {
        return global.eqYikamaShowcaseProduct(u);
      }
      if (typeof global.eqProductMatchesDept === 'function') {
        return global.eqProductMatchesDept(u, dept);
      }
      return u.c === dept;
    });
  }

  /** Öne çıkanlar: Atalay + Öztiryakiler karışık (görselli ürünler). */
  function pickFeaturedMixed(pool, limit) {
    limit = Number(limit) || 12;
    if (!Array.isArray(pool) || !pool.length) return [];
    var ozti = [];
    var atalay = [];
    var rest = [];
    for (var i = 0; i < pool.length; i++) {
      var u = pool[i];
      if (!u || !u.img) continue;
      var b = String(u.b || '');
      if (/öztiryakiler/i.test(b)) ozti.push(u);
      else if (/atalay/i.test(b)) atalay.push(u);
      else rest.push(u);
    }
    var half = Math.ceil(limit / 2);
    var out = [];
    for (var o = 0; o < half && o < ozti.length; o++) out.push(ozti[o]);
    for (var a = 0; a < half && a < atalay.length; a++) out.push(atalay[a]);
    for (var r = 0; out.length < limit && r < rest.length; r++) out.push(rest[r]);
    return out.slice(0, limit);
  }

  global.eqPickFeaturedMixed = pickFeaturedMixed;

  function pickProducts(pool, spec) {
    if (!Array.isArray(pool) || !pool.length) return [];
    pool = filterPoolByDept(pool, spec);
    if (!pool.length) return [];
    var limit = (spec && Number(spec.limit)) || 18;
    var mode = (spec && spec.mode) || 'auto';
    var skus = spec && Array.isArray(spec.skus) ? spec.skus : [];
    if (mode === 'skus' && skus.length) {
      var map = {};
      for (var i = 0; i < pool.length; i++) {
        var u = pool[i];
        if (!u) continue;
        var keys = [u.sku, u.id, u.n].filter(Boolean);
        for (var j = 0; j < keys.length; j++) map[String(keys[j]).toLowerCase()] = u;
      }
      var picked = [];
      for (var k = 0; k < skus.length && picked.length < limit; k++) {
        var hit = map[String(skus[k]).toLowerCase()];
        if (hit) picked.push(hit);
      }
      if (picked.length) return picked;
    }
    var withImg = [];
    for (var w = 0; w < pool.length && withImg.length < limit; w++) {
      if (pool[w] && pool[w].img) withImg.push(pool[w]);
    }
    if (withImg.length >= Math.min(4, limit)) return withImg.slice(0, limit);
    return pool.slice(0, limit);
  }

  function applyLayoutVisibility(cfg) {
    var L = (cfg && cfg.layout) || {};
    var banner = document.querySelector('.hero-banner.eq-world-first-banner');
    var platform = document.querySelector('.hero.eq-home-hero-ads');
    var vitrin = document.querySelector('.eq-mx-vitrin');
    if (banner) banner.style.display = L.showWorldFirstBanner === false ? 'none' : '';
    if (platform) platform.style.display = L.showPlatformHero === false ? 'none' : '';
    if (vitrin) {
      var ticker = vitrin.querySelector('.eq-mx-ticker');
      var carousel = vitrin.querySelector('.eq-mx-hero');
      var stories = vitrin.querySelector('.eq-mx-story-wrap');
      var spotlight = vitrin.querySelector('.eq-mx-spotlight-wrap');
      if (ticker) ticker.style.display = L.showMutbexTicker === false ? 'none' : '';
      if (carousel) carousel.style.display = L.showMutbexCarousel === false ? 'none' : '';
      if (stories) stories.style.display = L.showMutbexStories === false ? 'none' : '';
      var popCats = vitrin.querySelector('.eq-mx-pop-cats-wrap');
      if (popCats) popCats.style.display = L.showMutbexPopCats === false ? 'none' : '';
      var vitMosaic = document.getElementById('eq-mx-vitrin-mosaic-section');
      if (vitMosaic) vitMosaic.style.display = L.showMutbexCatMosaic === false ? 'none' : '';
      if (spotlight) spotlight.style.display = L.showMutbexSpotlight === false ? 'none' : '';
      var pageTitle = vitrin.querySelector('.eq-mx-page-title');
      if (pageTitle) pageTitle.style.display = L.showMutbexSpotlight === false ? 'none' : '';
    }
    var title = document.querySelector('.eq-home .eq-mx-vitrin .eq-mx-page-title');
    if (title && cfg.pageTitle) title.textContent = cfg.pageTitle;
    var spotHead = document.querySelector('.eq-home .eq-mx-spotlight-wrap .eq-mx-spotlight__head');
    if (spotHead && cfg.spotlightTitle) spotHead.textContent = cfg.spotlightTitle;
    var catband = document.getElementById('eq-home-catband');
    if (catband) {
      var showCatband = L.showHomeCatband !== false;
      catband.hidden = !showCatband;
      catband.style.display = showCatband ? '' : 'none';
    }
    var mxFlags = [
      ['showMutbexPromoCards', '#eq-mx-promo-section'],
      ['showMutbexPayBanner', '#eq-mx-pay-section'],
      ['showMutbexCatTiles', '#eq-mx-cat-sm-section'],
      ['showMutbexCatMosaic', '#eq-mx-mosaic-section'],
    ];
    for (var m = 0; m < mxFlags.length; m++) {
      var node = document.querySelector(mxFlags[m][1]);
      if (node && L[mxFlags[m][0]] === false) node.hidden = true;
    }
    if (L.showMutbexDeptShowcases === false) {
      document.querySelectorAll('.eq-mx-showcase').forEach(function (el) {
        el.hidden = true;
      });
    }
    var newRail = document.querySelector('.eq-home-cm-mutbex > .eq-mx-o-6');
    if (newRail) {
      var showNew = L.showHomeNewRail !== false;
      newRail.hidden = !showNew;
      newRail.style.display = showNew ? '' : 'none';
    }
    var twinCta = document.querySelector('.eq-home-cm-mutbex > .eq-cm-twin-wrap.eq-mx-o-8');
    if (twinCta) {
      var showTwin = L.showHomeTwinCta !== false;
      twinCta.hidden = !showTwin;
      twinCta.style.display = showTwin ? '' : 'none';
    }
    var homeMain = document.querySelector('.eq-home-cm-mutbex > main.main');
    if (homeMain) {
      var showGrid = L.showHomeCatalogGrid !== false;
      homeMain.hidden = !showGrid;
      homeMain.style.display = showGrid ? '' : 'none';
      if (showGrid && typeof global.render === 'function') {
        try {
          global.render();
        } catch (_) {}
      }
    }
  }

  function renderTicker(cfg) {
    var track = document.querySelector('.eq-mx-ticker__track');
    if (!track) return;
    var items = activeList(cfg.ticker);
    if (!items.length) return;
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      html +=
        '<span class="eq-mx-ticker__item"><strong>' +
        esc(it.strong || '') +
        '</strong> ' +
        esc(it.text || '') +
        '</span>';
    }
    track.innerHTML = html + html;
  }

  function renderPromoChips(cfg) {
    var inner = document.querySelector('.eq-promo-strip-inner');
    if (!inner) return;
    var chips = activeList(cfg.promoChips);
    if (!chips.length) return;
    var html = '';
    for (var i = 0; i < chips.length; i++) {
      var c = chips[i];
      html +=
        '<span class="eq-promo-chip"><strong>' +
        esc(c.strong || '') +
        '</strong> ' +
        esc(c.text || '') +
        '</span>';
    }
    inner.innerHTML = html;
  }

  function renderHeroFromConfig(cfg) {
    var slidesEl = document.querySelector('.eq-mx-hero__slides');
    var thumbsEl = document.querySelector('.eq-mx-hero__thumbs');
    if (!slidesEl || !thumbsEl) return;
    var slides = activeList(cfg.heroSlides);
    if (!slides.length) return;
    var sHtml = '';
    var tHtml = '';
    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      var bg = s.image
        ? 'background-image:' +
          (typeof global.eqCssBgUrl === 'function'
            ? global.eqCssBgUrl(s.image)
            : 'url(' + esc(attrPath(s.image)) + ')')
        : 'background:' + (s.gradient || 'linear-gradient(120deg,#001e50,#0a3d7a)');
      var active = i === 0 ? ' is-active' : '';
      sHtml +=
        '<a class="eq-mx-hero__slide' +
        active +
        '" href="' +
        esc(attrPath(s.href || '#')) +
        '" style="' +
        bg +
        '"><div class="eq-mx-hero__slide-cap"><h2>' +
        esc(s.title || '') +
        '</h2><p>' +
        esc(s.subtitle || '') +
        '</p></div></a>';
      var thumb = s.thumb || s.image || '';
      tHtml +=
        '<button type="button" class="eq-mx-hero__thumb' +
        active +
        '" aria-label="' +
        esc(s.title || '') +
        '">' +
        (thumb
          ? '<img src="' +
            esc(typeof global.eqProductImgSrc === 'function' ? global.eqProductImgSrc(thumb) : attrPath(thumb)) +
            '" alt="" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
          : '') +
        '</button>';
    }
    slidesEl.innerHTML = sHtml;
    thumbsEl.innerHTML = tHtml;
    if (typeof global.__eqMxReinitHero === 'function') global.__eqMxReinitHero();
    if (typeof global.eqFixDataImagesInDom === 'function') global.eqFixDataImagesInDom(slidesEl.parentNode || document);
  }

  function applyHome(cfg) {
    applyLayoutVisibility(cfg);
    renderTicker(cfg);
    renderPromoChips(cfg);
    if ((cfg.layout || {}).showMutbexCarousel !== false) renderHeroFromConfig(cfg);
  }

  function patchRenderHomeRails() {
    if (typeof global.renderHomeRails !== 'function' || global.renderHomeRails.__eqVitrinPatched) return;
    var orig = global.renderHomeRails;
    global.renderHomeRails = function () {
      try {
        if (typeof global.eqMxFillSpotlight === 'function') global.eqMxFillSpotlight();
        var cfg = get();
        var pool = typeof global.__eqAllProducts === 'function' ? global.__eqAllProducts() : [];
        if (!Array.isArray(pool) || !pool.length) return;
        var rails = cfg.rails || {};
        var rK = document.getElementById('eq-rail-kampanyali');
        var rC = document.getElementById('eq-rail-cok-satan');
        var rY = document.getElementById('eq-rail-yeni');
        var renderRailCard = global.renderRailCard;
        if (typeof renderRailCard !== 'function') {
          orig();
          return;
        }
        var r0 = document.getElementById('eq-rail-featured');
        if (r0) r0.innerHTML = pickFeaturedMixed(pool, 12).map(renderRailCard).join('');
        if (rK) rK.innerHTML = pickProducts(pool, rails.kampanyali).map(renderRailCard).join('');
        if (rC) rC.innerHTML = pickProducts(pool, rails.cokSatan).map(renderRailCard).join('');
        if (rY) rY.innerHTML = pickProducts(pool, rails.yeni).map(renderRailCard).join('');
      } catch (_) {
        try {
          orig();
        } catch (__) {}
      }
    };
    global.renderHomeRails.__eqVitrinPatched = true;
  }

  function whenReady(fn) {
    if (state.ready) {
      fn(state.config);
      return;
    }
    load().then(fn);
  }

  global.EqVitrinConfig = {
    load: load,
    get: get,
    applyHome: function () {
      whenReady(function (cfg) {
        applyHome(cfg);
        patchRenderHomeRails();
      });
    },
    pickProducts: pickProducts,
    activeList: activeList,
    getSource: function () {
      return state.source;
    },
    mergeEticaret: mergeEticaret,
    reload: function () {
      state.ready = false;
      return load().then(function (cfg) {
        if (document.body && document.body.classList.contains('eq-home')) {
          applyHome(cfg);
          if (typeof global.render === 'function') global.render();
          if (typeof global.renderHomeRails === 'function') global.renderHomeRails();
        }
        return cfg;
      });
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      global.EqVitrinConfig.applyHome();
    });
  } else {
    global.EqVitrinConfig.applyHome();
  }
})(typeof window !== 'undefined' ? window : global);
