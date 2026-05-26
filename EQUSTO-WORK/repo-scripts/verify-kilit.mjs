/**
 * Deploy öncesi kilit doğrulama — admin kategori + topnav chrome.
 * Çıkış kodu 0 = OK, 1 = hata.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pub = path.join(root, "public");
let err = 0;

function fail(msg) {
  console.error("[verify-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(pub, rel), "utf8");
}

const katJs = read("admin-eticaret-kategori.js");
if (!katJs.includes("EqAdminKategori")) fail("admin-eticaret-kategori.js: EqAdminKategori yok");
if (!katJs.includes("sanayi-ocaklari")) fail("admin-eticaret-kategori.js: pisirme slug eşlemesi eksik");

const adminHtml = read("admin.html");
if (!adminHtml.includes("admin-eticaret-kategori.js")) fail("admin.html: admin-eticaret-kategori.js script yok");
if (!adminHtml.includes("productAdminCat(p)")) fail("admin.html: renderEtUrunler productAdminCat kullanmıyor");

const DEPT_PLP_PAGES = [
  "pisirme.html",
  "sogutma.html",
  "kahve.html",
  "yikama.html",
  "hazirlik.html",
  "icecek.html",
  "tezgah.html",
  "dolap.html",
  "davlumbaz.html",
  "tasima.html",
  "araba.html",
  "istif.html",
];

function checkShopHead(html, page) {
  if (/href="\/theme\.css\r?\n/.test(html) || /\?v=[^"']+">\?v=/.test(html)) {
    fail(`${page}: bozuk stylesheet linki — node scripts/fix-dist-html-css.mjs`);
  }
  if (!html.includes('href="/theme.css?v=')) {
    fail(`${page}: theme.css linki eksik veya hatali`);
  }
  if (!html.includes("eq-desktop-chrome-")) {
    fail(`${page}: eq-desktop-chrome yaması yok — node scripts/fix-dist-html-css.mjs çalıştırın`);
  }
  if (/class=["'][^"']*eq-shop/i.test(html) && !/class=["'][^"']*admin-app/i.test(html)) {
    if (!/href=["']\/contact\.css/i.test(html)) {
      fail(`${page}: contact.css yok (WhatsApp ikonu)`);
    }
    if (!/contact\.js/i.test(html)) {
      fail(`${page}: contact.js yok (WhatsApp ikonu)`);
    }
  }
  if (!html.includes("eq-mobile-chrome-")) {
    fail(`${page}: eq-mobile-chrome yaması yok`);
  }
  if ((html.match(/src=["']\/theme\.js/gi) || []).length > 1) {
    fail(`${page}: çift theme.js — kategoriler kaybolabilir`);
  }
}

for (const page of ["index.html", ...DEPT_PLP_PAGES]) {
  checkShopHead(read(page), page);
}

const indexHtml = read("index.html");
if (!/class=["'][^"']*eq-home-mutbex/i.test(indexHtml)) {
  fail("index.html: body.eq-home.eq-home-mutbex yok");
}
if (!indexHtml.includes("eq-home-mutbex.js")) {
  fail("index.html: eq-home-mutbex.js script yok");
}
if (indexHtml.includes('fetch("./data/ekipmanlar.json"')) {
  fail("index.html: ./data/ekipmanlar.json — /shop/ altinda 404; /data/ekipmanlar.json kullan");
}
if (/fetch\(['"]data\/pfos-key-to-kategori\.json['"]/.test(indexHtml)) {
  fail("index.html: pfos-key goreli yol — /data/pfos-key-to-kategori.json kullan");
}
if (!indexHtml.includes("/data/ekipmanlar.json") && !indexHtml.includes('equstoDataAssetHref("ekipmanlar.json")')) {
  fail("index.html: kok /data/ekipmanlar.json veya equstoDataAssetHref yok");
}
if (!indexHtml.includes("function eqHomeImgSrc")) {
  fail("index.html: eqHomeImgSrc yok — /shop/ gorsel yollari kirilir");
}
if (!indexHtml.includes('pn === "/shop"') && !indexHtml.includes('pn === "/shop/"')) {
  fail("index.html: /shop/ kanonik canonical guncellemesi yok");
}

for (const page of DEPT_PLP_PAGES) {
  const html = read(page);
  if (!/class=["'][^"']*eq-dept-plp/i.test(html)) {
    fail(`${page}: body.eq-dept-plp yok`);
  }
  if (!html.includes("eq-dept-plp-layout")) {
    fail(`${page}: eq-dept-plp-layout iskeleti yok`);
  }
  if (!html.includes("eq-dept-plp-aside")) {
    fail(`${page}: sol filtre aside yok`);
  }
  if (!html.includes("eq-dept-plp.js")) {
    fail(`${page}: eq-dept-plp.js script yok`);
  }
  if (!html.includes("eq-dept-tips.js")) {
    fail(`${page}: eq-dept-tips.js script yok`);
  }
  if (!/eq-dept-plp\.css/i.test(html)) {
    fail(`${page}: eq-dept-plp.css link yok`);
  }
}

const deptPlpJs = read("eq-dept-plp.js");
if (!deptPlpJs.includes("eq-dept-plp-grid") || !deptPlpJs.includes("data-eq-dept")) {
  fail("eq-dept-plp.js: departman PLP motoru bozulmuş");
}

const themeCss = read("theme.css");
if (!themeCss.includes("@media (min-width: 769px)")) fail("theme.css: masaüstü topnav yedek bloğu yok");
if (!themeCss.includes("--eq-topnav-dept-strip-bg")) fail("theme.css: departman şeridi rengi yok");

const logoJs = read("equsto-logo.js");
const logoVMatch = logoJs.match(/var LOGO_V = "([^"]+)"/);
const logoV = logoVMatch ? logoVMatch[1] : "";
if (!logoJs.includes("equsto-logo-white.png")) fail("equsto-logo.js: equsto-logo-white.png yok");
if (!logoJs.includes("isStaleImg")) fail("equsto-logo.js: isStaleImg / eski logo yenileme yok");
if (!logoJs.includes("wantsLightWordmark")) fail("equsto-logo.js: wantsLightWordmark yok");
if (/brightness\(0\)\s*invert\(1\)/.test(logoJs)) fail("equsto-logo.js: invert filtresi JS içinde olmamalı");
if (/header\.hdr > a\.logo \.eq-logo-img[\s\S]{0,200}brightness\(0\)\s*invert\(1\)/.test(themeCss)) {
  fail("theme.css: header .eq-logo-img üzerinde invert filtresi — equsto-logo-KILIT.txt");
}
if (!/header\.hdr > a\.logo \.eq-logo-img[\s\S]{0,120}filter:\s*none\s*!important/.test(themeCss)) {
  fail("theme.css: header logo filter:none !important yok");
}
for (const png of ["images/equsto-logo.png", "images/equsto-logo-white.png"]) {
  const p = path.join(pub, png);
  if (!fs.existsSync(p)) fail(`${png} dosyası yok`);
  else if (fs.statSync(p).size < 8000) fail(`${png} çok küçük — bozuk veya eksik`);
}
if (!indexHtml.includes("/equsto-logo.js")) fail("index.html: equsto-logo.js script yok");
if (logoV && !indexHtml.includes(`equsto-logo.js?v=${logoV}`)) {
  fail(`index.html: equsto-logo.js?v=${logoV} yok (LOGO_V ile eşleşmeli)`);
}
for (const page of ["login.html", "pisirme.html"]) {
  const html = read(page);
  if (!html.includes("/equsto-logo.js")) fail(`${page}: equsto-logo.js script yok`);
}

if (err) {
  process.exit(1);
}
console.log("[verify-kilit] OK — admin kategori + topnav + ana sayfa + dept PLP + wordmark PNG");
