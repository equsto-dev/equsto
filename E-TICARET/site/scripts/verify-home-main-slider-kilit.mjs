/**
 * Ana sayfa alt slider kilit doğrulama.
 * Kilit: public/home-main-slider-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mustExistOrCdn } from "./lib/must-exist-or-cdn.mjs";

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

const HERO_IMAGES = [
  "public/images/pfos/proje-fabrikasi-bar-plan-eskiz.png",
  "public/images/home/hero-bar-cocktailstation.png",
  "public/images/home/hero-bar-cocktailstation-cutout.png",
  "public/images/home/hero-bar-cocktailstation-popcat-white.png",
  "public/images/home/electrolux-xp-pisirme.webp",
  "public/images/imt300/imt300-2.png",
];
for (const rel of HERO_IMAGES) {
  await mustExistOrCdn(siteDir, rel, fail, "[verify-home-main-slider-kilit]");
}

const kilit = read("public/home-main-slider-KILIT.txt");
if (!kilit.includes("hero-bar-cocktailstation.png")) {
  fail("home-main-slider-KILIT.txt: Bar görsel kilidi yok (vitrin)");
}
if (kilit.includes("4 slayt, 4 thumb")) {
  fail("home-main-slider-KILIT.txt: Bar slaytı kaldırıldı — 3 slayt olmalı");
}
if (!kilit.includes("3 slayt, 3 thumb")) {
  fail("home-main-slider-KILIT.txt: 3 slayt kilidi yok");
}
if (!kilit.includes("Bar Design slaytı YOK")) {
  fail("home-main-slider-KILIT.txt: Bar slider'dan çıkarıldı notu yok");
}
if (!kilit.includes("imt300-2.png")) fail("home-main-slider-KILIT.txt: IMT300 kilidi yok");

const slider = read("components/home/HomeMainSlider.tsx");
if (!slider.includes('from "@/lib/public-asset-url"')) {
  fail("HomeMainSlider.tsx: public-asset-url import yok (cdn-asset-urls-KILIT)");
}
if (!slider.includes("publicAssetUrl(")) {
  fail("HomeMainSlider.tsx: publicAssetUrl() kullanılmıyor");
}
if (!slider.includes("eq-mx-vitrin eq-decor-slider-only")) fail("HomeMainSlider.tsx: vitrin sınıfı yok");
if (!slider.includes("eq-mx-hero__slide-bg")) fail("HomeMainSlider.tsx: img slayt yok");
if (slider.includes('slide.id === "besos" || slide.id === "sogutma"')) {
  fail("HomeMainSlider.tsx: background dalinda besos karsilastirmasi (TS hatasi)");
}
if (!slider.includes("Electrolux Professional XP pişirme serisi")) {
  fail("HomeMainSlider.tsx: Electrolux XP alt metni yok");
}
if (!slider.includes("eq-mx-hero__slide-promo-em")) {
  fail("HomeMainSlider.tsx: split slayt promo-em yok");
}
if (!slider.includes("SplitPromoSlideView")) {
  fail("HomeMainSlider.tsx: birleşik split promo bileşeni yok");
}
if (!slider.includes("PfosSketchSlideView")) {
  fail("HomeMainSlider.tsx: PFOS eskiz-only bileşeni yok");
}
if (!slider.includes("eq-mx-hero__slide--sketch-only")) {
  fail("HomeMainSlider.tsx: PFOS sketch-only sınıfı yok");
}
if (!slider.includes("eq-mx-hero__sketch-caption")) {
  fail("HomeMainSlider.tsx: PFOS eskiz sol alt caption yok");
}
if (!slider.includes("Proje Fabrikası — bar ve mutfak plan eskizi")) {
  fail("HomeMainSlider.tsx: PFOS eskiz alt metni yok");
}

const mount = read("components/home/HomeMainSliderMount.tsx");
if (!mount.includes("eq-home-slider-mount")) fail("HomeMainSliderMount.tsx: mount id yok");
if (!mount.includes("__eqMxReinitHero")) fail("HomeMainSliderMount.tsx: hero reinit yok");

const content = read("lib/home-slider-content.ts");
if (!content.includes("Projeni/ listeni gönder, fiyatlandıralım")) {
  fail("home-slider-content.ts: PFOS sketchCaption metni eksik");
}
if (!content.includes('path: "/images/pfos/proje-fabrikasi-bar-plan-eskiz.png"')) {
  fail("home-slider-content.ts: bar plan eskiz yolu değişmiş");
}
if (!content.includes("width: 1024") || !content.includes("height: 331")) {
  fail("home-slider-content.ts: PFOS boyut 1024×331 değil");
}

if (!content.includes("homeMainSliderBarImage")) {
  fail("home-slider-content.ts: homeMainSliderBarImage sabiti yok");
}
if (!content.includes('path: "/images/home/hero-bar-cocktailstation-cutout.png"')) {
  fail("home-slider-content.ts: Bar Design görsel yolu değişmiş");
}
if (!content.includes("width: 1200") || !content.includes("height: 713")) {
  fail("home-slider-content.ts: Bar Design boyut 1200×713 değil");
}
const slidesStart = content.indexOf("export const homeMainSliderSlides");
const slidesBody = slidesStart >= 0 ? content.slice(slidesStart) : content;
if (slidesBody.includes('id: "besos",')) {
  fail("home-slider-content.ts: Bar Design slaytı ana slider'da hâlâ var");
}
const electroluxIdx = slidesBody.indexOf('id: "electrolux-xp",');
if (electroluxIdx < 0) {
  fail("home-slider-content.ts: electrolux-xp slayt tanımı yok");
}

if (!content.includes("homeMainSliderImt300Image")) {
  fail("home-slider-content.ts: homeMainSliderImt300Image sabiti yok");
}
if (!content.includes('path: "/images/imt300/imt300-2.png"')) {
  fail("home-slider-content.ts: IMT300 görsel yolu değişmiş");
}
if (!content.includes("width: 3381") || !content.includes("height: 3007")) {
  fail("home-slider-content.ts: IMT300 boyut 3381×3007 değil");
}
const pfosIdx = slidesBody.indexOf('id: "pfos",');
const imtIdx = slidesBody.indexOf('id: "imt300",');
if (pfosIdx < 0) {
  fail("home-slider-content.ts: PFOS slayt tanımı yok");
} else {
  const pfosBlock = slidesBody.slice(pfosIdx, imtIdx >= 0 ? imtIdx : slidesBody.length);
  if (!pfosBlock.includes('kind: "sketch"')) {
    fail("home-slider-content.ts: PFOS kind sketch değil");
  }
  if (pfosBlock.includes("promoKicker")) {
    fail("home-slider-content.ts: PFOS promo metinleri kaldırılmamış");
  }
}
if (imtIdx < 0) {
  fail("home-slider-content.ts: IMT300 slayt tanımı yok");
} else if (!slidesBody.slice(imtIdx).includes('kind: "hero-img"')) {
  fail("home-slider-content.ts: IMT300 kind hero-img değil");
} else if (pfosIdx < 0 || imtIdx <= pfosIdx) {
  fail("home-slider-content.ts: IMT300 slaytı Proje Fabrikasından sonra değil");
}

if (!content.includes("homeMainSliderSogutmaPisirmeImage")) {
  fail("home-slider-content.ts: sogutma kompozit sabiti yok");
}
if (!content.includes('path: "/images/home/hero-sogutma-pisirme-combo.jpg"')) {
  fail("home-slider-content.ts: sogutma kompozit yolu değişmiş");
}
if (!content.includes("homeMainSliderElectroluxXpImage")) {
  fail("home-slider-content.ts: Electrolux XP görsel sabiti yok");
}
if (!content.includes('path: "/images/home/electrolux-xp-pisirme.webp"')) {
  fail("home-slider-content.ts: Electrolux XP görsel yolu değişmiş");
}
if (!content.includes("XP Pişirme Serisi")) {
  fail("home-slider-content.ts: Electrolux XP slayt başlığı değişmiş");
}
if (!content.includes("700XP ve 900XP")) {
  fail("home-slider-content.ts: Electrolux XP slayt metni değişmiş");
}
if (!content.includes("homeMainSliderBesosComplements")) {
  fail("home-slider-content.ts: Manhattan tamamlayıcıları sabiti yok");
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
if (!decor.includes("eq-mx-hero__slide--bar")) {
  fail("eq-home-decor.css: bar slayt sınıfı yok");
}
if (!decor.includes("eq-mx-hero__slide--imt300")) {
  fail("eq-home-decor.css: imt300 slayt stili yok");
}
if (!decor.includes("eq-mx-hero__slide--electrolux-xp")) {
  fail("eq-home-decor.css: electrolux-xp slayt stili yok");
}
if (!decor.includes("eq-mx-hero__slide--pfos")) {
  fail("eq-home-decor.css: pfos slayt stili yok");
}
if (!decor.includes("grid-template-columns: minmax(0, 3fr) minmax(0, 2fr)")) {
  fail("eq-home-decor.css: split 3fr/2fr grid kilidi yok");
}
const decorNorm = decor.replace(/\s+/g, " ");
const splitContain =
  decor.includes("eq-mx-hero__slide--sketch-only") &&
  decor.includes("object-fit: contain");
const splitFlex =
  decorNorm.includes(
    "body.eq-home-decor .eq-mx-vitrin.eq-decor-slider-only .eq-mx-hero__slide--imt300",
  ) &&
  decorNorm.includes(
    "body.eq-home-decor .eq-mx-vitrin.eq-decor-slider-only .eq-mx-hero__slide--electrolux-xp",
  ) &&
  decor.includes("display: flex");
if (!splitContain) fail("eq-home-decor.css: PFOS eskiz-only contain kuralı yok");
if (!splitFlex) fail("eq-home-decor.css: split slayt flex/grid kuralı yok");
if (!decor.includes("eq-mx-hero__slide--sketch-only")) {
  fail("eq-home-decor.css: PFOS sketch-only stili yok");
}
if (!decor.includes("eq-home-platform-hero")) {
  fail("eq-home-decor.css: platform hero hizalama yok");
}
if (!decor.includes("grid-template-columns: repeat(3, minmax(0, 1fr))")) {
  fail("eq-home-decor.css: uc lu hero grid kilidi yok");
}

const vitrinCfg = read("public/eq-vitrin-config.js");
if (!vitrinCfg.includes("isHomeMainSliderLocked")) {
  fail("eq-vitrin-config.js: slider kilit koruması yok");
}
if (!vitrinCfg.includes("data-eq-slider-kilit")) {
  fail("eq-vitrin-config.js: data-eq-slider-kilit kontrolü yok");
}

if (!mount.includes("data-eq-slider-kilit")) {
  fail("HomeMainSliderMount.tsx: data-eq-slider-kilit set edilmiyor");
}

if (!slider.includes('data-eq-slider-kilit="1"')) {
  fail("HomeMainSlider.tsx: data-eq-slider-kilit yok");
}

if (err) {
  console.error("[verify-home-main-slider-kilit] Kilit ihlali");
  process.exit(1);
}
console.log("[verify-home-main-slider-kilit] OK — PFOS eskiz · IMT300 · Electrolux XP (3 slayt)");
