/**
 * Equsto PLP — Mobile Filter Bottom Sheet
 * Breakpoint: ≤768px
 * Pattern: Fixed "Filtrele (N)" button in toolbar → bottom sheet with same facets
 * Design: #0B0C0E bg, #5EEAD4 accent, glassmorphism backdrop-filter
 * State: Shared with desktop (eq-dept-plp.js state object)
 */
(function (global) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"');
  }

  function lc(s) {
    return String(s || '').toLocaleLowerCase('tr');
  }

  var SHEET_ID = 'eq-dept-filter-sheet';
  var BACKDROP_ID = 'eq-dept-filter-sheet-backdrop';
  var BTN_IDS = ['eq-dept-plp-filter-mob', 'eq-arama-filter-mob'];
  var COUNT_ATTR = 'data-active-count';
  var OPEN_CLASS = 'eq-dept-filter-sheet-open';

  function getPlpState() {
    // Try to get state from eq-dept-plp.js closure via window exposure
    if (global.__eqDeptPlpState) return global.__eqDeptPlpState;
    if (global.__eqAramaState) return global.__eqAramaState;
    // Fallback: read from DOM chips
    return null;
  }

  function countActiveFilters(state) {
    if (!state) return 0;
    var n = 0;
    // eq-dept-plp.js state structure
    if (Array.isArray(state.activeTiles)) n += state.activeTiles.length;
    if (Array.isArray(state.brands)) n += state.brands.length;
    if (Array.isArray(state.olcu)) n += state.olcu.length;
    if (Array.isArray(state.energy)) n += state.energy.length;
    if (Array.isArray(state.kuvetGn)) n += state.kuvetGn.length;
    if (Array.isArray(state.buzdolapTip)) n += state.buzdolapTip.length;
    if (Array.isArray(state.pisirmeTip)) n += state.pisirmeTip.length;
    if (Array.isArray(state.komurluIzgaraGrup)) n += state.komurluIzgaraGrup.length;
    if (state.priceMin !== '' && state.priceMin != null) n++;
    if (state.priceMax !== '' && state.priceMax != null) n++;
    // eq-arama-page.js filterState structure
    if (Array.isArray(state.depts)) n += state.depts.length;
    if (Array.isArray(state.kuvetGn)) n += state.kuvetGn.length;
    if (Array.isArray(state.buzdolapTip)) n += state.buzdolapTip.length;
    if (Array.isArray(state.pisirmeTip)) n += state.pisirmeTip.length;
    if (state.priceMin !== '' && state.priceMin != null) n++;
    if (state.priceMax !== '' && state.priceMax != null) n++;
    return n;
  }

  function updateButtonBadge() {
    var state = getPlpState();
    var count = state ? countActiveFilters(state) : 0;
    BTN_IDS.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;
      btn.setAttribute(COUNT_ATTR, String(count));
      var badge = btn.querySelector('.eq-filter-mob__badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'eq-filter-mob__badge';
          btn.appendChild(badge);
        }
        badge.textContent = String(count);
      } else if (badge) {
        badge.remove();
      }
    });
  }

  function buildSheetContent() {
    var state = getPlpState();
    if (!state) return '';

    // Detect page type
    var isArama = !!global.__eqAramaState && state === global.__eqAramaState;
    var isDeptPlp = !!global.__eqDeptPlpState && state === global.__eqDeptPlpState;

    if (isDeptPlp && global.EqDeptCmFacets) {
      // Use existing department PLP facet rendering
      var host = document.createElement('div');
      var tiles = (global.EqDeptTips && global.EqDeptTips.tilesFor)
        ? global.EqDeptTips.tilesFor(global.DEPT || 'pisirme')
        : [];
      var tileMatch = global.tileMatch;

      var opts = {
        dept: global.DEPT || 'pisirme',
        allProducts: state.all || [],
        state: state,
        tiles: tiles,
        tileMatch: tileMatch,
        getPoolForCounts: function (exclude) {
          var list = state.all || [];
          if (state.activeTiles && state.activeTiles.length && exclude !== 'tile') {
            list = list.filter(function (u) {
              for (var ti = 0; ti < state.activeTiles.length; ti++) {
                var tile = tiles.find(function (t) { return t.id === state.activeTiles[ti]; });
                if (tile && tileMatch && tileMatch(u, tile)) return true;
              }
              return false;
            });
          }
          if (state.brands && state.brands.length && exclude !== 'brand') {
            list = list.filter(function (u) {
              var fb = global.EqDeptCmFacets && global.EqDeptCmFacets.productBrand
                ? global.EqDeptCmFacets.productBrand(u)
                : '';
              return state.brands.indexOf(fb) >= 0;
            });
          }
          return list;
        },
        onChange: function () {
          if (typeof global.__eqDeptPlpRender === 'function') global.__eqDeptPlpRender();
          updateButtonBadge();
        },
      };
      global.EqDeptCmFacets.mount(host, opts);
      return host.innerHTML;
    }

    if (isArama && global.EqAramaFacets) {
      // Arama page facets - would need separate implementation
      // For now, return placeholder
      return '<div class="eq-cm-facet" open><div class="eq-cm-facet__hd">Filtreler (Arama sayfası için ayrı uygulanacak)</div></div>';
    }

    return '<div class="eq-cm-facet" open><div class="eq-cm-facet__hd">Filtreler yükleniyor…</div></div>';
  }

  function openSheet() {
    var sheet = document.getElementById(SHEET_ID);
    var backdrop = document.getElementById(BACKDROP_ID);
    if (!sheet) {
      sheet = createSheet();
      backdrop = document.getElementById(BACKDROP_ID);
    }
    document.body.classList.add(OPEN_CLASS);
    // Lock scroll
    var scrollY = window.scrollY || window.pageYOffset;
    document.body.style.top = -scrollY + 'px';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.dataset.eqScrollY = String(scrollY);
    // Focus trap
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('role', 'dialog');
    var firstFocusable = sheet.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();
  }

  function closeSheet() {
    document.body.classList.remove(OPEN_CLASS);
    // Restore scroll
    var scrollY = parseInt(document.body.dataset.eqScrollY || '0', 10);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    delete document.body.dataset.eqScrollY;
    var sheet = document.getElementById(SHEET_ID);
    if (sheet) sheet.removeAttribute('aria-modal');
  }

  function createSheet() {
    var sheet = document.createElement('div');
    sheet.id = SHEET_ID;
    sheet.className = 'eq-dept-filter-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'false');
    sheet.setAttribute('aria-label', 'Filtreler');

    var backdrop = document.createElement('div');
    backdrop.id = BACKDROP_ID;
    backdrop.className = 'eq-dept-filter-sheet-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    backdrop.addEventListener('click', closeSheet);

    var handle = document.createElement('div');
    handle.className = 'eq-dept-filter-sheet__handle';
    handle.setAttribute('aria-hidden', 'true');

    var header = document.createElement('div');
    header.className = 'eq-dept-filter-sheet__hd';
    header.innerHTML =
      '<h2 class="eq-dept-filter-sheet__title" data-i18n="plp.filters_mob">Filtreler</h2>' +
      '<button type="button" class="eq-dept-filter-sheet__close" aria-label="Kapat" data-i18n-attr="aria-label:common.close">×</button>';
    header.querySelector('.eq-dept-filter-sheet__close').addEventListener('click', closeSheet);

    var content = document.createElement('div');
    content.className = 'eq-dept-filter-sheet__content';
    content.id = 'eq-dept-filter-sheet-content';

    var actions = document.createElement('div');
    actions.className = 'eq-dept-filter-sheet__actions';
    actions.innerHTML =
      '<button type="button" class="eq-dept-filter-sheet__clear" data-i18n="plp.facet_clear_all">Temizle</button>' +
      '<button type="button" class="eq-dept-filter-sheet__apply" data-i18n="plp.facet_apply">Uygula</button>';
    actions.querySelector('.eq-dept-filter-sheet__clear').addEventListener('click', function () {
      var state = getPlpState();
      if (state && typeof global.__eqDeptPlpClearFilters === 'function') {
        global.__eqDeptPlpClearFilters();
      }
      updateButtonBadge();
      if (typeof global.__eqDeptPlpRender === 'function') global.__eqDeptPlpRender();
    });
    actions.querySelector('.eq-dept-filter-sheet__apply').addEventListener('click', closeSheet);

    sheet.appendChild(handle);
    sheet.appendChild(header);
    sheet.appendChild(content);
    sheet.appendChild(actions);
    document.body.appendChild(sheet);
    document.body.appendChild(backdrop);

    // Render facets into content
    renderFacets(content);

    // Handle escape key
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        closeSheet();
        document.removeEventListener('keydown', onKeyDown);
      }
    }
    document.addEventListener('keydown', onKeyDown);

    return sheet;
  }

  function renderFacets(container) {
    var state = getPlpState();
    if (!state) {
      container.innerHTML = '<div class="eq-cm-facet" open><div class="eq-cm-facet__hd">Filtreler yükleniyor…</div></div>';
      return;
    }

    var isArama = !!global.__eqAramaState && state === global.__eqAramaState;
    var isDeptPlp = !!global.__eqDeptPlpState && state === global.__eqDeptPlpState;

    if (isDeptPlp && global.EqDeptCmFacets) {
      var tiles = (global.EqDeptTips && global.EqDeptTips.tilesFor)
        ? global.EqDeptTips.tilesFor(global.DEPT || 'pisirme')
        : [];
      var tileMatch = global.tileMatch;

      var opts = {
        dept: global.DEPT || 'pisirme',
        allProducts: state.all || [],
        state: state,
        tiles: tiles,
        tileMatch: tileMatch,
        getPoolForCounts: function (exclude) {
          var list = state.all || [];
          if (state.activeTiles && state.activeTiles.length && exclude !== 'tile') {
            list = list.filter(function (u) {
              for (var ti = 0; ti < state.activeTiles.length; ti++) {
                var tile = tiles.find(function (t) { return t.id === state.activeTiles[ti]; });
                if (tile && tileMatch && tileMatch(u, tile)) return true;
              }
              return false;
            });
          }
          if (state.brands && state.brands.length && exclude !== 'brand') {
            list = list.filter(function (u) {
              var fb = global.EqDeptCmFacets && global.EqDeptCmFacets.productBrand
                ? global.EqDeptCmFacets.productBrand(u)
                : '';
              return state.brands.indexOf(fb) >= 0;
            });
          }
          return list;
        },
        onChange: function (kind) {
          if (kind === 'clear') {
            if (typeof global.__eqDeptPlpClearFilters === 'function') global.__eqDeptPlpClearFilters();
          }
          state.loadedCount = 24;
          if (typeof global.__eqDeptPlpRender === 'function') global.__eqDeptPlpRender();
          updateButtonBadge();
        },
      };
      global.EqDeptCmFacets.mount(container, opts);
      if (typeof global.eqI18nApply === 'function') {
        try { global.eqI18nApply(container); } catch (_) {}
      }
      return;
    }

    if (isArama) {
      container.innerHTML = '<div class="eq-cm-facet" open><div class="eq-cm-facet__hd" data-i18n="plp.filters_coming_soon">Arama sayfası filtreleri yakında</div></div>';
      return;
    }

    container.innerHTML = '<div class="eq-cm-facet" open><div class="eq-cm-facet__hd">Filtreler yükleniyor…</div></div>';
  }

  function init() {
    BTN_IDS.forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) return;

      // Remove the !important display:none from CSS by overriding inline
      btn.style.display = 'inline-flex';

      // Add click handler
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openSheet();
      });
    });

    // Expose state getter for badge updates
    global.__eqDeptPlpFilterMobUpdateBadge = updateButtonBadge;

    // Initial badge
    updateButtonBadge();

    // Listen for filter changes from desktop to update badge
    document.addEventListener('equsto:plp-filters-changed', updateButtonBadge);
  }

  // Expose for eq-dept-plp.js to call
  global.__eqDeptPlpFilterMob = {
    init: init,
    open: openSheet,
    close: closeSheet,
    updateBadge: updateButtonBadge,
  };

  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);