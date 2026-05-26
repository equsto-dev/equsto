import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fp = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "eq-category-shell.js");
let s = fs.readFileSync(fp, "utf8");

const start = s.indexOf("(state.hideBrandStrip ? '' :");
const end = s.indexOf("\n\n    var clearBtn", start);
if (start < 0 || end < 0) throw new Error("block anchors missing");

const replacement = `      (state.hideBrandStrip ? '' :
      '<section class="eq-mx-spotlight-wrap eq-mx-brands-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('filter.brands', 'Markalarımız')) + '</div>' +
        '<div class="eq-mx-brand-scroll" id="eq-cat-brands"></div>' +
      '</section>') +
      '<section class="eq-mx-spotlight-wrap">' +
        '<div class="eq-mx-spotlight__head">' + esc(__csT('cat.featured_models', 'Öne çıkan modeller')) + '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-featured"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-featured" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap">' +
        '<motion class="eq-mx-spotlight__head">' + esc(__csT('cat.new_in', 'Yeni eklenenler')) + '</motion>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-newin"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-newin" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>' +
      '<section class="eq-mx-spotlight-wrap eq-cat-sublist" id="eq-cat-sublist-section" hidden>' +
        '<div class="eq-mx-spotlight__head eq-cat-sublist-head">' +
          '<span id="eq-cat-sublist-title">' + esc(__csT('cat.selected_type', 'Seçili tip')) + '</span>' +
          '<button type="button" class="eq-cat-sublist-clear" id="eq-cat-sublist-clear">× ' + esc(__csT('filter.clear', 'Temizle')) + '</button>' +
        '</div>' +
        '<div class="eq-mx-spotlight__track" id="eq-cat-sublist"></div>' +
        '<button type="button" class="eq-cat-load-more eq-mx-load-more" id="eq-cat-loadmore-sublist" hidden>' +
          esc(__csT('cat.load_more', 'Daha fazla ürün yükle')) +
        '</button>' +
      '</section>';`;

