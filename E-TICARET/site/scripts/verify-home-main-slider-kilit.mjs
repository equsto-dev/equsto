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
mustExist("public/images/home/hero-bar-cocktailstation.png");
mustExist("public/images/home/hero-sogutma-pisirme-combo.jpg");
mustExist("public/images/imt300/imt300-1.jpg");

const kilit = read("public/home-main-slider-KILIT.txt");
if (!kilit.includes("hero-bar-cocktailstation.png")) {
  fail("home-main-slider-KILIT.txt: Bar Design görsel kilidi yok");
}
if (!kilit.includes("eq-mx-hero__slide--bar")) {
  fail("home-main-slider-KILIT.txt: Bar contain kilidi yok");
}
if (!kilit.includes("imt300-1.jpg")) fail("home-main-slider-KILIT.txt: IMT300 kilidi yok");

const slider = read("components/home/HomeMainSlider.tsx");
if (!slider.includes("eq-mx-vitrin eq-decor-slider-only")) fail("HomeMainSlider.tsx: vitrin sınıfı yok");
if (!slider.includes("eq-mx-hero__slide-bg")) fail("HomeMainSlider.tsx: img slayt yok");
if (slider.includes('slide.id === "besos" || slide.id === "sogutma"')) {
  fail("HomeMainSlider.tsx: background dalinda besos karsilastirmasi (TS hatasi)");
}
if (!slider.includes("Besos modüler kokteyl istasyonu")) {
  fail("HomeMainSlider.tsx: Bar Design alt metni yok");
}
if (!slider.includes("eq-mx-hero__slide-promo-em")) {
  fail("HomeMainSlider.tsx: split slayt promo-em yok");
}
if (!slider.includes("eq-mx-hero__slide-complements")) {
  fail("HomeMainSlider.tsx: Bar tamamlayıcı kartları yok");
}

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

if (!content.includes("homeMainSliderBarImage")) {
  fail("home-slider-content.ts: homeMainSliderBarImage sabiti yok");
}
if (!content.includes('path: "/images/home/hero-bar-cocktailstation.png"')) {
  fail("home-slider-content.ts: Bar Design görsel yolu değişmiş");
}
if (!content.includes("width: 1200") || !content.includes("height: 713")) {
  fail("home-slider-content.ts: Bar Design boyut 1200×713 değil");
}
const slidesStart = content.indexOf("export const homeMainSliderSlides");
const slidesBody = slidesStart >= 0 ? content.slice(slidesStart) : content;
const besosIdx = slidesBody.indexOf('id: "besos",');
const sogutmaIdx = slidesBody.indexOf('id: "sogutma",');
if (besosIdx < 0 || sogutmaIdx < 0) {
  fail("home-slider-content.ts: besos/sogutma slayt tanımı yok");
} else {
  const besosBlock = slidesBody.slice(besosIdx, sogutmaIdx);
  if (!besosBlock.includes('kind: "hero-img"')) {
    fail("home-slider-content.ts: Bar Design kind hero-img değil");
  }
  if (besosBlock.includes('kind: "background"')) {
    fail("home-slider-content.ts: Bar Design background slaytına dönmüş");
  }
}

if (!content.includes("homeMainSliderImt300Image")) {
  fail("home-slider-content.ts: homeMainSliderImt300Image sabiti yok");
}
if (!content.includes('path: "/images/imt300/imt300-1.jpg"')) {
  fail("home-slider-content.ts: IMT300 görsel yolu değişmiş");
}
const imtIdx = slidesBody.indexOf('id: "imt300",');
if (imtIdx < 0) {
  fail("home-slider-content.ts: IMT300 slayt tanımı yok");
} else if (!slidesBody.slice(imtIdx).includes('kind: "hero-img"')) {
  fail("home-slider-content.ts: IMT300 kind hero-img değil");
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
if (!content.includes("Bar Design Studio")) {
  fail("home-slider-content.ts: Bar Design başlığı değişmiş");
}
if (!content.includes("Modüler Kokteyl İstasyonu")) {
  fail("home-slider-content.ts: Bar Design titleEm yok");
}
if (!content.includes("homeMainSliderBesosComplements")) {
  fail("home-slider-content.ts: Manhattan tamamlayıcıları yok");
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
if (!decor.includes("eq-mx-hero__slide--sogutma")) {
  fail("eq-home-decor.css: sogutma slayt stili yok");
}
const decorNorm = decor.replace(/\s+/g, " ");
const splitContain =
  decor.includes("eq-mx-hero__slide--split") &&
  decorNorm.includes(
    "body.eq-home-decor .eq-mx-vitrin.eq-decor-slider-only .eq-mx-hero__slide--imt300 .eq-mx-hero__slide-media .eq-mx-hero__slide-bg",
  ) &&
  decor.includes("object-fit: contain");
const splitFlex =
  decorNorm.includes(
    "body.eq-home-decor .eq-mx-vitrin.eq-decor-slider-only .eq-mx-hero__slide--imt300",
  ) && decor.includes("display: flex");
if (!splitContain) fail("eq-home-decor.css: split slayt contain kuralı yok");
if (!splitFlex) fail("eq-home-decor.css: IMT300 yüksek özgüllüklü flex kuralı yok");
if (!decor.includes("eq-home-platform-hero")) {
  fail("eq-home-decor.css: platform hero hizalama yok");
}
if (!decor.includes("grid-template-columns: repeat(3, minmax(0, 1fr))")) {
  fail("eq-home-decor.css: uc lu hero grid kilidi yok");
}
if (!decor.includes("eq-mx-hero__slide--bar .eq-mx-hero__slide-promo-badges")) {
  fail("eq-home-decor.css: Bar promo rozetleri yok");
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
console.log("[verify-home-main-slider-kilit] OK — PFOS · Bar contain · Soğutma · IMT300");
