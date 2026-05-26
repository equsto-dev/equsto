/**
 * pisirme.html şablonundan tüm departman PLP sayfalarını üretir.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectDeptPlpInlineCss } from './dept-plp-inline-css.mjs';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const DEPTS = ['pisirme', 'kahve', 'yikama', 'hazirlik', 'icecek', 'sogutma', 'tezgah'];
const NAV_IDS = ['pisirme', 'sogutma', 'kahve', 'yikama', 'hazirlik', 'icecek', 'tezgah'];

const PAGES = {
  pisirme: {
    title: 'Pişirme Ekipmanları',
    lead: 'Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları',
  },
  sogutma: {
    title: 'Soğutma Ekipmanları',
    lead: 'Buzdolabı, derin dondurucu, şok soğutma, teşhir ve soğuk oda çözümleri',
  },
  kahve: {
    title: 'Kahve Ekipmanları',
    lead: 'Espresso, öğütücü, filtre kahve ve barista ekipmanları',
  },
  yikama: {
    title: 'Yıkama Ekipmanları',
    lead: 'Bulaşık makineleri, setaltı ve konveyörlü yıkama sistemleri',
  },
  hazirlik: {
    title: 'Hazırlık Ekipmanları',
    lead: 'Et ve sebze hazırlık, hamur yoğurma, vakum ve mutfak robotları',
  },
  icecek: {
    title: 'İçecek Ekipmanları',
    lead: 'Çay, meyve suyu, bar blender ve sıcak içecek ekipmanları',
  },
  tezgah: {
    title: 'Çalışma Tezgahları',
    lead: 'Paslanmaz çalışma tezgahları, evyeli modeller ve duvar raf üniteleri',
  },
};

const NAV_LABEL = {
  pisirme: 'Pişirme Ekipmanları',
  sogutma: 'Soğutma Ekipmanları',
  kahve: 'Kahve Ekipmanları',
  yikama: 'Yıkama Ekipmanları',
  hazirlik: 'Hazırlık Ekipmanları',
  icecek: 'İçecek Ekipmanları',
  tezgah: 'Çalışma Tezgahları',
};

/** Önceki şablondan kalan yanlış <title> düzeltmesi */
const SEO_TITLE = {
  pisirme: 'Pişirme Ekipmanları — Endüstriyel Ocak, Fırın, Fritöz · Equsto',
  sogutma: 'Soğutma Ekipmanları — Endüstriyel Buzdolabı, Derin Dondurucu · Equsto',
  kahve: 'Kahve Ekipmanları — Espresso Makineleri, Değirmenler · Equsto',
  yikama: 'Yıkama Ekipmanları — Endüstriyel Bulaşık Makinesi · Equsto',
  hazirlik: 'Hazırlık Ekipmanları — Tezgah, Dilimleme, Planetary · Equsto',
  icecek: 'İçecek Ekipmanları — Buz Makineleri, İçecek Soğutucu · Equsto',
  tezgah: 'Çalışma Tezgahları — Paslanmaz Endüstriyel Tezgah · Equsto',
};

function pick(orig, re) {
  const m = orig.match(re);
  return m ? m[1].trim() : '';
}

function loadSeo(dept) {
  const path = join(pub, `${dept}.html`);
  if (!existsSync(path)) return {};
  const orig = readFileSync(path, 'utf8');
  return {
    title: pick(orig, /<title>([^<]*)<\/title>/i),
    desc: pick(orig, /<meta name="description" content="([^"]*)"/i),
    canonical: pick(orig, /<link rel="canonical" href="([^"]*)"/i),
  };
}

function navLine(id, active) {
  const label = NAV_LABEL[id];
  if (active) {
    return `    <div class="topnav-item active" data-i18n="nav.${id}">${label}</div>`;
  }
  return `    <div class="topnav-item" onclick="eqGo('${id}')" data-i18n="nav.${id}">${label}</div>`;
}

