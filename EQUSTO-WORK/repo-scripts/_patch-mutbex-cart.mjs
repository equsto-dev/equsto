import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p = path.join(__dirname, '../public/eq-home-mutbex.js');
let c = fs.readFileSync(p, 'utf8');

const newFn = `  function patchRenderCard() {
    if (typeof global.renderCard !== 'function' || global.renderCard.__eqMxPatched) return;
    var orig = global.renderCard;
    global.renderCard = function (u) {
      var base = orig(u);
      if (!document.body.classList.contains('eq-home-mutbex')) return base;

      var wrapAttrs =
        global.EqustoCart && typeof global.EqustoCart.dataAttrs === 'function'
          ? global.EqustoCart.dataAttrs(u)
          : '';
      var out = base.replace(
        '<div class="prod-card prod-card-wrap">',
        '<motion class="prod-card prod-card-wrap"' + wrapAttrs + '>',
      );
      out = out.split('<motion class="prod-card prod-card-wrap"').join('<div class="prod-card prod-card-wrap"');

      var badges =
        global.EqVitrinConfig && global.EqVitrinConfig.get
          ? global.EqVitrinConfig.get().productBadges || {}
          : {};
      var badgeHtml = '';
      if (badges.showFreeShipping !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--ship">' +
          esc(badges.freeShippingLabel || 'Ücretsiz kargo') +
          '</span>';
      }
      if (badges.showInstallments !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--disc">' +
          esc(badges.installmentsLabel || '9 taksit') +
          '</span>';
      }
      if (badgeHtml) {
        out = out.replace(
          /(<div class="prod-img"[^>]*>)([\\s\\S]*?)(<\\/div>)/,
          '$1$2<div class="eq-mx-badges">' + badgeHtml + '</div>$3',
        );
      }

      var cartAttrs =
        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
          ? global.EqustoCart.cartAddButtonAttrs(u)
          : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
      var cartRow =
        '<div class="eq-mx-prod-actions"><button ' + cartAttrs + '>Sepete ekle</button></div>';

      out = out.replace(/<button[^>]*\\beq-cart-add\\b[^>]*>[\\s\\S]*?<\\/button>/i, '');
      if (out.indexOf('eq-mx-prod-actions') < 0) {
        out = out.replace('</a>', '</a>' + cartRow);
      }
      return out;
    };
    global.renderCard.__eqMxPatched = true;
  }`;

const fixedFn = newFn.split('<motion ').join('<motion ').split('<motion class="prod-card').join('<div class="prod-card');

c = c.replace(/  function patchRenderCard\(\) \{[\s\S]*?  function init\(\) \{/,
  fixedFn.split('<motion ').join('<div ').split('</motion>').join('</motion>').replace(/<motion class="prod-card/g, '<motion class="prod-card') + '\n\n  function init() {');

// simpler: build with D variable
const D = 'd' + 'iv';
const fn = `  function patchRenderCard() {
    if (typeof global.renderCard !== 'function' || global.renderCard.__eqMxPatched) return;
    var orig = global.renderCard;
    global.renderCard = function (u) {
      var base = orig(u);
      if (!document.body.classList.contains('eq-home-mutbex')) return base;

      var wrapAttrs =
        global.EqustoCart && typeof global.EqustoCart.dataAttrs === 'function'
          ? global.EqustoCart.dataAttrs(u)
          : '';
      var out = base.replace(
        '<${D} class="prod-card prod-card-wrap">',
        '<${D} class="prod-card prod-card-wrap"' + wrapAttrs + '>',
      );

      var badges =
        global.EqVitrinConfig && global.EqVitrinConfig.get
          ? global.EqVitrinConfig.get().productBadges || {}
          : {};
      var badgeHtml = '';
      if (badges.showFreeShipping !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--ship">' +
          esc(badges.freeShippingLabel || 'Ücretsiz kargo') +
          '</span>';
      }
      if (badges.showInstallments !== false) {
        badgeHtml +=
          '<span class="eq-mx-badge eq-mx-badge--disc">' +
          esc(badges.installmentsLabel || '9 taksit') +
          '</span>';
      }
      if (badgeHtml) {
        out = out.replace(
          /(<${D} class="prod-img"[^>]*>)([\\s\\S]*?)(<\\/${D}>)/,
          '$1$2<${D} class="eq-mx-badges">' + badgeHtml + '</${D}>$3',
        );
      }

      var cartAttrs =
        global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
          ? global.EqustoCart.cartAddButtonAttrs(u)
          : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
      var cartRow =
        '<${D} class="eq-mx-prod-actions"><button ' + cartAttrs + '>Sepete ekle</button></${D}>';

      out = out.replace(/<button[^>]*\\beq-cart-add\\b[^>]*>[\\s\\S]*?<\\/button>/i, '');
      if (out.indexOf('eq-mx-prod-actions') < 0) {
        out = out.replace('</a>', '</a>' + cartRow);
      }
      return out;
    };
    global.renderCard.__eqMxPatched = true;
  }

  function init() {`;

c = c.replace(/  function patchRenderCard\(\) \{[\s\S]*?  function init\(\) \{/, fn);

c = c.replace(/\n  function bindProductActions\(\) \{[\s\S]*?  \}\n\n  function init\(\) \{/, '\n\n  function init() {');

c = c.replace('      bindProductActions();\n', '');

fs.writeFileSync(p, c);
console.log('mutbex cart patched');
