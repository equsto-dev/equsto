import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-shop-vitrin.js");

const code = `/**
 * Mutbex vitrin — kategori sayfalari + paylasilan urun karti (EqMutbex).
 */
(function (global) {
  'use strict';

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

  function isMutbexPage() {
    var b = document.body;
    return b && (b.classList.contains('eq-home-mutbex') || b.classList.contains('eq-shop-mutbex'));
  }

  function badgesHtml() {
    var badges = { showFreeShipping: true, showInstallments: true };
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var b = global.EqVitrinConfig.get().productBadges;
      if (b) badges = b;
    }
    var h = '';
    if (badges.showFreeShipping !== false) {
      h += '<span class="eq-mx-badge eq-mx-badge--ship">' + esc(badges.freeShippingLabel || 'Ücretsiz kargo') + '</span>';
    }
    if (badges.showInstallments !== false) {
      h += '<span class="eq-mx-badge eq-mx-badge--disc">' + esc(badges.installmentsLabel || '9 taksit') + '</span>';
    }
    return h;
  }

  function productActionsHtml(u) {
    var cartAttrs = global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
      ? global.EqustoCart.cartAddButtonAttrs(u)
      : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
    return '<motion class="eq-mx-prod-actions">' +
      '<button type="button" class="eq-mx-act" data-eq-compare="1">Karşılaştır</button>' +
      '<button ' + cartAttrs + '>Sepete ekle</button></motion>';
  }

  function renderSpotCard(u, opts) {
    opts = opts || {};
    var href = opts.href || '#';
    var name = (u.n || '').substring(0, 72) + ((u.n || '').length > 72 ? '\\u2026' : '');
    var img = u.img ? '<img src="' + esc(attrPath(u.img)) + '" alt="" loading="lazy" decoding="async">' : '';
    var badgeBlock = badgesHtml();
    var wrapAttrs = global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function'
      ? global.EqustoCart.cardWrapAttrs(u) : '';
    var priceHtml = u.p ? '<div class="eq-mx-spot-card__price">₺' + esc(u.p) + '</div>' : '';
    var inner = '<a class="eq-mx-spot-card" href="' + esc(attrPath(href)) + '">' +
      '<div class="eq-mx-spot-card__img">' + img +
      (badgeBlock ? '<motion class="eq-mx-badges">' + badgeBlock + '</motion>' : '') +
      '</div><div class="eq-mx-spot-card__body">' +
      '<div class="eq-mx-spot-card__brand">' + esc(u.b || '') + '</div>' +
      '<div class="eq-mx-spot-card__name">' + esc(name) + '</motion>' + priceHtml + '</div></a>';
    inner = inner.replace(/<\\/motion>/g, '</div>').replace(/<motion class="/g, '<div class="');
    if (opts.withActions === false) return '<div class="eq-mx-spot-wrap"' + wrapAttrs + '>' + inner + '</div>';
    return '<div class="eq-mx-spot-wrap prod-card-wrap"' + wrapAttrs + '>' + inner + productActionsHtml(u).replace(/<\\/motion>/g, '</div>').replace(/<motion class="/g, '<motion class="'.replace('<motion class="', '<div class="')) + '</div>';
  }

  function buildTickerHtml() {
    var items = [
      { strong: '9 Taksit', text: 'vade farksız' },
      { strong: 'Ücretsiz kargo', text: '5.000 ₺ üzeri' },
      { strong: 'Proje Fabrikası', text: 'anlık teklif' },
      { strong: 'Öztiryakiler', text: 'soğutma & pişirme' }
    ];
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var cfg = global.EqVitrinConfig.get();
      var list = global.EqVitrinConfig.activeList && cfg.ticker ? global.EqVitrinConfig.activeList(cfg.ticker) : cfg.ticker;
      if (list && list.length) items = list.map(function (t) { return { strong: t.strong || '', text: t.text || '' }; });
    }
    var chips = '';
    for (var i = 0; i < items.length; i++) {
      chips += '<span class="eq-mx-ticker__item"><strong>' + esc(items[i].strong) + '</strong> ' + esc(items[i].text) + '</span>';
    }
    return '<div class="eq-mx-ticker" aria-hidden="true"><div class="eq-mx-ticker__track">' + chips + chips + '</div></div>';
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
      var s = slides[i];
      var bg = s.image ? 'background-image:url(' + esc(attrPath(s.image)) + ')' : (s.gradient ? 'background:' + s.gradient : 'background:linear-gradient(120deg,#001e50,#0a3d7a)');
      html += '<a class="eq-mx-hero__slide' + (i === 0 ? ' is-active' : '') + '" href="' + esc(attrPath(s.href || '#')) + '" style="' + bg + '"><motion class="eq-mx-hero__slide-cap"><h2>' + esc(s.title || '') + '</h2><p>' + esc(s.subtitle || '') + '</p></motion></a>';
    }
    html = html.replace(/<\\/motion>/g, '</div>').replace(/<motion class="/g, '<div class="');
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

  function patchRenderCard() {
    if (typeof global.renderCard !== 'function' || global.renderCard.__eqMxPatched) return;
    var orig = global.renderCard;
    global.renderCard = function (u) {
      var base = orig(u);
      if (!isMutbexPage()) return base;
      var wrapAttrs = global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function' ? global.EqustoCart.cardWrapAttrs(u) : '';
      var out = base.replace('<div class="prod-card prod-card-wrap">', '<div class="prod-card prod-card-wrap"' + wrapAttrs + '>');
      var badgeBlock = badgesHtml();
      if (badgeBlock) {
        out = out.replace(/(<div class="prod-img"[^>]*>)([\\s\\S]*?)(<\\/motion>)/, '$1$2<div class="eq-mx-badges">' + badgeBlock + '</div>$3');
      }
      var cartRow = productActionsHtml(u).replace(/<\\/motion>/g, '</motion>').replace(/<motion class="/g, '<div class="');
      out = out.replace(/<button[^>]*\\beq-cart-add\\b[^>]*>[\\s\\S]*?<\\/button>/i, '');
      if (out.indexOf('eq-mx-prod-actions') < 0) out = out.replace('</a>', '</a>' + cartRow);
      return out;
    };
    global.renderCard.__eqMxPatched = true;
  }

  function bootDept() {
    if (!document.body || !document.body.classList.contains('eq-shop')) return;
    if (document.body.classList.contains('eq-home')) return;
    if (document.body.classList.contains('admin-app')) return;
    if (document.body.classList.contains('bd-page')) return;
    document.body.classList.add('eq-shop-mutbex');
    var run = function () { patchRenderCard(); };
    if (global.EqVitrinConfig && global.EqVitrinConfig.load) global.EqVitrinConfig.load().then(run);
    else run();
  }

  global.EqMutbex = {
    esc: esc,
    attrPath: attrPath,
    badgesHtml: badgesHtml,
    renderSpotCard: renderSpotCard,
    buildTickerHtml: buildTickerHtml,
    initHeroIn: initHeroIn,
    patchRenderCard: patchRenderCard,
    isMutbexPage: isMutbexPage
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootDept);
  else bootDept();
})(typeof window !== 'undefined' ? window : global);
`;

const fixed = code
  .replace(/<motion class="/g, "<TAGDIV class=\"")
  .replace(/<\/motion>/g, "</TAGDIV>")
  .replace(/<TAGDIV/g, "<div")
  .replace(/<\/TAGDIV>/g, "</motion>");

fs.writeFileSync(out, fixed.replace(/<\/motion>/g, "</motion>").replace(/<\/motion>/g, "</div>"), "utf8");
console.log("wrote", out);
