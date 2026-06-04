/**
 * Ana sayfa alt slider kilit doğrulama.
 * Kilit: public/home-main-slider-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-home-main-slider-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/home-main-slider-KILIT.txt");
mustExist("components/home/HomeMainSlider.tsx");
mustExist("components/home/HomeMainSliderMount.tsx");
mustExist("components/home/HomeVitrinPortals.tsx");
mustExist("lib/home-slider-content.ts");
mustExist("public/images/pfos/proje-fabrikasi-bar-plan-eskiz.png");
mustExist("public/images/home/hero-sogutma-pisirme-combo.jpg");

const slider = read("components/home/HomeMainSlider.tsx");
if (!slider.includes("eq-mx-vitrin eq-decor-slider-only")) fail("HomeMainSlider.tsx: vitrin sınıfı yok");
if (!slider.includes("eq-mx-hero__slide-bg")) fail("HomeMainSlider.tsx: PFOS img slayt yok");

const mount = read("components/home/HomeMainSliderMount.tsx");
if (!mount.includes("eq-home-slider-mount")) fail("HomeMainSliderMount.tsx: mount id yok");
if (!mount.includes("__eqMxReinitHero")) fail("HomeMainSliderMount.tsx: hero reinit yok");

const content = read("lib/home-slider-content.ts");
if (!content.includes('path: "/images/pfos/proje-fabrikasi-bar-plan-eskiz.png"')) {
  fail("home-slider-content.ts: bar plan eskiz yolu değişmiş");
}
if (!content.includes("width: 1024") || !content.includes("height: 331")) {
  fail("home-slider-content.ts: PFOS boyut 1024×331 değil");
}

if (!content.includes("homeMainSliderSogutmaPisirmeImage")) {
  fail("home-slider-content.ts: sogutma kompozit sabiti yok");
}
if (!content.includes('path: "/images/home/hero-sogutma-pisirme-combo.jpg"')) {
  fail("home-slider-content.ts: sogutma kompozit yolu değişmiş");
}
if (!content.includes("Atalay pişirme")) {
  fail("home-slider-content.ts: sogutma slayt metni değişmiş");
}

const portals = read("components/home/HomeVitrinPortals.tsx");
if (!portals.includes("HomeMainSliderMount")) fail("HomeVitrinPortals.tsx: slider mount yok");

const indexBody = read("lib/vitrin/bodies/index.ts");
if (!indexBody.includes("eq-home-slider-mount")) {
  fail("index.ts: eq-home-slider-mount yok");
}
if (indexBody.includes('<section class="eq-mx-vitrin eq-decor-slider-only"')) {
  fail("index.ts: gömülü slider HTML geri gelmiş");
}

const page = read("app/(vitrin)/page.tsx");
if (!page.includes("HomeVitrinPortalsDynamic")) fail("page.tsx: HomeVitrinPortalsDynamic yok");
if (page.includes("ssr: false")) fail("page.tsx: ssr:false Server Component icinde olmamali");

const decor = read("public/eq-home-decor.css");
if (!decor.includes("proje-fabrikasi-bar-plan-eskiz.png")) {
  fail("eq-home-decor.css: bar plan eskiz referansı yok");
}
if (!decor.includes("eq-mx-hero__slide--sogutma")) {
  fail("eq-home-decor.css: sogutma slayt stili yok");
}
if (!decor.includes("object-fit: contain")) fail("eq-home-decor.css: contain kuralı yok");

const vitrinCfg = read("public/eq-vitrin-config.js");
if (!vitrinCfg.includes("isHomeMainSliderLocked")) {
  fail("eq-vitrin-config.js: slider kilit koruması yok");
}
if (!vitrinCfg.includes("data-eq-slider-kilit")) {
  fail("eq-vitrin-config.js: data-eq-slider-kilit kontrolü yok");
}

if (mount.includes('data-eq-slider-kilit')) {
  // ok — mount işaretleniyor
} else {
  fail("HomeMainSliderMount.tsx: data-eq-slider-kilit set edilmiyor");
}

if (!slider.includes('data-eq-slider-kilit="1"')) {
  fail("HomeMainSlider.tsx: data-eq-slider-kilit yok");
}

if (err) {
  console.error("[verify-home-main-slider-kilit] Kilit ihlali");
  process.exit(1);
}
console.log("[verify-home-main-slider-kilit] OK — React slider + bar plan eskizi");
