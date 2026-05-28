#!/usr/bin/env node
/**
 * Repair Turkish UTF-8 in dept PLP HTML: header/nav/footer from sogutma.html,
 * titles and PLP copy from eq-dept-plp-config + SEO strings.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");
const REF = fs.readFileSync(path.join(ROOT, "sogutma.html"), "utf8");

const hdrChrome = REF.match(/<header class="hdr">[\s\S]*?<\/nav>\r?\n/)[0];
const footerChrome = REF.match(/<footer class="footer">[\s\S]*?<\/footer>/)[0];
const drawerChrome = REF.match(
  /<div class="drawer-overlay"[\s\S]*?<div class="cat-drawer[\s\S]*?aria-hidden="true"><\/div>\r?\n/
)[0];
const plpStyleComment = REF.match(/\/\* Pişirme PLP v2[^*]+\*\//)[0];
const plpFacetComment = REF.match(/\/\* Cafemarkt tarzı facet[^*]+\*\//)[0];
const sortBlock = REF.match(
  /<label class="eq-dept-plp-sort">[\s\S]*?<\/label>/
)[0];
const statusLine =
  '<p class="eq-dept-plp-status">Katalog yükleniyor…</p>';
const aramaStatusLine =
  '<p class="eq-dept-plp-status">Yükleniyor…</p>';

const TOPNAV_DEPTS = [
  "pisirme",
  "sogutma",
  "kahve",
  "yikama",
  "hazirlik",
  "icecek",
];

const NAV_I18N = {
  pisirme: "nav.pisirme",
  sogutma: "nav.sogutma",
  kahve: "nav.kahve",
  yikama: "nav.yikama",
  hazirlik: "nav.hazirlik",
  icecek: "nav.icecek",
};

/** @type {Record<string, { title: string; lead: string; pageTitle: string; description: string }>} */
const DEPT = {
  pisirme: {
    title: "Pişirme Ekipmanları",
    lead: "Ocaklar, ızgaralar, kuzineler, fritözler, döner ve tost ekipmanları",
    pageTitle: "Pişirme Ekipmanları — Endüstriyel Ocak, Fırın, Fritöz · Equsto",
    description:
      "Endüstriyel pişirme ekipmanları: ocak, fritöz, fırın, salamander, döner. Restoran, otel ve catering için Equsto.",
  },
  sogutma: {
    title: "Soğutma Ekipmanları",
    lead: "Buzdolabı, derin dondurucu, şok soğutma, teşhir ve soğuk oda çözümleri",
    pageTitle:
      "Soğutma Ekipmanları — Endüstriyel Buzdolabı, Derin Dondurucu · Equsto",
    description:
      "Endüstriyel soğutma ekipmanları: dik tip buzdolabı, derin dondurucu, salata buzdolabı, şokçu, soğuk hava deposu. Restoran, otel ve bulut mutfak projeleri için Equsto güvencesiyle teklif al.",
  },
  kahve: {
    title: "Kahve Ekipmanları",
    lead: "Espresso, öğütücü, filtre kahve ve barista ekipmanları",
    pageTitle: "Kahve Ekipmanları — Espresso, Öğütücü · Equsto",
    description:
      "Endüstriyel kahve ekipmanları: espresso makinesi, değirmen, filtre kahve ve barista aksesuarları. Equsto kataloğu.",
  },
  yikama: {
    title: "Yıkama Ekipmanları",
    lead: "Bulaşık makineleri, setaltı ve konveyörlü yıkama sistemleri",
    pageTitle: "Yıkama Ekipmanları — Endüstriyel Bulaşık Makinesi · Equsto",
    description:
      "Endüstriyel bulaşık makineleri, kaplı tip bulaşık makinesi, tünel tipi yıkama, evye sistemleri, mutfak yıkama hattı. Restoran, otel ve catering için Equsto güvencesiyle teklif al.",
  },
  hazirlik: {
    title: "Hazırlık Ekipmanları",
    lead: "Et ve sebze hazırlık, hamur yoğurma, vakum ve mutfak robotları",
    pageTitle: "Hazırlık Ekipmanları — Endüstriyel Mutfak Hazırlık · Equsto",
    description:
      "Endüstriyel hazırlık ekipmanları: doğrayıcı, blender, hamur yoğurma, vakum makinesi. Equsto.",
  },
  icecek: {
    title: "İçecek Ekipmanları",
    lead: "Çay, meyve suyu, bar blender ve sıcak içecek ekipmanları",
    pageTitle: "İçecek Ekipmanları — Endüstriyel İçecek Hazırlık · Equsto",
    description:
      "Endüstriyel içecek ekipmanları: çay makinesi, meyve sıkacağı, blender. Equsto kataloğu.",
  },
  tezgah: {
    title: "Çalışma Tezgahları",
    lead: "Paslanmaz çalışma tezgahları, evyeli modeller ve duvar raf üniteleri",
    pageTitle: "Çalışma Tezgahları — Paslanmaz Endüstriyel Tezgah · Equsto",
    description:
      "Paslanmaz çalışma tezgahları, evyeli modeller ve duvar raf üniteleri. Restoran ve catering mutfakları için Equsto kataloğu.",
  },
  dolap: {
    title: "Dolaplar",
    lead: "Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler",
    pageTitle: "Dolaplar — Paslanmaz Endüstriyel Depolama · Equsto",
    description:
      "Paslanmaz depolama dolapları, malzeme dolapları ve sürgülü kapalı üniteler. Equsto.",
  },
  davlumbaz: {
    title: "Davlumbazlar",
    lead: "Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri",
    pageTitle: "Davlumbazlar — Endüstriyel Mutfak Havalandırma · Equsto",
    description:
      "Duvar tipi, ada tipi ve filtreli endüstriyel davlumbaz sistemleri. Equsto kataloğu.",
  },
  tasima: {
    title: "Taşıma Ekipmanları",
    lead: "Palet, transpalet ve mutfak içi taşıma çözümleri",
    pageTitle: "Taşıma Ekipmanları — Endüstriyel Mutfak · Equsto",
    description: "Palet, transpalet ve mutfak içi taşıma çözümleri. Equsto.",
  },
  araba: {
    title: "Arabalar",
    lead: "Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri",
    pageTitle: "Arabalar — Servis ve GN Taşıma · Equsto",
    description:
      "Servis arabaları, tepsi toplama, GN taşıma ve mobil bar üniteleri. Equsto.",
  },
  istif: {
    title: "İstif Rafları",
    lead: "İstif rafları, duvar rafları ve malzeme raf sistemleri",
    pageTitle: "İstif Rafları — Endüstriyel Raf Sistemleri · Equsto",
    description: "İstif rafları, duvar rafları ve malzeme raf sistemleri. Equsto.",
  },
  "market-reyon": {
    title: "Market Reyonları",
    lead:
      "Proso ve Çağlayan market reyonları — sütlük, şarküteri, dikey dondurucu, ada tipi teşhir ve soğuk hava depoları",
    pageTitle: "Market Reyonları — Teşhir ve Soğuk Reyon · Equsto",
    description:
      "Market reyonları, sütlük, şarküteri, dikey dondurucu ve soğuk hava depoları. Equsto.",
  },
  "set-ustu-mutfak": {
    title: "Set Üstü Mutfak Ekipmanları",
    lead: "Öztiryakiler — servis gereçleri, gastronorm, chafing dish, tencere ve mutfak aksesuarları",
    pageTitle: "Set Üstü Mutfak Ekipmanları — Öztiryakiler · Equsto",
    description:
      "Set üstü mutfak ekipmanları, gastronorm, chafing dish ve mutfak aksesuarları. Equsto.",
  },
  kuvetler: {
    title: "Küvetler",
    lead: "Gastronorm küvetler, GN kapaklar, polipropilen ve polikarbonat küvetler · Öztiryakiler",
    pageTitle: "Küvetler — Gastronorm GN Küvet · Equsto",
    description:
      "Gastronorm küvetler, GN kapaklar, polipropilen ve polikarbonat küvetler. Equsto.",
  },
};

