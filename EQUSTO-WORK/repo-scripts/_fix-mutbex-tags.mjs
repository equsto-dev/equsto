import fs from 'fs';
const p = new URL('../public/eq-home-mutbex.js', import.meta.url);
let c = fs.readFileSync(p, 'utf8');
const t = 'd' + 'iv';
const spotFn = `  function renderMxSpotlightCard(u) {
    var img = u.img ? '<img src="' + esc(attrPath(u.img)) + '" alt="" loading="lazy">' : '';
    var href =
      typeof global.productHrefHome === 'function' ? global.productHrefHome(u) : 'product.html';
    var name = (u.n || '').substring(0, 72) + ((u.n || '').length > 72 ? '…' : '');
    return (
      '<a class="eq-mx-spot-card" href="' +
      esc(attrPath(href)) +
      '">' +
      '<${t} class="eq-mx-spot-card__img">' +
      img +
      '</${t}>' +
      '<${t} class="eq-mx-spot-card__body">' +
      '<${t} class="eq-mx-spot-card__brand">' +
      esc(u.b || '') +
      '</${t}>' +
      '<${t} class="eq-mx-spot-card__name">' +
      esc(name) +
      '</${t}>' +
      '<${t} class="eq-mx-spot-card__price">₺' +
      esc(u.p || '') +
      '</${t}></${t}></a>'
    );
  }

  function fillSpotlight() {
    var el = document.getElementById('eq-mx-spotlight');
    if (!el || typeof global.__eqAllProducts !== 'function') return;
    var pool = global.__eqAllProducts();
    if (!pool || !pool.length) return;
    var spec = { mode: 'auto', limit: 8 };
    if (global.EqVitrinConfig && global.EqVitrinConfig.get) {
      var cfg = global.EqVitrinConfig.get();
      if (cfg.spotlight) spec = cfg.spotlight;
    }
    var pick =
      global.EqVitrinConfig && global.EqVitrinConfig.pickProducts
        ? global.EqVitrinConfig.pickProducts(pool, spec)
        : pool.slice(0, 8);
    var out = '';
    for (var k = 0; k < pick.length; k++) {
      out += renderMxSpotlightCard(pick[k]);
    }
    el.innerHTML = out;
  }`;

c = c.replace(
  /  function renderMxSpotlightCard\(u\) \{[\s\S]*?  function patchRenderCard\(\)/,
  spotFn + '\n\n  function patchRenderCard()',
);
c = c.split('<motion ').join('<' + t + ' ').split('</motion>').join('</' + t + '>');
fs.writeFileSync(p, c);
console.log('fixed spotlight + global tag cleanup');
