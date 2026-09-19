/**
 * Equsto PLP — Mobile Filter Left Drawer (CafeMarkt tarzı)
 * Breakpoint: ≤900px
 * Filtrele → soldan kayan aside (#eq-dept-plp-aside / #eq-arama-aside / #eq-filter-col)
 * Kategoriler accordion açık gelir.
 */
(function (global) {
  'use strict';

  var BTN_IDS = ['eq-dept-plp-filter-mob', 'eq-arama-filter-mob', 'eq-marka-plp-filter-mob'];
  var COUNT_ATTR = 'data-active-count';
  var OPEN_CLASS = 'eq-dept-filter-open';
  var SHEET_OPEN_CLASS = 'eq-dept-filter-sheet-open';

  function getPlpState() {
    if (global.__eqDeptPlpState) return global.__eqDeptPlpState;
    if (global.__eqAramaState) return global.__eqAramaState;
    return null;
  }

  function countActiveFilters(state) {
    if (!state) return 0;
    var n = 0;
    if (Array.isArray(state.activeTiles)) n += state.activeTiles.length;
    if (Array.isArray(state.brands)) n += state.brands.length;
    if (Array.isArray(state.olcu)) n += state.olcu.length;
    if (Array.isArray(state.energy)) n += state.energy.length;
    if (Array.isArray(state.kuvetGn)) n += state.kuvetGn.length;
    if (Array.isArray(state.buzdolapTip)) n += state.buzdolapTip.length;
    if (Array.isArray(state.pisirmeTip)) n += state.pisirmeTip.length;
    if (Array.isArray(state.komurluIzgaraGrup)) n += state.komurluIzgaraGrup.length;
    if (Array.isArray(state.depts)) n += state.depts.length;
    if (state.priceMin !== '' && state.priceMin != null) n++;
    if (state.priceMax !== '' && state.priceMax != null) n++;
    return n;
  }

  function updateButtonBadge() {
    var state = getPlpState();
    var count = state ? countActiveFilters(state) : 0;
    // Marka PLP: chip sayısını facet host'tan tahmin et
    if (!state) {
      var markaHost = document.getElementById('eq-marka-plp-facets');
      if (markaHost) {
        count = markaHost.querySelectorAll('.eq-cm-facet__label input:checked').length;
        if (markaHost.querySelector('#eq-dept-cm-price-min') && markaHost.querySelector('#eq-dept-cm-price-min').value) count++;
        if (markaHost.querySelector('#eq-dept-cm-price-max') && markaHost.querySelector('#eq-dept-cm-price-max').value) count++;
      }
    }
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

  function getDrawerAside() {
    return (
      document.getElementById('eq-dept-plp-aside') ||
      document.getElementById('eq-arama-aside') ||
      document.getElementById('eq-filter-col')
    );
  }

  function getBackdrop() {
    return (
      document.getElementById('eq-dept-filter-backdrop') ||
      document.getElementById('eq-arama-filter-backdrop') ||
      document.getElementById('eq-marka-filter-backdrop')
    );
  }

  function ensureBackdrop() {
    var backdrop = getBackdrop();
    if (backdrop) return backdrop;
    var aside = getDrawerAside();
    if (!aside || !aside.parentNode) return null;
    backdrop = document.createElement('div');
    backdrop.className = 'eq-dept-filter-backdrop';
    backdrop.id = document.body.classList.contains('eq-marka-plp')
      ? 'eq-marka-filter-backdrop'
      : 'eq-dept-filter-backdrop';
    backdrop.setAttribute('aria-hidden', 'true');
    aside.parentNode.insertBefore(backdrop, aside.nextSibling);
    return backdrop;
  }

  function expandFacetAccordions(root) {
    if (!root) return;
    root.querySelectorAll('details.eq-cm-facet').forEach(function (el) {
      el.open = true;
      el.setAttribute('open', '');
    });
  }

  function refreshFacetsInDrawer() {
    var isArama = !!document.getElementById('eq-arama-main');
    var isDept = !!global.__eqDeptPlpState;
    var isMarka = document.body.classList.contains('eq-marka-plp-shop') || document.body.classList.contains('eq-marka-plp');

    if (isDept && typeof global.__eqDeptPlpRender === 'function') {
      // Facets already live in aside; remount via existing render path if exposed
      var host = document.getElementById('eq-dept-plp-facets');
      if (host && global.EqDeptCmFacets && global.__eqDeptPlpPoolForFacetCounts) {
        var state = global.__eqDeptPlpState;
        var tiles =
          global.EqDeptTips && typeof global.EqDeptTips.tilesFor === 'function'
            ? global.EqDeptTips.tilesFor(global.DEPT || 'pisirme')
            : [];
        global.EqDeptCmFacets.mount(host, {
          dept: global.DEPT || 'pisirme',
          allProducts: (state && state.all) || [],
          state: state,
          tiles: tiles,
          tileMatch: global.tileMatch,
          getPoolForCounts: global.__eqDeptPlpPoolForFacetCounts,
          onChange: function (kind) {
            if (kind === 'clear' && typeof global.__eqDeptPlpClearFilters === 'function') {
              global.__eqDeptPlpClearFilters();
            }
            if (state) state.loadedCount = 24;
            if (typeof global.__eqDeptPlpRender === 'function') global.__eqDeptPlpRender();
            updateButtonBadge();
            expandFacetAccordions(host);
          },
        });
      }
      expandFacetAccordions(document.getElementById('eq-dept-plp-aside'));
      return;
    }

    if (isArama) {
      expandFacetAccordions(document.getElementById('eq-arama-aside'));
      return;
    }

    if (isMarka) {
      expandFacetAccordions(document.getElementById('eq-filter-col'));
    }
  }

  function lockScroll() {
    var scrollY = window.scrollY || window.pageYOffset;
    document.body.style.top = -scrollY + 'px';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.dataset.eqScrollY = String(scrollY);
  }

  function unlockScroll() {
    var scrollY = parseInt(document.body.dataset.eqScrollY || '0', 10);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    delete document.body.dataset.eqScrollY;
  }

  function openDrawer() {
    if (document.body.classList.contains(OPEN_CLASS)) {
      closeDrawer();
      return;
    }
    // Eski bottom sheet kalıntısını kapat
    document.body.classList.remove(SHEET_OPEN_CLASS);
    var oldSheet = document.getElementById('eq-dept-filter-sheet');
    if (oldSheet) oldSheet.classList.remove('open');
    var oldBd = document.getElementById('eq-dept-filter-sheet-backdrop');
    if (oldBd) oldBd.classList.remove('visible');

    var aside = getDrawerAside();
    var backdrop = ensureBackdrop();
    if (!aside) return;

    document.body.classList.add(OPEN_CLASS);
    if (backdrop) {
      backdrop.classList.add('visible');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    aside.setAttribute('aria-modal', 'true');
    aside.setAttribute('role', 'dialog');

    refreshFacetsInDrawer();
    expandFacetAccordions(aside);
    lockScroll();

    var closeBtn = aside.querySelector('.eq-dept-plp-aside__close, .eq-filter-drawer-close');
    var focusEl =
      closeBtn ||
      aside.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusEl) {
      try {
        focusEl.focus();
      } catch (_) {}
    }
  }

  function closeDrawer() {
    document.body.classList.remove(OPEN_CLASS);
    document.body.classList.remove(SHEET_OPEN_CLASS);
    var aside = getDrawerAside();
    var backdrop = getBackdrop();
    if (aside) {
      aside.removeAttribute('aria-modal');
      aside.removeAttribute('role');
    }
    if (backdrop) {
      backdrop.classList.remove('visible');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    unlockScroll();
  }

  function ensureAsideCloseButton(aside) {
    if (!aside || aside.querySelector('.eq-dept-plp-aside__close, .eq-filter-drawer-close')) return;

    var hd =
      aside.querySelector('.eq-dept-plp-aside__hd') ||
      aside.querySelector('.eq-filter-col-hd') ||
      null;

    if (!hd) {
      hd = document.createElement('div');
      hd.className = aside.id === 'eq-filter-col' ? 'eq-filter-col-hd' : 'eq-dept-plp-aside__hd';
      var title = document.createElement('span');
      title.className = aside.id === 'eq-filter-col' ? 'eq-filter-col-hd__title' : 'eq-dept-plp-aside__title';
      title.setAttribute('data-i18n', 'plp.filters');
      title.textContent = 'Filtreler';
      hd.appendChild(title);
      aside.insertBefore(hd, aside.firstChild);
    } else if (hd.classList.contains('eq-dept-plp-aside__hd') && !hd.querySelector('.eq-dept-plp-aside__title')) {
      var existing = (hd.textContent || '').trim();
      hd.textContent = '';
      var t = document.createElement('span');
      t.className = 'eq-dept-plp-aside__title';
      t.setAttribute('data-i18n', 'plp.filters');
      t.textContent = existing && existing !== 'Filtreler' ? 'Filtreler' : existing || 'Filtreler';
      hd.appendChild(t);
    }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = aside.id === 'eq-filter-col' ? 'eq-filter-drawer-close' : 'eq-dept-plp-aside__close';
    btn.setAttribute('aria-label', 'Kapat');
    btn.setAttribute('data-i18n-attr', 'aria-label:common.close');
    btn.textContent = '×';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      closeDrawer();
    });
    hd.appendChild(btn);
    hd.style.display = 'flex';
    hd.style.alignItems = 'center';
    hd.style.justifyContent = 'space-between';
    hd.style.gap = '8px';
  }

  function bindBackdropClick() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('.eq-dept-filter-backdrop')) {
        e.preventDefault();
        closeDrawer();
      }
    });
  }

  function init() {
    if (global.__eqDeptPlpFilterMobBound) return;
    global.__eqDeptPlpFilterMobBound = true;

    var aside = getDrawerAside();
    if (aside) ensureAsideCloseButton(aside);
    ensureBackdrop();
    bindBackdropClick();

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      var btn = t.closest(
        '#eq-dept-plp-filter-mob, #eq-arama-filter-mob, #eq-marka-plp-filter-mob',
      );
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      openDrawer();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains(OPEN_CLASS)) {
        closeDrawer();
      }
    });

    global.__eqDeptPlpFilterMobUpdateBadge = updateButtonBadge;
    updateButtonBadge();
    document.addEventListener('equsto:plp-filters-changed', updateButtonBadge);
  }

  global.__eqDeptPlpFilterMob = {
    init: init,
    open: openDrawer,
    close: closeDrawer,
    updateBadge: updateButtonBadge,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