const MARKA_BY_DEPT = {
  icecek: "['Ateşe', 'Öztiryakiler']",
  kahve: "['WMF', 'Nuova Simonelli', 'Bravilor Bonamat', 'Öztiryakiler']",
};

const FILE_DEPT = {
  "pisirme.html": "pisirme",
  "sogutma.html": "sogutma",
  "kahve.html": "kahve",
  "yikama.html": "yikama",
  "hazirlik.html": "hazirlik",
  "icecek.html": "icecek",
  "tezgah.html": "tezgah",
  "dolap.html": "dolap",
  "davlumbaz.html": "davlumbaz",
  "tasima.html": "tasima",
  "araba.html": "araba",
  "istif.html": "istif",
  "market-reyonlari.html": "market-reyon",
  "set-ustu-mutfak.html": "set-ustu-mutfak",
  "kuvetler.html": "kuvetler",
};

function chromeForDept(activeDept) {
  let h = hdrChrome;
  for (const id of TOPNAV_DEPTS) {
    const i18n = NAV_I18N[id];
    h = h.replace(
      new RegExp(
        `<div class="topnav-item active" data-i18n="${i18n}">([^<]+)</div>`,
        "g"
      ),
      `<div class="topnav-item" onclick="eqGo('${id}')" data-i18n="${i18n}">$1</div>`
    );
  }
  if (!activeDept || !TOPNAV_DEPTS.includes(activeDept)) return h;
  const i18n = NAV_I18N[activeDept];
  const re = new RegExp(
    `<div class="topnav-item"(?: onclick="eqGo\\('${activeDept}'\\)")? data-i18n="${i18n}">([^<]+)</div>`
  );
  return h.replace(
    re,
    `<div class="topnav-item active" data-i18n="${i18n}">$1</div>`
  );
}

