/**
 * dolap, davlumbaz, tasima, araba, istif — tezgah.html şablonundan PLP sayfaları
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const tpl = readFileSync(join(pub, 'tezgah.html'), 'utf8');

const DEPTS = [
  {
    id: 'dolap',
    title: 'Dolaplar',
    lead: 'Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler',
    meta: 'Endüstriyel mutfak dolapları — paslanmaz depolama ve malzeme dolapları · Equsto',
  },
  {
    id: 'davlumbaz',
    title: 'Davlumbazlar',
    lead: 'Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri',
    meta: 'Profesyonel mutfak davlumbazları ve aspirasyon çözümleri · Equsto',
  },
  {
    id: 'tasima',
    title: 'Taşıma Ekipmanları',
    lead: 'Palet, transpalet ve mutfak içi taşıma çözümleri',
    meta: 'Endüstriyel mutfak taşıma ekipmanları · Equsto',
  },
  {
    id: 'araba',
    title: 'Arabalar',
    lead: 'Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri',
    meta: 'Endüstriyel servis ve taşıma arabaları · Equsto',
  },
  {
    id: 'istif',
    title: 'İstif Rafları',
    lead: 'İstif rafları, duvar rafları ve malzeme raf sistemleri',
    meta: 'Paslanmaz istif ve depolama raf sistemleri · Equsto',
  },
];

for (const d of DEPTS) {
  let html = tpl;
  html = html.replace(/data-eq-dept="tezgah"/g, `data-eq-dept="${d.id}"`);
  html = html.replace(
    '<title>Çalışma Tezgahları — Paslanmaz Endüstriyel Tezgah · Equsto</title>',
    `<title>${d.title} — Endüstriyel Mutfak · Equsto</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${d.meta}">`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*">/,
    `<link rel="canonical" href="https://equsto.com/shop/${d.id}">`
  );
  html = html.replace(
    /<div class="eq-dept-plp-aside__hd">Çalışma Tezgahları<\/div>/,
    `<div class="eq-dept-plp-aside__hd">${d.title}</div>`
  );
  html = html.replace(
    /<h1 class="eq-dept-plp-title">Çalışma Tezgahları<\/h1>/,
    `<h1 class="eq-dept-plp-title">${d.title}</h1>`
  );
  html = html.replace(
    /<p class="eq-dept-plp-lead">Paslanmaz çalışma tezgahları, evyeli modeller ve duvar raf üniteleri<\/p>/,
    `<p class="eq-dept-plp-lead">${d.lead}</p>`
  );
  html = html.replace(
    /class="topnav-item active" data-i18n="nav\.tezgah"/,
    'class="topnav-item" data-i18n="nav.tezgah" onclick="typeof eqDeptGo===\'function\'&&eqDeptGo(\'tezgah\')"'
  );
  html = html.replace(
    /<div class="topnav-item(?: active)?" data-i18n="nav\.tezgah">Çalışma Tezgahları<\/div>/,
    '<div class="topnav-item" data-i18n="nav.tezgah" onclick="typeof eqDeptGo===\'function\'&&eqDeptGo(\'tezgah\')">Çalışma Tezgahları</div>'
  );

  writeFileSync(join(pub, `${d.id}.html`), html, 'utf8');
  console.log('Wrote', d.id + '.html');
}
