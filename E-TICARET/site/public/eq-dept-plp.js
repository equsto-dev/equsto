/**
 * Pişirme kategori PLP v2 — tek dosya, EqCategoryShell/catalog bağımlılığı yok.
 */
(function () {
  'use strict';

  function __plpT(k, fb, vars) {
    var s = fb || k;
    try {
      if (typeof window.eqT === 'function') {
        var v = window.eqT(k, null);
        if (v != null && v !== k) s = v;
      }
    } catch (_) {}
    if (vars) {
      Object.keys(vars).forEach(function (kk) {
        var val = vars[kk];
        s = String(s).replace(new RegExp('\\{' + kk + '\\}', 'g'), val);
        s = String(s).replace(new RegExp('%\\{' + kk + '\\}', 'g'), val);
      });
    }
    return s;
  }

  function displayProductName(item) {
    var n = item && item.n != null ? String(item.n) : '';
    if (!n) return '';
    if (window.eqLang === 'en' && typeof window.eqProductNameEn === 'function') {
      return window.eqProductNameEn(n, item.raw);
    }
    return n;
  }

  var PAGE_SIZE = 24;
  var CATALOG_V = '20260606yuksel-parts-rm3';
  var DEPT = (document.body && document.body.getAttribute('data-eq-dept')) || 'pisirme';
  /* Next.js URL slug → katalog dept id (data/dept/*.json) */
  if (DEPT === 'market-reyonlari') DEPT = 'market-reyon';
  var deptCoverImg = '';

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
    loadedCount: 24,
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
    if (raw && (Number(raw.fiyat_bekleniyor) === 1 || /teklif\s+için/i.test(String(raw.price || p || '')))) {
      return __plpT('plp.quote_contact', 'Teklif için iletişim');
    }
    if (raw && isOztiListeTlRow(raw) && /KDV\s*dahil/i.test(String(raw.price || p || ''))) {
      return String(raw.price || p || '').split('\n')[0];
    }
    if (raw && Number(raw.fiyat_tl) > 0) {
      return (
        '₺' +
        Math.round(Number(raw.fiyat_tl)).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) +
        ',00'
      );
    }
    if (raw && window.EqustoKurLive && typeof window.EqustoKurLive.priceForRow === 'function') {
      var live = window.EqustoKurLive.priceForRow(raw);
      if (live && !/€/.test(live)) return live;
    }
    var s = String(p || '').split('\n')[0];
    if (/€/.test(s)) return '';
    var n = parsePrice(p);
    if (!n) return '';
    return '₺' + n.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ',00';
  }

  function isPlpTechnicalImg(rel) {
    var s = String(rel || '').split('?')[0].replace(/\\/g, '/');
    var fn = s.split('/').pop().toLowerCase();
    if (/kesit/i.test(fn)) return true;
    if (/[-_]model-\d+\.(jpe?g|webp|png|gif)$/i.test(fn)) return true;
    if (/\/atalay\/p\d{2,3}\/atalay-adst-/i.test(s)) return true;
    return false;
  }

  function pickPlpHeroImage(images) {
    if (!images || !images.length) return '';
    var i;
    for (i = 0; i < images.length; i++) {
      var fn = String(images[i] || '')
        .split('/')
        .pop()
        .toLowerCase();
      if (/kapak/i.test(fn)) return images[i];
    }
    for (i = 0; i < images.length; i++) {
      if (!isPlpTechnicalImg(images[i])) return images[i];
    }
    return images[0];
  }

  function imgSrc(p) {
    if (!p) return '';
    if (typeof window.eqProductImgSrc === 'function') {
      try {
        var resolved = window.eqProductImgSrc(p);
        if (resolved) return resolved;
      } catch (_) {}
    }
    var s = String(p).replace(/\\/g, '/').replace(/^\.\//, '');
    if (/^caglayan-market\//i.test(s) || /^prosogutma-market\//i.test(s)) {
      return '/data/' + s.replace(/^data\//, '');
    }
    if (/^https?:\/\//i.test(s)) {
      try {
        if (typeof window.eqAllowRemoteImages === 'function' && window.eqAllowRemoteImages()) return s;
      } catch (_) {}
      return '';
    }
    if (s.charAt(0) === '/') return s;
    if (/^images\/catalog\//i.test(s)) return '/' + s;
    if (/^images\/home\//i.test(s)) return '/' + s;
    if (typeof window.equstoDataAssetHref === 'function') {
      try {
        return window.equstoDataAssetHref(s);
      } catch (_) {}
    }
    return '/data/' + s.replace(/^data\//, '');
  }

  /** __eqImgFail için katalog yolu (yerel /images + CDN yedek). */
  function plpImgRawAttr(rawPath) {
    var s = String(rawPath || '')
      .trim()
      .replace(/\\/g, '/');
    if (!s) return '';
    if (/^https?:\/\//i.test(s)) return '';
    if (/^\/images\/(catalog|home)\//i.test(s)) return s.replace(/^\//, '');
    if (/^images\/(catalog|home)\//i.test(s)) return s;
    if (/^\/data\/images\//i.test(s)) return 'images/' + s.replace(/^\/data\/images\//i, '');
    if (/^images\//i.test(s)) return s;
    if (/\.(jpe?g|png|webp|gif)(\?|#|$)/i.test(s)) return 'images/' + s.replace(/^\/+/, '');
    return '';
  }

  function dimLabelFromMm(g, d, y) {
    if (!g || !d || !y) return '';
    if (g >= 1000 && d >= 1000) {
      return Math.round(g / 10) + '×' + Math.round(d / 10) + '×' + Math.round(y / 10) + ' cm';
    }
    return g + '×' + d + '×' + y + ' mm';
  }

  /** Öztiryakiler soğuk/derin dondurucu oda (7919.CR / 7919.DF) — PDF ölçü istisnaları. */
  var OZTI_PANEL_DIMS_MM = {
    '7919.CR1517.00': [1500, 1750, 2400],
    '7919.CR2022.00': [2000, 2250, 2400],
    '7919.CR2517.00': [2500, 1750, 2400],
    '7919.CR3017.00': [3000, 1750, 2400],
    '7919.DF1517.00': [1500, 1750, 2400],
    '7919.DF2015.00': [2500, 1500, 2400],
    '7919.DF2020.00': [2000, 2250, 2400],
    '7919.DF2022.00': [2000, 2000, 2400],
    '7919.DF2517.00': [2500, 1750, 2400],
    '7919.DF3017.00': [3000, 1750, 2400],
  };

  function oztiPanelDimsFromSku(sku) {
    var k = String(sku || '')
      .trim()
      .toUpperCase();
    if (!k) return null;
    if (OZTI_PANEL_DIMS_MM[k]) return OZTI_PANEL_DIMS_MM[k];
    var m = k.match(/^7919\.(DF|CR)(\d{2})(\d{2})\.00$/);
    if (!m) return null;
    return [Number(m[2]) * 100, Number(m[3]) * 100, 2400];
  }

  function parseDimsFromName(name) {
    var s = String(name || '');
    var mStar = s.match(/(\d{2,4})\*(\d{2,3})\*(\d{2,4})/);
    if (mStar) {
      return dimLabelFromMm(+mStar[1] * 10, +mStar[2] * 10, +mStar[3] * 10);
    }
    var mCm = s.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*cm\b/i);
    if (mCm) {
      return dimLabelFromMm(+mCm[1] * 10, +mCm[2] * 10, +mCm[3] * 10);
    }
    var mMm = s.match(/(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*[xX×]\s*(\d{2,4})\s*mm\.?/i);
    if (mMm) {
      return dimLabelFromMm(+mMm[1], +mMm[2], +mMm[3]);
    }
    return '';
  }

  /** PLP kart alt satırı — olculer, ürün adı veya Öztiryakiler oda kodu. */
  function formatOlculerLine(raw) {
    if (!raw) return '';
    var o = raw.olculer;
    if (o) {
      var g = Number(o.genislik_mm);
      var d = Number(o.derinlik_mm);
      var y = Number(o.yukseklik_mm);
      if (g && d && y) {
        var nameHasDim = /[xX×]\s*\d/.test(String(raw.name || ''));
        if (!nameHasDim) return dimLabelFromMm(g, d, y);
      }
    }
    var fromName = parseDimsFromName(raw.name);
    if (fromName) return fromName;
    var panel = oztiPanelDimsFromSku(raw.sku || raw.model || raw.urun_kodu);
    if (panel) return dimLabelFromMm(panel[0], panel[1], panel[2]);
    return '';
  }

  /** Fiyat altı kısa açıklama — vitrinde gösterilmez (liste/iskonto metni kaldırıldı). */
  function formatPriceNote() {
    return '';
  }

  function productUrl(item) {
    var raw = item.raw;
    if (raw && typeof window.eqProductPath === 'function') {
      var idSlug =
        typeof window.eqProductSlug === 'function'
          ? window.eqProductSlug(raw)
          : String(raw.id || '').trim();
      if (idSlug) {
        return window.eqProductPath(DEPT, idSlug);
      }
    }
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

  /** Excel TL liste — canlı kur ile EUR gibi çarpılmasın. */
  function isOztiListeTlRow(raw) {
    if (!raw) return false;
    var p = String(raw.para_birimi || '').trim().toUpperCase();
    return p === 'TL' || p === 'TRY';
  }

  function isCayExcludedFromKahve(item) {
    if (!item) return false;
    var raw = item.raw || {};
    var kod = String(raw.urun_kodu || raw.sku || raw.model || '')
      .replace(/\s+/g, '')
      .toUpperCase();
    var n = lc(item.n || '');
    if (/^8574\.CM/i.test(kod)) return true;
    if (/^8573\./.test(kod) && !/^8573\.000/.test(kod)) return true;
    if (/^8573\.000/.test(kod)) return true;
    if (n.indexOf('kahveci deml') >= 0) return true;
    if (n.indexOf('çay mak') >= 0 || n.indexOf('cay mak') >= 0) return true;
    if (n.indexOf('çay kazan') >= 0 || n.indexOf('cay kazan') >= 0) return true;
    return false;
  }

  function skipItem(item) {
    if (DEPT === 'kuvetler') {
      if (!(item && item.raw && isOztiRow(item.raw))) return true;
      if (window.EqDeptTips && typeof window.EqDeptTips.isKuvetProduct === 'function') {
        return !window.EqDeptTips.isKuvetProduct(item);
      }
      return false;
    }
    if (DEPT === 'set-ustu-mutfak') {
      return !(item && item.raw && isOztiRow(item.raw));
    }
    if (DEPT === 'kahve' && isCayExcludedFromKahve(item)) return true;
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
    if (window.EqDeptCmFacets && window.EqDeptCmFacets.facetBrandKey) {
      return window.EqDeptCmFacets.facetBrandKey((u && u.fb) || (u && u.b) || '');
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
    if (typeof window.eqPolishDisplayText === 'function') {
      n = window.eqPolishDisplayText(n);
    }
    var fb = b;
    if (window.EqDeptCmFacets && window.EqDeptCmFacets.resolveFacetBrand) {
      fb =
        window.EqDeptCmFacets.resolveFacetBrand(
          b,
          n,
          x.sku || x.urun_kodu || x.model,
          x.oem_brand
        ) ||
        (x.oem_brand ? String(x.oem_brand).trim() : '') ||
        b;
    } else if (x.oem_brand) {
      fb = String(x.oem_brand).trim();
    }
    var row = x;
    if (
      window.EqustoKurLive &&
      typeof window.EqustoKurLive.applyRowPrices === 'function' &&
      !isOztiListeTlRow(x)
    ) {
      row = window.EqustoKurLive.applyRowPrices(x) || x;
    }
    var priceLine =
      window.EqustoKurLive && typeof window.EqustoKurLive.priceForRow === 'function'
        ? window.EqustoKurLive.priceForRow(row)
        : String(row.price || '').split('\n')[0];
    var imgRel = '';
    if (row.images && row.images.length) {
      imgRel = pickPlpHeroImage(row.images);
    }
    var ozSku = String(row.sku || row.urun_kodu || row.model || '');
    if (row.category === 'soguk-odalar' || /7919\.CR/i.test(ozSku)) {
      imgRel = 'images/catalog/soguk-oda/soguk-oda-vitrin.png';
    }
    if (!imgRel && isOztiRow(row)) {
      if (typeof window.eqOztiWebRelFromSku === 'function') {
        imgRel = window.eqOztiWebRelFromSku(row.sku || row.model || row.urun_kodu) || imgRel;
      }
      if (!imgRel && typeof window.eqOztiAxImageFromSku === 'function') {
        imgRel = window.eqOztiAxImageFromSku(row.sku || row.model || row.urun_kodu) || imgRel;
      }
    }
    var imgOut = '';
    if (imgRel) imgOut = imgSrc(imgRel) || '';
    if (!imgOut && isOztiRow(row) && ozSku && typeof window.eqOztiAxImageFromSku === 'function') {
      imgOut = window.eqOztiAxImageFromSku(ozSku) || '';
    }
    return {
      c: row.category || '',
      b: b,
      fb: fb,
      n: n,
      p: priceLine,
      img: imgOut,
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
    state.loadedCount = PAGE_SIZE;
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
      state.loadedCount = PAGE_SIZE;
      render();
    }
    var main = document.getElementById('eq-dept-cm-chips-main');
    if (main) window.EqDeptCmFacets.renderSelectedChips(main, state, tiles, tileMatch, onRemove);
    var asideChips = document.getElementById('eq-dept-cm-chips');
    if (asideChips) window.EqDeptCmFacets.renderSelectedChips(asideChips, state, tiles, tileMatch, onRemove);
  }

  function syncTipInUrl() {
    if (DEPT !== 'kuvetler') return;
    try {
      var u = new URL(location.href);
      if (state.activeTiles.length === 1) u.searchParams.set('tip', state.activeTiles[0]);
      else u.searchParams.delete('tip');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (_) {}
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
        state.loadedCount = PAGE_SIZE;
        document.body.classList.remove('eq-dept-filter-open');
        syncTipInUrl();
        render();
      },
    });
    renderSelectedChips();
  }

  function renderProductCard(u) {
    var href = productUrl(u);
    var catalogRel =
      u.raw && u.raw.images && u.raw.images[0]
        ? String(u.raw.images[0]).replace(/\\/g, '/').replace(/^\//, '')
        : '';
    var rawImg = /^https?:\/\//i.test(catalogRel) ? '' : catalogRel || '';
    if (!rawImg && u.raw && u.raw.images && u.raw.images[0]) {
      rawImg = plpImgRawAttr(u.raw.images[0]) || '';
    }
    var oztiKod =
      u.raw && isOztiRow(u.raw) ? String(u.raw.sku || u.raw.model || u.raw.urun_kodu || '') : '';
    var img = u.img
      ? '<img src="' +
        esc(u.img) +
        '"' +
        (rawImg ? ' data-eq-img-raw="' + esc(rawImg) + '" data-eq-img-step="0"' : '') +
        (oztiKod ? ' data-eq-ozti-kod="' + esc(oztiKod) + '"' : '') +
        ' alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="typeof __eqImgFail===\'function\'&&__eqImgFail(this)">'
      : '';
    var cartBtn =
      window.EqustoCart && typeof window.EqustoCart.cartAddButtonAttrs === 'function'
        ? '<button class="eq-dept-plp-card__btn" ' +
          window.EqustoCart.cartAddButtonAttrs(u) +
          '>' + __plpT('plp.add_to_cart', 'SEPETE EKLE') + '</button>'
        : '<button type="button" class="eq-dept-plp-card__btn">' + __plpT('plp.add_to_cart', 'SEPETE EKLE') + '</button>';
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
      esc(displayProductName(u)) +
      '</a>' +
      (function () {
        var dim = formatOlculerLine(u.raw);
        return dim ? '<div class="eq-dept-plp-card__dims">' + esc(dim) + '</div>' : '';
      })() +
      (u.p
        ? '<div class="eq-dept-plp-card__price">' + esc(formatPrice(u.p, u.raw)) + '</div>'
        : '') +
      (function () {
        var note = formatPriceNote(u.raw);
        return note ? '<div class="eq-dept-plp-card__price-note">' + esc(note) + '</div>' : '';
      })() +
      cartBtn +
      '</article>'
    );
  }

  function renderLoadMore(list) {
    var host = document.getElementById('eq-dept-plp-pages');
    if (!host) return;
    var shown = Math.min(state.loadedCount, list.length);
    var remaining = list.length - shown;
    if (!list.length || remaining <= 0) {
      host.innerHTML = '';
      host.hidden = true;
      return;
    }
    host.hidden = false;
    host.className = 'eq-dept-plp-loadmore';
    host.setAttribute('aria-label', __plpT('plp.load_more_aria', 'Daha fazla ürün yükle'));
    host.innerHTML =
      '<button type="button" class="eq-dept-plp-loadmore__btn" id="eq-dept-plp-loadmore-btn">' +
      __plpT('plp.load_more', 'Daha fazla ürün yükle') +
      '<span class="eq-dept-plp-loadmore__meta">(' +
      remaining +
      ' ' + __plpT('plp.remaining', 'kaldı)') +
      '</span>' +
      '</button>';
    var btn = document.getElementById('eq-dept-plp-loadmore-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        state.loadedCount = Math.min(state.loadedCount + PAGE_SIZE, list.length);
        renderGrid();
      });
    }
  }

  function renderGrid() {
    var grid = document.getElementById('eq-dept-plp-grid');
    var countEl = document.getElementById('eq-dept-plp-count');
    if (!grid) return;

    if (!state.ready) {
      grid.innerHTML = '<p class="eq-dept-plp-status">' + esc(__plpT('plp.loading_catalog', 'Katalog yükleniyor…')) + '</p>';
      if (countEl) countEl.textContent = '';
      return;
    }

    var list = filtered();
    try {
      window.__eqDeptPlpResultCount = list.length;
    } catch (_) {}
    if (state.loadedCount < PAGE_SIZE) state.loadedCount = PAGE_SIZE;
    if (state.loadedCount > list.length) state.loadedCount = list.length;
    var slice = list.slice(0, state.loadedCount);
    var shown = slice.length;

    if (countEl) {
      if (!list.length) {
        countEl.innerHTML = '';
      } else if (shown < list.length) {
        var ofLbl = __plpT('plp.showing_of', '{shown} / {total} ürün gösteriliyor.', {
          shown: shown,
          total: list.length,
        });
        countEl.innerHTML = ofLbl
          .replace(String(shown), '<strong>' + shown + '</strong>')
          .replace(String(list.length), '<strong>' + list.length + '</strong>');
      } else {
        var allLbl = __plpT('plp.showing_all', '{total} ürün görüntüleniyor.', { total: list.length });
        countEl.innerHTML = allLbl.replace(String(list.length), '<strong>' + list.length + '</strong>');
      }
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
        '<p class="eq-dept-plp-empty">' + esc(__plpT('plp.empty_filter', 'Bu filtrelere uygun ürün bulunamadı.')) + '</p>';
    } else {
      grid.innerHTML = slice.map(renderProductCard).join('');
      if (typeof window.eqFixDataImagesInDom === 'function') window.eqFixDataImagesInDom(grid);
      try {
        if (window.EqustoProductTint && typeof window.EqustoProductTint.refreshPlp === 'function') {
          window.EqustoProductTint.refreshPlp(grid);
        } else {
          document.dispatchEvent(new CustomEvent('equsto:plp-grid-updated', { detail: { root: grid } }));
        }
      } catch (_) {}
    }

    renderLoadMore(list);
  }

  function normalizeUrlTip(tip) {
    if (!tip) return '';
    if (window.EqDeptTips && window.EqDeptTips.normalizeTipParam) {
      return window.EqDeptTips.normalizeTipParam(DEPT, tip) || tip;
    }
    return String(tip).replace(/_/g, '-');
  }

  function render() {
    state.loadedCount = PAGE_SIZE;
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

  function resolveMarkaFacetLabel(raw) {
    var label = String(raw || '').trim();
    if (!label) return '';
    try {
      if (typeof window.eqBrandFacetLabel === 'function') {
        var fromSlug = window.eqBrandFacetLabel(label);
        if (fromSlug) label = fromSlug;
      }
    } catch (_) {}
    if (!state.all || !state.all.length) return label;
    var want = label.toLocaleLowerCase('tr');
    var keys = {};
    state.all.forEach(function (u) {
      var k = brandKey(u);
      if (k) keys[k] = true;
    });
    if (keys[label]) return label;
    var hit = Object.keys(keys).filter(function (k) {
      return k.toLocaleLowerCase('tr') === want || k.toLocaleLowerCase('tr').indexOf(want) === 0;
    });
    if (hit.length === 1) return hit[0];
    if (hit.length > 1) {
      hit.sort(function (a, b) {
        return a.length - b.length;
      });
      return hit[0];
    }
    return label;
  }

  function applyUrlState() {
    try {
      var sp = new URLSearchParams(location.search);
      var markaRaw = sp.get('marka') || sp.get('brand');
      if (markaRaw) {
        var facet = resolveMarkaFacetLabel(decodeURIComponent(markaRaw));
        if (facet) state.brands = [facet];
      }
      var tip = normalizeUrlTip(sp.get('tip'));
      if (tip && findTile(tip)) state.activeTiles = [tip];
      var q = sp.get('q');
      if (q != null && String(q).trim()) {
        if (DEPT === 'market-reyon') {
          var qTrim = String(q).trim();
          var seriesTip =
            window.EqDeptTips && typeof window.EqDeptTips.resolveCaglayanSeriesTip === 'function'
              ? window.EqDeptTips.resolveCaglayanSeriesTip(qTrim)
              : '';
          if (seriesTip && findTile(seriesTip)) {
            state.activeTiles = [seriesTip];
            try {
              var u = new URL(location.href);
              u.searchParams.delete('q');
              u.searchParams.set('tip', seriesTip);
              history.replaceState(null, '', u.pathname + u.search + u.hash);
            } catch (_) {}
            return;
          }
          state.q = qTrim;
          return;
        }
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

  var MARKET_REYON_JSON_V = '20260528caglayan-pdp-fix';

  function fetchMarketReyonDeptJson() {
    return fetch('/data/dept/market-reyon.json?v=' + MARKET_REYON_JSON_V, {
      cache: 'default',
      headers: { Accept: 'application/json' },
    })
      .then(function (r) {
        if (!r.ok) throw new Error('market-reyon.json HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!Array.isArray(data)) throw new Error('market-reyon.json geçersiz');
        return data;
      });
  }

  function loadMarketReyonCatalog() {
    var grid = document.getElementById('eq-dept-plp-grid');
    if (grid) grid.innerHTML = '<p class="eq-dept-plp-status">' + esc(__plpT('plp.loading_catalog', 'Katalog yükleniyor…')) + '</p>';

    var loadDept =
      window.EqMarketReyon && typeof window.EqMarketReyon.loadCatalog === 'function'
        ? window.EqMarketReyon.loadCatalog()
        : fetchMarketReyonDeptJson();

    loadDept
      .then(function (arr) {
        var out = [];
        var list = Array.isArray(arr) ? arr : [];
        for (var i = 0; i < list.length; i++) {
          var u = normalizeRow(list[i]);
          if (!skipItem(u)) out.push(u);
        }
        finishLoad(out);
      })
      .catch(function (e) {
        showError(
          __plpT('plp.market_error_dev', 'Servis & teşhir kataloğu yüklenemedi. npm run dev ile açın; /shop/market-reyonlari — ') +
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
    if (grid) grid.innerHTML = '<p class="eq-dept-plp-status">' + esc(__plpT('plp.loading_products', 'Ürün listesi indiriliyor…')) + '</p>';

    function parseDeptText(text) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () {
          try {
            var safe = String(text || '').replace(/\bNaN\b/g, 'null');
            resolve(JSON.parse(safe));
          } catch (e) {
            reject(e);
          }
        }, 0);
      });
    }

    function fetchDeptArray() {
      var catalogDept = DEPT === 'kuvetler' ? 'set-ustu-mutfak' : DEPT;
      return fetch('/data/dept/' + catalogDept + '.json?v=' + CATALOG_V, {
        cache: 'default',
        headers: { Accept: 'application/json' },
      })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(parseDeptText)
        .then(function (data) {
          return Array.isArray(data) ? data : data && data.items ? data.items : [];
        });
    }

    fetchDeptArray()
      .then(function (arr) {
        if (!arr.length) {
          throw new Error(
            'dept/' + (DEPT === 'kuvetler' ? 'set-ustu-mutfak' : DEPT) + '.json bos veya bulunamadi'
          );
        }
        return arr;
      })
      .then(function (arr) {
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
              '<p class="eq-dept-plp-status">' + esc(__plpT('plp.preparing_products', 'Ürünler hazırlanıyor…')) + ' ' +
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
          __plpT('plp.catalog_error_dev', 'Katalog yüklenemedi. npm run dev:fresh ile açın; adres: /shop/{dept} — ', { dept: DEPT }) +
            (e && e.message ? e.message : String(e))
        );
      });
  }

  function bindSearch() {
    /* Üst arama: Meilisearch → /arama?q= (theme.js + eq-header-search.js). */
  }

  window.__eqDeptPlpSetSort = function (v) {
    state.sort = v || '';
    state.loadedCount = PAGE_SIZE;
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
    if (h1 && title && !h1.getAttribute('data-i18n')) h1.textContent = title;
    var leadEl = document.querySelector('.eq-dept-plp-lead');
    if (leadEl && lead && !leadEl.getAttribute('data-i18n')) leadEl.textContent = lead;
    var asideHd = document.querySelector('.eq-dept-plp-aside__hd');
    if (asideHd && title && !asideHd.getAttribute('data-i18n')) asideHd.textContent = title;
    try {
      if (typeof window.eqI18nApply === 'function') window.eqI18nApply(document.querySelector('.eq-dept-plp-layout') || document);
    } catch (_) {}
  }

  function refreshAllPrices() {
    if (!state.ready || !state.all.length) return;
    for (var ki = 0; ki < state.all.length; ki++) {
      var src = state.all[ki].raw || state.all[ki];
      var nx = normalizeRow(src);
      if (window.EqFiyatlarBridge && window.EqFiyatlarBridge.applyToRow) {
        window.EqFiyatlarBridge.applyToRow(nx);
      }
      state.all[ki] = nx;
    }
    render();
  }

  document.addEventListener("equsto:kur-updated", refreshAllPrices);
  window.__eqDeptPlpRefreshPrices = refreshAllPrices;

  function loadDeptCover(cb) {
    fetch('/data/category-covers.json?v=' + CATALOG_V, { cache: 'no-store' })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (data) {
        if (data && data.byDept && data.byDept[DEPT]) {
          deptCoverImg = String(data.byDept[DEPT]).replace(/^\//, '');
        }
      })
      .catch(function () {})
      .finally(function () {
        if (typeof cb === 'function') cb();
      });
  }

  function whenI18nReady(fn) {
    function afterDict() {
      if (window.eqLang === 'en' && typeof window.eqLoadProductEnOverlay === 'function') {
        return window.eqLoadProductEnOverlay().then(fn);
      }
      return fn();
    }
    if (window.eqI18nReady && typeof window.eqI18nReady.then === 'function') {
      return window.eqI18nReady.then(afterDict);
    }
    try {
      if (typeof window.eqT === 'function') {
        var probe = window.eqT('plp.add_to_cart', null);
        if (probe && probe !== 'plp.add_to_cart') return Promise.resolve(afterDict());
      }
    } catch (_) {}
    return new Promise(function (resolve) {
      window.addEventListener(
        'equsto:i18n-ready',
        function () {
          resolve(afterDict());
        },
        { once: true }
      );
    });
  }

  function boot() {
    bindSearch();
    bindMobileFilter();
    loadDeptCover(loadCatalog);
  }

  function start() {
    applyPageMeta();
    boot();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      whenI18nReady(start);
    });
  } else {
    whenI18nReady(start);
  }

  document.addEventListener('equsto:i18n-ready', function () {
    applyPageMeta();
    if (window.eqLang === 'en' && typeof window.eqLoadProductEnOverlay === 'function') {
      window.eqLoadProductEnOverlay().then(function () {
        if (state.ready) render();
      });
      return;
    }
    if (state.ready) render();
  });
})();