const clean = replacement
  .replace(/<\/motion>/g, "</motion>")
  .replace(/<motion class="/g, '<div class="')
  .replace(/<\/motion>/g, "</motion>");

s = s.slice(0, start) + clean.replace(/<\/motion>/g, "</div>") + s.slice(end);

// renderTiles -> stories
s = s.replace(
  "var tilesEl = root.querySelector('#eq-cat-tiles');",
  "var tilesEl = root.querySelector('#eq-cat-mx-stories');",
);
s = s.replace(
  /return \(\s*'<button type="button" class="eq-cat-tile'/,
  `return (
            '<button type="button" class="eq-mx-story`,
);
s = s.replace(
  "'<div class=\"eq-cat-tile-img\">' + img + '</div>'",
  "'<div class=\"eq-mx-story__ring\">' + (sample.img ? '<img src=\"' + esc(sample.img) + '\" alt=\"\" loading=\"lazy\">' : '<span class=\"eq-mx-story__ring-in\">—</span>') + '</div>'",
);
s = s.replace(
  "'<div class=\"eq-cat-tile-lbl\">' + esc(tile.label) + '</div>'",
  "'<span class=\"eq-mx-story__lbl\">' + esc(tile.label) + '</span>'",
);
s = s.replace(/eq-cat-tile--active/g, "eq-mx-story--active");
s = s.replace(/eq-cat-tile'/g, "eq-mx-story'");
s = s.replace(/\.eq-cat-tile\)/g, ".eq-mx-story)");

// productCard -> mutbex
const productCardOld = `    function productCard(u) {
      var href = __csProductHref(u);
      var img = u.img
        ? '<img src="' + esc(u.img) + '" alt="" loading="lazy">'
        : '<span class="eq-cat-rail-noimg">—</span>';
      var sub = categoryDisplayLabel(u.c, state.subLabels[u.c] || '');
      return (
        '<a class="eq-cat-rail-card" href="' + esc(href) + '">' +
          '<div class="eq-cat-rail-card-img">' + img + '</div>' +
          (sub ? '<div class="eq-cat-rail-card-cat">' + esc(sub) + '</motion>' : '') +
          '<div class="eq-cat-rail-card-name">' + esc(truncate(displayProductName(u.n), 80)) + '</div>' +
          '<div class="eq-cat-rail-card-brand">' + esc(u.b) + '</div>' +
          (u.p ? '<div class="eq-cat-rail-card-price">₺' + esc(u.p) + '</div>' : '') +
        '</a>'
      );
    }`;

const productCardNew = `    function productCard(u) {
      var href = __csProductHref(u);
      var name = truncate(displayProductName(u.n), 72);
      var img = u.img
        ? '<img src="' + esc(u.img) + '" alt="" loading="lazy" decoding="async">'
        : '';
      var badgeBlock = '';
      if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
        var badges = global.EqVitrinConfig.get().productBadges || {};
        if (badges.showFreeShipping !== false) {
          badgeBlock += '<span class="eq-mx-badge eq-mx-badge--ship">' + esc(badges.freeShippingLabel || 'Ücretsiz kargo') + '</span>';
        }
        if (badges.showInstallments !== false) {
          badgeBlock += '<span class="eq-mx-badge eq-mx-badge--disc">' + esc(badges.installmentsLabel || '9 taksit') + '</span>';
        }
      } else {
        badgeBlock = '<span class="eq-mx-badge eq-mx-badge--ship">Ücretsiz kargo</span><span class="eq-mx-badge eq-mx-badge--disc">9 taksit</span>';
      }
      var wrapAttrs = global.EqustoCart && typeof global.EqustoCart.cardWrapAttrs === 'function'
        ? global.EqustoCart.cardWrapAttrs(u) : '';
      var cartAttrs = global.EqustoCart && typeof global.EqustoCart.cartAddButtonAttrs === 'function'
        ? global.EqustoCart.cartAddButtonAttrs(u)
        : 'type="button" class="eq-cart-add eq-mx-act eq-mx-add" data-equsto-cart="1"';
      return (
        '<div class="eq-mx-spot-wrap prod-card-wrap"' + wrapAttrs + '>' +
        '<a class="eq-mx-spot-card" href="' + esc(href) + '">' +
        '<div class="eq-mx-spot-card__img">' + img +
        (badgeBlock ? '<div class="eq-mx-badges">' + badgeBlock + '</div>' : '') +
        '</div><div class="eq-mx-spot-card__body">' +
        '<div class="eq-mx-spot-card__brand">' + esc(u.b || '') + '</div>' +
        '<div class="eq-mx-spot-card__name">' + esc(name) + '</div>' +
        (u.p ? '<div class="eq-mx-spot-card__price">₺' + esc(u.p) + '</div>' : '') +
        '</div></a>' +
        '<div class="eq-mx-prod-actions">' +
        '<button type="button" class="eq-mx-act" data-eq-compare="1">Karşılaştır</button>' +
        '<button ' + cartAttrs + '>Sepete ekle</button></div></motion>'
      ).replace('</motion>', '</div>');
    }`;

if (s.includes("eq-cat-rail-card")) {
  s = s.replace(productCardOld.replace(/<\/motion>/g, "</div>"), productCardNew);
  if (s.includes("eq-cat-rail-card")) {
    s = s.replace(
      /function productCard\(u\) \{[\s\S]*?\n    \}/,
      productCardNew,
    );
  }
}

// hero init after catalog
if (!s.includes("initDeptMxHero")) {
  s = s.replace(
    "      renderAll();",
    `      initDeptMxHero();
      renderAll();`,
  );
  const heroFn = `
    function initDeptMxHero() {
      var slides = [];
      var seen = {};
      var pool = pickBrandDiverse(state.products, 24);
      for (var hi = 0; hi < pool.length && slides.length < 4; hi++) {
        var pu = pool[hi];
        if (!pu.img) continue;
        var sk = (pu.b || '') + '|' + (pu.c || '');
        if (seen[sk]) continue;
        seen[sk] = true;
        slides.push({
          title: truncate(displayProductName(pu.n), 48),
          subtitle: (pu.b || '') + (state.subLabels[pu.c] ? ' · ' + state.subLabels[pu.c] : ''),
          image: pu.img,
          href: __csProductHref(pu),
        });
      }
      if (!slides.length) {
        slides.push({
          title: state.catLabel,
          subtitle: state.catDesc || '',
          gradient: 'linear-gradient(120deg,#001e50,#0a3d7a)',
          href: '#eq-cat-mx-stories',
        });
      }
      if (global.EqMutbex && global.EqMutbex.initHeroIn) {
        global.EqMutbex.initHeroIn(root, slides);
      }
    }
`;
  s = s.replace("    function renderAll() {", heroFn + "\n    function renderAll() {");
}

// remove EqMutbex ref in mxTicker if broken
s = s.replace(
  /if \(global\.EqMutbex && global\.EqMutbex\.buildTickerHtml\) \{\s*return global\.EqMutbex\.buildTickerHtml\(\);\s*\}/,
  "",
);

fs.writeFileSync(fp, s, "utf8");
console.log("[patch-category-mutbex] done");
