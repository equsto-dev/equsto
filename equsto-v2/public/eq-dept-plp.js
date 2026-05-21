/**
 * Pişirme kategori PLP v2 — tek dosya, EqCategoryShell/catalog bağımlılığı yok.
 */
(function () {
  'use strict';

  var PAGE_SIZE = 24;
  var CATALOG_V = '20260519ozti-tip';
  var DEPT = (document.body && document.body.getAttribute('data-eq-dept')) || 'pisirme';

  var state = {
    all: [],
    ready: false,
    activeTiles: [],
    brands: [],
    models: [],
    energy: [],
    q: '',
    sort: '',
    priceMin: '',
    priceMax: '',
    page: 1,
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function lc(s) {
    return String(s || '').toLocaleLowerCase('tr');
  }

  function parsePrice(p) {
    var s = String(p || '')
      .split('\n')[0]
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.]/g, '');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function formatPrice(p, raw) {
    if (raw && window.EqustoKurLive && typeof window.EqustoKurLive.priceForRow === 'function') {
      var live = window.EqustoKurLive.priceForRow(raw);
      if (live) return live.replace(/\s*\+?\s*KDV.*$/i, '').trim() || live;
    }
    var n = parsePrice(p);
    if (!n) return '';
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' TL';
  }

  function imgSrc(p) {
    if (!p) return '';
    var s = String(p).replace(/\\/g, '/').replace(/^\.\//, '');
    if (/^caglayan-market\//i.test(s)) {
      return '/data/' + s.replace(/^data\//, '');
    }
    if (/^https?:\/\//i.test(s)) return s;
    if (typeof window.equstoDataAssetHref === 'function') {
      try {
        return window.equstoDataAssetHref(s);
      } catch (_) {}
    }
    if (s.charAt(0) === '/') return s;
    if (/^images\//i.test(s)) {
      var root =
        typeof window.equstoCatalogImagesWebRoot === 'function'
          ? window.equstoCatalogImagesWebRoot()
          : '/data/images/';
      return root + s.replace(/^images\//i, '');
    }
    return '/data/' + s.replace(/^data\//, '');
  }

  function productUrl(item) {
    var raw = item.raw;
    if (raw && raw.equstoPage && typeof window.eqAttrPath === 'function') {
      return window.eqAttrPath(raw.equstoPage);
    }
    if (DEPT === 'market-reyon' && raw && raw.slug) {
      var base =
        typeof window.equstoUrl === 'function'
          ? window.equstoUrl('marketReyon')
          : '/shop/market-reyonlari';
      var path = base.replace(/\/$/, '') + '/' + encodeURIComponent(raw.slug);
      return typeof window.eqAttrPath === 'function' ? window.eqAttrPath(path) : path;
    }
    var slug =
      (typeof window.eqCategoryToUrunlerSeg === 'function'
        ? window.eqCategoryToUrunlerSeg(item.c)
        : null) || DEPT;
    var path =
      typeof window.eqProductSlug === 'function'
        ? window.eqProductSlug({ brand: item.b, name: item.n, b: item.b, n: item.n })
        : (function () {
            var name = lc(item.n).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            var brand = lc(item.b).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            return (brand ? brand + '-' : '') + name;
          })();
    if (typeof window.eqProductPath === 'function') {
      return window.eqProductPath(slug, path);
    }
    return '/shop/' + slug + '/' + path;
  }

  function deptTiles() {
    if (window.EqDeptTips && window.EqDeptTips.tilesFor) {
      return window.EqDeptTips.tilesFor(DEPT);
    }
    return [];
  }

  function tileMatch(u, tile) {
    if (window.EqDeptTips && window.EqDeptTips.tileMatchProduct) {
      return window.EqDeptTips.tileMatchProduct(u, tile);
    }
    return tile && tile.slug && u.c === tile.slug;
  }

  function findTile(id) {
    var tiles = deptTiles();
    for (var i = 0; i < tiles.length; i++) {
      if (tiles[i].id === id) return tiles[i];
    }
    return null;
  }

  function productSearchHaystack(u) {
    var hay = lc(u.n + ' ' + u.b + ' ' + (u.c || ''));
    if (u.tip_kodu) hay += ' ' + lc(u.tip_kodu);
    if (DEPT === 'market-reyon' && u.raw) {
      hay += ' ' + lc(u.raw.series || '') + ' ' + lc(u.raw.specs || '');
    } else if (u.raw && u.raw.specs) {
      hay += ' ' + lc(String(u.raw.specs).slice(0, 400));
    }
    return hay;
  }

  function matchSearchQuery(hay, q) {
    var qs = lc(q).trim();
    if (!qs) return true;
    if (hay.indexOf(qs) >= 0) return true;
    var words = qs.split(/\s+/).filter(function (w) {
      return w.length > 0;
    });
    if (words.length < 2) return false;
    for (var i = 0; i < words.length; i++) {
      if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function isOztiRow(raw) {
    if (!raw) return false;
    var k = String(raw.kaynak || raw.kaynak_fiyat_listesi || '');
    if (/^ozti/i.test(k)) return true;
    if (String(raw.dept || '') === 'set-ustu-mutfak') return true;
    return false;
  }

  function skipItem(item) {
    if (DEPT === 'set-ustu-mutfak') {
      return !(item && item.raw && isOztiRow(item.raw));
    }
    if (DEPT !== 'market-reyon') {
      if (window.EqDeptTips && window.EqDeptTips.excludeFromDeptView) {
        if (window.EqDeptTips.excludeFromDeptView(DEPT, item)) return true;
      }
    }
    var n = lc(item.n);
    var c = lc(item.c);
    if (c !== 'doner-ocaklari-' && c !== 'doner-ocaklari') return false;
    if (n.indexOf('sarma aya') !== -1) return true;
    if (n.indexOf('döner aya') !== -1 && n.indexOf('oca') === -1) return true;
    return false;
  }

  function brandKey(u) {
    if (window.EqDeptCmFacets && window.EqDeptCmFacets.productBrand) {
      return window.EqDeptCmFacets.productBrand(u);
    }
    return (u && u.fb) || (u && u.b) || '';
  }

  function normalizeRow(x) {
    if (typeof window.eqSanitizeVendorProduct === 'function') {
      window.eqSanitizeVendorProduct(x);
    }
    var b = (x.brand || '').trim();
    var n = x.name || '';
    if (typeof window.eqSimplifyTezgahDavlumbazName === 'function') {
      n = window.eqSimplifyTezgahDavlumbazName(n, { dept: DEPT });
    }
    var fb = b;
    if (window.EqDeptCmFacets && window.EqDeptCmFacets.resolveFacetBrand) {
      fb = window.EqDeptCmFacets.resolveFacetBrand(b, n);
    }
    var row = x;
    if (window.EqustoKurLive && typeof window.EqustoKurLive.applyRowPrices === 'function') {
      row = window.EqustoKurLive.applyRowPrices(x) || x;
    }
    return {
      c: row.category || '',
      b: b,
      fb: fb,
      n: n,
      p: String(row.price || '').split('\n')[0],
      img: row.images && row.images[0] ? imgSrc(row.images[0]) : '',
      tip_kodu: row.tip_kodu || row.tipKodu || '',
      raw: row,
    };
  }

  function filtered() {
    var list = state.all;
    if (state.activeTiles.length) {
      list = list.filter(function (u) {
        for (var ti = 0; ti < state.activeTiles.length; ti++) {
          var tile = findTile(state.activeTiles[ti]);
          if (tile && tileMatch(u, tile)) return true;
        }
        return false;
      });
    }
    if (state.brands.length) {
      list = list.filter(function (u) {
        return state.brands.indexOf(brandKey(u)) >= 0;
      });
    }
    if (state.models.length && window.EqDeptCmFacets) {
      list = list.filter(function (u) {
        var m = window.EqDeptCmFacets.extractModel(u.n, u.b);
        return state.models.indexOf(m) >= 0;
      });
    }
    if (state.energy.length && window.EqDeptCmFacets) {
      list = list.filter(function (u) {
        for (var ei = 0; ei < state.energy.length; ei++) {
          if (window.EqDeptCmFacets.matchEnergy(u, state.energy[ei])) return true;
        }
        return false;
      });
    }
    if (state.priceMin !== '') {
      var lo = Number(state.priceMin);
      list = list.filter(function (u) {
        return parsePrice(u.p) >= lo;
      });
    }
    if (state.priceMax !== '') {
      var hi = Number(state.priceMax);
      list = list.filter(function (u) {
        var n = parsePrice(u.p);
        return !n || n <= hi;
      });
    }
    if (state.q) {
      list = list.filter(function (u) {
        return matchSearchQuery(productSearchHaystack(u), state.q);
      });
    }
    list = list.slice();
    if (state.sort === 'name') {
      list.sort(function (a, b) {
        return String(a.n).localeCompare(String(b.n), 'tr');
      });
    } else if (state.sort === 'name-desc') {
      list.sort(function (a, b) {
        return String(b.n).localeCompare(String(a.n), 'tr');
      });
    } else if (state.sort === 'price-asc') {
      list.sort(function (a, b) {
        return parsePrice(a.p) - parsePrice(b.p);
      });
    } else if (state.sort === 'price-desc') {
      list.sort(function (a, b) {
        return parsePrice(b.p) - parsePrice(a.p);
      });
    } else if (window.EqDeptTips && window.EqDeptTips.sortProductsDefault) {
      list = window.EqDeptTips.sortProductsDefault(DEPT, list);
    }
    return list;
  }

  function poolForFacetCounts(exclude) {
    var list = state.all;
    if (state.activeTiles.length && exclude !== 'tile') {
      list = list.filter(function (u) {
        for (var ti = 0; ti < state.activeTiles.length; ti++) {
          var tile = findTile(state.activeTiles[ti]);
          if (tile && tileMatch(u, tile)) return true;
        }
        return false;
      });
    }
    if (state.brands.length && exclude !== 'brand') {
      list = list.filter(function (u) {
        return state.brands.indexOf(brandKey(u)) >= 0;
      });
    }
    if (state.models.length && exclude !== 'model' && window.EqDeptCmFacets) {
      list = list.filter(function (u) {
        return state.models.indexOf(window.EqDeptCmFacets.extractModel(u.n, u.b)) >= 0;
      });
    }
    if (state.energy.length && exclude !== 'energy' && window.EqDeptCmFacets) {
      list = list.filter(function (u) {
        for (var ei = 0; ei < state.energy.length; ei++) {
          if (window.EqDeptCmFacets.matchEnergy(u, state.energy[ei])) return true;
        }
        return false;
      });
    }
    if (state.priceMin !== '' && exclude !== 'price') {
      var lo = Number(state.priceMin);
      list = list.filter(function (u) {
        return parsePrice(u.p) >= lo;
      });
    }
    if (state.priceMax !== '' && exclude !== 'price') {
      var hi = Number(state.priceMax);
      list = list.filter(function (u) {
        var n = parsePrice(u.p);
        return !n || n <= hi;
      });
    }
    if (state.q) {
      list = list.filter(function (u) {
        return matchSearchQuery(productSearchHaystack(u), state.q);
      });
    }
    return list;
  }

  function clearAllFilters() {
    state.activeTiles = [];
    state.brands = [];
    state.models = [];
    state.energy = [];
    state.priceMin = '';
    state.priceMax = '';
    state.page = 1;
    try {
      var inp = document.querySelector('.srch-input');
      if (inp) inp.value = '';
    } catch (_) {}
    state.q = '';
  }

  function renderSelectedChips() {
    if (!window.EqDeptCmFacets) return;
    var tiles = deptTiles();
    function onRemove(type, value) {
      if (type === 'tile') {
        state.activeTiles = state.activeTiles.filter(function (t) {
          return t !== value;
        });
      }
      else if (type === 'brand') state.brands = state.brands.filter(function (b) { return b !== value; });
      else if (type === 'model') state.models = state.models.filter(function (m) { return m !== value; });
      else if (type === 'energy') state.energy = state.energy.filter(function (e) { return e !== value; });
      else if (type === 'priceMin') state.priceMin = '';
      else if (type === 'priceMax') state.priceMax = '';
      state.page = 1;
      render();
    }
    var main = document.getElementById('eq-dept-cm-chips-main');
    if (main) window.EqDeptCmFacets.renderSelectedChips(main, state, tiles, tileMatch, onRemove);
    var asideChips = document.getElementById('eq-dept-cm-chips');
    if (asideChips) window.EqDeptCmFacets.renderSelectedChips(asideChips, state, tiles, tileMatch, onRemove);
  }

  function renderFacets() {
    var host = document.getElementById('eq-dept-plp-facets');
    if (!host || !state.ready || !window.EqDeptCmFacets) return;
    window.EqDeptCmFacets.mount(host, {
      allProducts: state.all,
      state: state,
      tiles: deptTiles(),
      tileMatch: tileMatch,
      getPoolForCounts: poolForFacetCounts,
      onChange: function (kind) {
        if (kind === 'clear') clearAllFilters();
        state.page = 1;
        document.body.classList.remove('eq-dept-filter-open');
        render();
      },
    });
    renderSelectedChips();
  }

  function renderGrid() {
    var grid = document.getElementById('eq-dept-plp-grid');
    var countEl = document.getElementById('eq-dept-plp-count');
    if (!grid) return;

    if (!state.ready) {
      grid.innerHTML = '<p class="eq-dept-plp-status">Katalog yükleniyor…</p>';
      if (countEl) countEl.textContent = '';
      return;
    }

    var list = filtered();
    try {
      window.__eqDeptPlpResultCount = list.length;
    } catch (_) {}
    var totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * PAGE_SIZE;
    var slice = list.slice(start, start + PAGE_SIZE);

    if (countEl) {
      countEl.innerHTML = '<strong>' + list.length + '</strong> ürün görüntüleniyor.';
    }
    var selWrap = document.getElementById('eq-dept-plp-selected');
    if (selWrap) {
      var hasChip =
        state.activeTiles.length ||
        state.brands.length ||
        state.models.length ||
        state.energy.length ||
        state.priceMin !== '' ||
        state.priceMax !== '';
      selWrap.hidden = !hasChip;
    }

    if (!slice.length) {
      grid.innerHTML =
        '<p class="eq-dept-plp-empty">Bu filtrelere uygun ürün bulunamadı.</p>';
    } else {
      grid.innerHTML = slice
        .map(function (u) {
          var href = productUrl(u);
          var rawImg =
            u.raw && u.raw.images && u.raw.images[0]
              ? String(u.raw.images[0]).replace(/\\/g, '/')
              : '';
          var img = u.img
            ? '<img src="' +
              esc(u.img) +
              '"' +
              (rawImg ? ' data-eq-img-raw="' + esc(rawImg) + '" data-eq-img-step="0"' : '') +
              ' alt="" loading="lazy" decoding="async" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
            : '';
          var cartBtn =
            window.EqustoCart && typeof window.EqustoCart.cartAddButtonAttrs === 'function'
              ? '<button class="eq-dept-plp-card__btn" ' + window.EqustoCart.cartAddButtonAttrs(u) + '>SEPETE EKLE</button>'
              : '<button type="button" class="eq-dept-plp-card__btn">SEPETE EKLE</button>';
          return (
            '<article class="eq-dept-plp-card">' +
            '<a class="eq-dept-plp-card__img" href="' +
            esc(href) +
            '">' +
            img +
            '</a>' +
            '<a class="eq-dept-plp-card__name" href="' +
            esc(href) +
            '">' +
            esc(u.n) +
            '</a>' +
            (u.p
              ? '<div class="eq-dept-plp-card__price">' +
                esc(formatPrice(u.p, u.raw)) +
                '</div>'
              : '') +
            cartBtn +
            '</article>'
          );
        })
        .join('');
    }

    var pages = document.getElementById('eq-dept-plp-pages');
    if (pages) {
      if (totalPages <= 1) {
        pages.innerHTML = '';
      } else {
        var p = state.page;
        var html = '';
        html +=
          '<button type="button" data-p="' +
          (p - 1) +
          '"' +
          (p <= 1 ? ' disabled' : '') +
          '>‹</button>';
        for (var i = 1; i <= totalPages && i <= 7; i++) {
          html +=
            '<button type="button" data-p="' +
            i +
            '" class="' +
            (i === p ? 'is-active' : '') +
            '">' +
            i +
            '</button>';
        }
        if (totalPages > 7) html += '<span>…</span>';
        html +=
          '<button type="button" data-p="' +
          (p + 1) +
          '"' +
          (p >= totalPages ? ' disabled' : '') +
          '>›</button>';
        pages.innerHTML = html;
        pages.querySelectorAll('[data-p]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (btn.disabled) return;
            state.page = Number(btn.getAttribute('data-p')) || 1;
            renderGrid();
            document.getElementById('eq-dept-plp-main').scrollIntoView({ behavior: 'smooth' });
          });
        });
      }
    }
  }

  function normalizeUrlTip(tip) {
    if (!tip) return '';
    if (window.EqDeptTips && window.EqDeptTips.normalizeTipParam) {
      return window.EqDeptTips.normalizeTipParam(DEPT, tip) || tip;
    }
    return String(tip).replace(/_/g, '-');
  }

  function render() {
    renderGrid();
    var facets = renderFacets;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(facets);
    } else {
      setTimeout(facets, 0);
    }
  }

  function showError(msg) {
    var grid = document.getElementById('eq-dept-plp-grid');
    if (grid) {
      grid.innerHTML = '<p class="eq-dept-plp-status eq-dept-plp-status--err">' + esc(msg) + '</p>';
    }
  }

  function applyUrlState() {
    try {
      var sp = new URLSearchParams(location.search);
      var tip = normalizeUrlTip(sp.get('tip'));
      if (tip && findTile(tip)) state.activeTiles = [tip];
      var q = sp.get('q');
      if (q != null && String(q).trim()) {
        var arama =
          typeof window.eqAramaUrl === 'function'
            ? window.eqAramaUrl(String(q).trim())
            : '/arama?q=' + encodeURIComponent(String(q).trim());
        if (arama) {
          location.replace(arama);
          return;
        }
      }
    } catch (_) {}
  }

  function finishLoad(out) {
    state.all = out;
    state.ready = true;
    applyUrlState();
    render();
  }

  function loadEqustoServisTeshir() {
    return fetch('/data/ekipmanlar.json?v=' + CATALOG_V, { cache: 'no-store', headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('ekipmanlar HTTP ' + r.status);
        return r.json();
      })
      .then(function (catalog) {
        var list = Array.isArray(catalog) ? catalog : [];
        var out = [];
        for (var i = 0; i < list.length; i++) {
          var raw = list[i];
          if (!raw || String(raw.dept || '') !== 'market-reyon') continue;
          var u = normalizeRow(raw);
          if (!skipItem(u)) out.push(u);
        }
        return out;
      });
  }

  function loadMarketReyonCatalog() {
    var grid = document.getElementById('eq-dept-plp-grid');
    if (grid) grid.innerHTML = '<p class="eq-dept-plp-status">Katalog yükleniyor…</p>';

    if (!window.EqMarketReyon || typeof window.EqMarketReyon.loadCatalog !== 'function') {
      showError('Market reyon modülü yüklenemedi (eq-market-reyon.js).');
      return;
    }

    Promise.all([window.EqMarketReyon.loadCatalog(), loadEqustoServisTeshir()])
      .then(function (parts) {
        var out = [];
        var seen = {};
        function pushUnique(u) {
          var key =
            (u.raw && u.raw.id) ||
            (u.raw && u.raw.slug) ||
            lc(u.b) + '|' + lc(u.n);
          if (seen[key]) return;
          seen[key] = true;
          out.push(u);
        }
        for (var pi = 0; pi < parts.length; pi++) {
          var arr = parts[pi] || [];
          for (var i = 0; i < arr.length; i++) {
            var u = normalizeRow(arr[i]);
            if (!skipItem(u)) pushUnique(u);
          }
        }
        finishLoad(out);
      })
      .catch(function (e) {
        showError(
          'Servis & teşhir kataloğu yüklenemedi. npm run dev ile açın; /shop/market-reyonlari — ' +
            (e && e.message ? e.message : String(e))
        );
      });
  }

  function loadCatalog() {
    if (DEPT === 'market-reyon') {
      loadMarketReyonCatalog();
      return;
    }

    var grid = document.getElementById('eq-dept-plp-grid');
    if (grid) grid.innerHTML = '<p class="eq-dept-plp-status">Ürün listesi indiriliyor…</p>';

    fetch('/data/dept/' + DEPT + '.json?v=' + CATALOG_V, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.text();
      })
      .then(function (text) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            try {
              resolve(JSON.parse(text));
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      })
      .then(function (data) {
        var arr = Array.isArray(data) ? data : data && data.items ? data.items : [];
        var out = [];
        var i = 0;
        var CHUNK = DEPT === 'sogutma' ? 250 : 500;

        function step() {
          var end = Math.min(i + CHUNK, arr.length);
          for (; i < end; i++) {
            var u = normalizeRow(arr[i]);
            if (!skipItem(u)) out.push(u);
          }
          if (grid && i < arr.length) {
            grid.innerHTML =
              '<p class="eq-dept-plp-status">Ürünler hazırlanıyor… ' +
              Math.round((100 * i) / arr.length) +
              '%</p>';
            setTimeout(step, 0);
          } else {
            function afterChunk() {
              if (window.EqFiyatlarBridge && window.EqFiyatlarBridge.load) {
                window.EqFiyatlarBridge.load()
                  .then(function () {
                    try {
                      window.EqFiyatlarBridge.applyToList(out);
                    } catch (_) {}
                    finishLoad(out);
                  })
                  .catch(function () {
                    finishLoad(out);
                  });
              } else {
                finishLoad(out);
              }
            }
            afterChunk();
          }
        }
        step();
      })
      .catch(function (e) {
        showError(
          'Katalog yüklenemedi. npm run dev:fresh ile açın; adres: /shop/' + DEPT + ' — ' +
            (e && e.message ? e.message : String(e))
        );
      });
  }

  function bindSearch() {
    /* Üst arama: Meilisearch → /arama?q= (theme.js + eq-header-search.js). */
  }

  window.__eqDeptPlpSetSort = function (v) {
    state.sort = v || '';
    state.page = 1;
    if (state.ready) render();
  };

  function bindMobileFilter() {
    var mob = document.getElementById('eq-dept-plp-filter-mob');
    var bd = document.getElementById('eq-dept-filter-backdrop');
    if (mob) {
      mob.addEventListener('click', function () {
        document.body.classList.toggle('eq-dept-filter-open');
      });
    }
    if (bd) {
      bd.addEventListener('click', function () {
        document.body.classList.remove('eq-dept-filter-open');
      });
    }
  }

  function applyPageMeta() {
    var page = (window.EqDeptPlpPages && window.EqDeptPlpPages[DEPT]) || {};
    var title = page.title || '';
    var lead = page.lead || '';
    var h1 = document.querySelector('.eq-dept-plp-title');
    if (h1 && title) h1.textContent = title;
    var leadEl = document.querySelector('.eq-dept-plp-lead');
    if (leadEl && lead) leadEl.textContent = lead;
    var asideHd = document.querySelector('.eq-dept-plp-aside__hd');
    if (asideHd && title) asideHd.textContent = title;
  }

  document.addEventListener("equsto:kur-updated", function () {
    if (state.ready) render();
  });

  function boot() {
    applyPageMeta();
    bindSearch();
    bindMobileFilter();
    loadCatalog();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