function repairPlpStyleComments(html) {
  html = html.replace(/\/\* Pişirme PLP v2[^*]+\*\//, plpStyleComment);
  html = html.replace(/\/\* Set st PLP v2[^*]+\*\//, plpStyleComment);
  html = html.replace(/\/\* Cafemarkt tarz[^*]+\*\//, plpFacetComment);
  return html;
}

function repairDrawerChrome(html) {
  if (!/<div class="drawer-overlay"/.test(html)) return html;
  return html.replace(
    /<div class="drawer-overlay"[\s\S]*?<div class="cat-drawer[\s\S]*?aria-hidden="true"><\/div>\r?\n/,
    drawerChrome
  );
}

function patchArama() {
  const fp = path.join(ROOT, "arama.html");
  let html = fs.readFileSync(fp, "utf8");
  const chrome = chromeForDept(null);
  html = html.replace(/<header class="hdr">[\s\S]*?<\/nav>\r?\n/, chrome);
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    "<title>Arama — Equsto</title>"
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    '<meta name="description" content="Equsto ürün araması — Meilisearch">'
  );
  html = html.replace(
    /<p class="eq-dept-plp-status">[\s\S]*?<\/p>/,
    aramaStatusLine
  );
  html = repairDrawerChrome(html);
  fs.writeFileSync(fp, html, "utf8");
  return true;
}

function patchFile(filename, deptKey) {
  const meta = DEPT[deptKey];
  if (!meta) {
    console.warn("skip (no meta):", filename);
    return false;
  }
  const fp = path.join(ROOT, filename);
  let html = fs.readFileSync(fp, "utf8");

  const chrome = chromeForDept(
    TOPNAV_DEPTS.includes(deptKey) ? deptKey : null
  );
  if (!/<header class="hdr">/.test(html)) {
    console.warn("skip (no header):", filename);
    return false;
  }

  html = html.replace(/<header class="hdr">[\s\S]*?<\/nav>\r?\n/, chrome);
  html = html.replace(/<footer class="footer">[\s\S]*?<\/footer>/, footerChrome);
  // file:// guard script also contains <title> — only patch the real <head> title
  html = html.replace(
    /(<meta http-equiv="Cache-Control"[^>]*>\s*\r?\n)<title>[\s\S]*?<\/title>/,
    `$1<title>${meta.pageTitle}</title>`
  );
  html = html.replace(
    /document\.write\(\s*'\s*<!DOCTYPE html><html lang="tr"><head><title>[\s\S]*?<\/title><\/head><body>'/,
    "document.write(\n    '<!DOCTYPE html><html lang=\"tr\"><head><title>Equsto</title></head><body>'"
  );
  html = html.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${meta.description}">`
  );
  html = html.replace(
    /<div class="eq-dept-plp-aside__hd">[\s\S]*?<\/div>/,
    `<div class="eq-dept-plp-aside__hd">${meta.title}</div>`
  );
  html = html.replace(
    /<h1 class="eq-dept-plp-title">[\s\S]*?<\/h1>/,
    `<h1 class="eq-dept-plp-title">${meta.title}</h1>`
  );
  html = html.replace(
    /<p class="eq-dept-plp-lead">[\s\S]*?<\/p>/,
    `<p class="eq-dept-plp-lead">${meta.lead}</p>`
  );
  html = html.replace(
    /<label class="eq-dept-plp-sort">[\s\S]*?<\/label>/,
    sortBlock
  );
  html = html.replace(
    /<p class="eq-dept-plp-status">[\s\S]*?<\/p>/,
    statusLine
  );
  html = repairPlpStyleComments(html);
  html = repairDrawerChrome(html);
  if (MARKA_BY_DEPT[deptKey]) {
    html = html.replace(
      /window\.__EQUSTO_MARKA_BOYUT_SIRASI = \[[^\]]+\];/,
      `window.__EQUSTO_MARKA_BOYUT_SIRASI = ${MARKA_BY_DEPT[deptKey]};`
    );
  }

  fs.writeFileSync(fp, html, "utf8");
  return true;
}

let n = 0;
for (const [file, dept] of Object.entries(FILE_DEPT)) {
  if (patchFile(file, dept)) {
    n++;
    console.log("patched", file);
  }
}
if (patchArama()) {
  n++;
  console.log("patched", "arama.html");
}
console.log("done:", n, "files");
