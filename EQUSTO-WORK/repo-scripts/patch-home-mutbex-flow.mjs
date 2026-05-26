/**
 * Ana sayfa: 4'lü hero sonrası mutbex akışı + beyaz vitrin sırası.
 * Hero (eq-home-hero-ads) bloğuna dokunmaz.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const D = '\u0064iv';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, '../public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');

const orderMap = [
  ['eq-cm-shop-order-2" aria-label="Equsto güvenceleri"', 'eq-cm-shop-order-1" aria-label="Equsto güvenceleri"'],
  ['eq-cm-shop-order-1" id="eq-home-catband"', 'eq-cm-shop-order-5" id="eq-home-catband"'],
  ['eq-cm-shop-order-3" aria-label="Öztiryakiler', 'eq-cm-shop-order-6" aria-label="Öztiryakiler'],
  ['eq-cm-shop-order-5" aria-label="Hızlı erişim"', 'eq-cm-shop-order-9" aria-label="Hızlı erişim"'],
  ['main class="main eq-cm-shop-order-6"', 'main class="main eq-cm-shop-order-3"'],
  ['eq-cm-shop-order-9" aria-label="Proje teklifi"', 'eq-cm-shop-order-10" aria-label="Proje teklifi"'],
];
for (const [from, to] of orderMap) {
  if (!html.includes(from)) console.warn('skip:', from.slice(0, 50));
  else html = html.replace(from, to);
}

const promoBlock = `
      <section class="eq-promo-strip eq-cm-shop-order-2" aria-label="Kampanya duyuruları">
        <${D} class="eq-promo-strip-inner">
          <span class="eq-promo-chip"><strong>9 Taksit</strong> anlaşmalı kartlarda vade farksız</span>
          <span class="eq-promo-chip"><strong>Ücretsiz kargo</strong> 5.000 ₺ ve üzeri siparişlerde</span>
          <span class="eq-promo-chip"><strong>Proje Fabrikası</strong> beş dakikada liste, anlık teklif</span>
          <span class="eq-promo-chip"><strong>Öztiryakiler</strong> soğutma ve pişirme vitrininde</span>
        </${D}>
      </section>
`;

if (!html.includes('eq-promo-strip')) {
  const needle = '</section>\n\n\n      <section class="eq-home-band eq-cm-shop-order-5"';
  if (html.includes(needle)) {
    html = html.replace(needle, `</section>\n${promoBlock}\n      <section class="eq-home-band eq-cm-shop-order-5"`);
  } else {
    html = html.replace(
      '</section>\n\n      <section class="eq-home-band eq-cm-shop-order-5"',
      `</section>\n${promoBlock}\n      <section class="eq-home-band eq-cm-shop-order-5"`
    );
  }
}

const brandsBlock = `
      <section class="eq-home-band eq-cm-shop-order-8" aria-label="Popüler markalar">
        <${D} class="eq-home-band-inner">
          <${D} class="eq-home-band-head">
            <h2 class="eq-home-band-title"><small>Endüstriyel Mutfak</small><span>Popüler Markalarımız</span></h2>
          </${D}>
          <${D} class="eq-brand-grid" id="eq-home-brand-grid">
            <a class="eq-brand-cell" href="/marka.html?b=%C3%96ztiryakiler+End%C3%BCstriyel+Mutfak">Öztiryakiler</a>
            <a class="eq-brand-cell" href="/marka.html?b=Atalay">Atalay</a>
            <a class="eq-brand-cell" href="/marka.html?b=Empero">Empero</a>
            <a class="eq-brand-cell" href="/marka.html?b=Samixir">Samixir</a>
            <a class="eq-brand-cell" href="/marka.html?b=Gtech">Gtech</a>
            <a class="eq-brand-cell" href="/marka.html?b=Robot+Coupe">Robot Coupe</a>
          </${D}>
        </${D}>
      </section>

`;

if (!html.includes('eq-home-brand-grid')) {
  const twin = '<section class="eq-home-band eq-cm-twin-wrap eq-cm-shop-order-9"';
  if (html.includes(twin)) html = html.replace(twin, brandsBlock + '      ' + twin);
}

html = html.replace(
  '<a class="eq-brand-banner" href="/marka.html?b=%C3%96ztiryakiler+End%C3%BCstriyel+Mutfak"',
  '<a class="eq-brand-banner eq-brand-banner--vitrin" href="/marka.html?b=%C3%96ztiryakiler+End%C3%BCstriyel+Mutfak"'
);

html = html.replace(
  '<a class="eq-twin-card eq-twin-dark" onclick="typeof eqGo===\'function\'?eqGo(\'contact\'):location.href=\'/contact.html\'"',
  '<a class="eq-twin-card eq-twin-contact" onclick="typeof eqGo===\'function\'?eqGo(\'contact\'):location.href=\'/contact.html\'"'
);

const editorSnippet = `          <${D} class="eq-cm-editor-head">
            <h2 class="eq-cm-editor-h2">Editörün seçimi</h2>
            <p class="eq-cm-editor-sub">Kampanyalı ürünler ve en çok satan vitrin</p>
          </${D}>
          `;
if (html.includes(editorSnippet.trim())) html = html.replace(editorSnippet, '          ');

fs.writeFileSync(indexPath, html, 'utf8');
console.log('OK: index.html mutbex flow');
