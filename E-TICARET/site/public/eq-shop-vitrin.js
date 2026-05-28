/**
 * Kategori / mağaza — Mutbex ürün kartı (rozet, sepete ekle, karşılaştır).
 * Şema HTML: EqCategoryShell + eq-home-mutbex.css
 */
(function (global) {
  'use strict';

  if (!document.body || !document.body.classList.contains('eq-shop')) return;
  if (document.body.classList.contains('eq-home')) return;
  if (document.body.classList.contains('admin-app')) return;
  if (document.body.classList.contains('bd-page')) return;
  if (document.body.classList.contains('eq-pfos')) return;
  if (document.body.classList.contains('eq-dept-plp')) return;

  document.body.classList.add('eq-shop-mutbex');

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/"/g, '&quot;');
  }

  function badgesHtml() {
    var badges = { showFreeShipping: true, showInstallments: true };
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var b = global.EqVitrinConfig.get().productBadges;
      if (b) badges = b;
    }
    var h = '';
    if (badges.showFreeShipping !== false) {
      h +=
        '<span class="eq-mx-badge eq-mx-badge--ship">' +
        esc(badges.freeShippingLabel || 'Ücretsiz kargo') +
        '</span>';
    }
    if (badges.showInstallments !== false) {
      h +=
        '<span class="eq-mx-badge eq-mx-badge--disc">' +
        esc(badges.installmentsLabel || '9 taksit') +
        '</span>';
    }
    return h;
  }

  function patch() {
    if (typeof global.renderCard !== 'function' || global.renderCard.__eqShopVitrin) return;
    var orig = global.renderCard;
    global.renderCard = function (u) {
      var base = orig(u);
      var wrapAttrs =
        global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function'
          ? global.EqustoCart.cardWrapAttrs(u)
          : '';
      var out = base.replace(
        '<div class="prod-card prod-card-wrap">',
        '<div class="prod-card prod-card-wrap"' + wrapAttrs + '>',
      ).replace('<div class="prod-card', '<div class="prod-card');
      if (out === base) {
        out = base.replace(
          '<div class="prod-card prod-card-wrap">',
          '<div class="prod-card prod-card-wrap"' + wrapAttrs + '>',
        );
      }
      var badgeBlock = badgesHtml();
      if (badgeBlock) {
        out = out.replace(
          /(<div class="prod-img"[^>]*>)([\s\S]*?)(<\/div>)/,
          '$1$2<div class="eq-mx-badges">' + badgeBlock + '</div>$3',
        );
      }
      var cartAttrs =
        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
          ? global.EqustoCart.cartAddButtonAttrs(u)
          : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
      var actions =
        '<div class="eq-mx-prod-actions">' +
        '<button type="button" class="eq-mx-act" data-eq-compare="1">Karşılaştır</button>' +
        '<button ' +
        cartAttrs +
        '>Sepete ekle</button></div>';
      out = out.replace(/<button[^>]*\beq-cart-add\b[^>]*>[\s\S]*?<\/button>/i, '');
      if (out.indexOf('eq-mx-prod-actions') < 0) {
        out = out.replace('</a>', '</a>' + actions);
      }
      return out;
    };
    global.renderCard.__eqShopVitrin = true;
    global.renderCard.__eqMxPatched = true;
  }

  function boot() {
    patch();
  }

  function buildTickerHtml() {
    var items = [
      { strong: '9 Taksit', text: 'vade farks\u0131z' },
      { strong: 'Ücretsiz kargo', text: '5.000 \u20ba üzeri' },
      { strong: 'Proje Fabrikası', text: 'anl\u0131k teklif' },
      { strong: 'Öztiryakiler', text: 'so\u011futma & pi\u015firme' },
    ];
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var cfg = global.EqVitrinConfig.get();
      var list =
        global.EqVitrinConfig.activeList && cfg.ticker
          ? global.EqVitrinConfig.activeList(cfg.ticker)
          : cfg.ticker;
      if (list && list.length) {
        items = list.map(function (t) {
          return { strong: t.strong || '', text: t.text || '' };
        });
      }
    }
    var chips = '';
    for (var i = 0; i < items.length; i++) {
      chips +=
        '<span class="eq-mx-ticker__item"><strong>' +
        esc(items[i].strong) +
        '</strong> ' +
        esc(items[i].text) +
        '</span>';
    }
    return (
      '<div class="eq-mx-ticker" aria-hidden="true"><div class="eq-mx-ticker__track">' +
      chips +
      chips +
      '</div></div>'
    );
  }

  function initHeroIn(root, slides) {
    root = root || document;
    var stage = root.querySelector('.eq-mx-hero__slides');
    if (!stage || !slides || !slides.length) {
      var hero = root.querySelector('.eq-mx-hero--dept');
      if (hero) hero.setAttribute('hidden', '');
      return;
    }
    var html = '';
    for (var i = 0; i < slides.length; i++) {
      var sl = slides[i];
      var bg = sl.image
        ? 'background-image:url(' + esc(attrPath(sl.image)) + ')'
        : sl.gradient
          ? 'background:' + sl.gradient
          : 'background:linear-gradient(120deg,#001e50,#0a3d7a)';
      html +=
        '<a class="eq-mx-hero__slide' +
        (i === 0 ? ' is-active' : '') +
        '" href="' +
        esc(attrPath(sl.href || '#')) +
        '" style="' +
        bg +
        '"><div class="eq-mx-hero__slide-cap"><h2>' +
        esc(sl.title || '') +
        '</h2><p>' +
        esc(sl.subtitle || '') +
        '</p></div></a>';
    }
    stage.innerHTML = html;
    var idx = 0;
    function setSlide(n) {
      var els = stage.querySelectorAll('.eq-mx-hero__slide');
      if (!els.length) return;
      idx = ((n % els.length) + els.length) % els.length;
      for (var j = 0; j < els.length; j++) els[j].classList.toggle('is-active', j === idx);
    }
    var prev = root.querySelector('.eq-mx-hero__nav--prev');
    var next = root.querySelector('.eq-mx-hero__nav--next');
    if (prev) prev.onclick = function () { setSlide(idx - 1); };
    if (next) next.onclick = function () { setSlide(idx + 1); };
    if (global.__eqMxHeroTimer) clearInterval(global.__eqMxHeroTimer);
    global.__eqMxHeroTimer = setInterval(function () { setSlide(idx + 1); }, 6000);
    setSlide(0);
  }

  function attrPath(p) {
    if (typeof global.eqAttrPath === 'function') return global.eqAttrPath(p);
    return p ? String(p) : '';
  }

  global.EqMutbex = {
    buildTickerHtml: buildTickerHtml,
    initHeroIn: initHeroIn,
    patchRenderCard: patch,
  };

  if (global.EqVitrinConfig && global.EqVitrinConfig.load) {
    global.EqVitrinConfig.load().then(boot);
  } else {
    boot();
  }
})(typeof window !== 'undefined' ? window : global);