function buildTopnav(active) {
  const lines = [
    '  <div class="pg-inner topnav-inner">',
    '    <div class="topnav-item topnav-all" onclick="toggleDrawer()" data-i18n="common.all_categories_lower">☰ Tüm kategoriler</div>',
    '    <span class="topnav-sep" aria-hidden="true">|</span>',
    '    <div class="topnav-item topnav-pfos" onclick="eqGo(\'pfos\')" data-i18n="nav.pfos">Proje Fabrikası</div>',
    '    <span class="topnav-sep">|</span>',
  ];
  for (const id of NAV_IDS) {
    let line = navLine(id, id === active);
    line = line.replace('<div class="topnav-item active"', '<div class="topnav-item active"');
    line = line.replace('<div class="topnav-item active"', '<div class="topnav-item active"');
    line = line.replace('</div>', '</div>').replace('</div>', '</div>');
    lines.push(line);
    lines.push('    <span class="topnav-sep">|</span>');
  }
  lines.push(
    '    <div class="topnav-item topnav-besos" onclick="eqGo(\'besos\')" data-i18n="nav.bar_design">Bar Design</div>',
    '  </div>'
  );
  lines[lines.length - 2] = lines[lines.length - 2].replace('</div>', '</div>');
  return lines.join('\n');
}

function setTopnav(html, active) {
  return html.replace(
    /<nav class="topnav"[\s\S]*?<\/nav>/,
    `<nav class="topnav" aria-label="Departmanlar">\n${buildTopnav(active)}\n</nav>`
  );
}

/** Hangi HTML şablonundan üretileceği (sogutma = çalışan yikama PLP) */
const TEMPLATE_FILE = {
  pisirme: 'pisirme.html',
  kahve: 'pisirme.html',
  yikama: 'pisirme.html',
  hazirlik: 'pisirme.html',
  icecek: 'pisirme.html',
  sogutma: 'yikama.html',
  tezgah: 'yikama.html',
};

function generateDeptPage(dept) {
  const templateName = TEMPLATE_FILE[dept] || 'pisirme.html';
  const templatePath = join(pub, templateName);
  const sourceDept = templateName.replace('.html', '');
  const seo = loadSeo(dept);
  const page = PAGES[dept];
  let html = readFileSync(templatePath, 'utf8');

  html = html.replace(new RegExp(`data-eq-dept="${sourceDept}"`, 'g'), `data-eq-dept="${dept}"`);

  const title = SEO_TITLE[dept] || `${page.title} · Equsto`;
  const desc = seo.desc || `${page.title} — Equsto endüstriyel mutfak.`;
  const canonical = seo.canonical || `https://equsto.com/shop/${dept}`;

  html = html.replace(
    /(<meta http-equiv="Cache-Control"[^>]*>\s*\n)<title>[^<]*<\/title>/,
    `$1<title>${title}</title>`
  );
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${desc.replace(/"/g, '&quot;')}"`
  );
  html = html.replace(
    /<link rel="canonical" href="[^"]*"/,
    `<link rel="canonical" href="${canonical}"`
  );

  html = html.replace(
    /<h1 class="eq-dept-plp-title">[^<]*<\/h1>/,
    `<h1 class="eq-dept-plp-title">${page.title}</h1>`
  );
  html = html.replace(
    /<p class="eq-dept-plp-lead">[^<]*<\/p>/,
    `<p class="eq-dept-plp-lead">${page.lead}</p>`
  );
  html = html.replace(
    /<div class="eq-dept-plp-aside__hd">[^<]*<\/div>/,
    `<div class="eq-dept-plp-aside__hd">${page.title}</div>`
  );

  html = setTopnav(html, dept);

  const cssPath = join(pub, 'eq-dept-plp.css');
  if (existsSync(cssPath)) {
    html = injectDeptPlpInlineCss(html, readFileSync(cssPath, 'utf8'));
  }

  writeFileSync(join(pub, `${dept}.html`), html);
  console.log('Wrote', dept + '.html', `(şablon: ${templateName})`);
}

for (const dept of DEPTS) {
  generateDeptPage(dept);
}
