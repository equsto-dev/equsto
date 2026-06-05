/**
 * Deploy öncesi ana sayfa üçlü hero vitrin kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/home-hero-ads-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mustExistOrCdn } from "./lib/must-exist-or-cdn.mjs";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-home-hero-ads-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/home-hero-ads-KILIT.txt");
mustExist("components/home/HomeHeroAds.tsx");
mustExist("components/home/HomeHeroAdsMount.tsx");

await mustExistOrCdn(
  siteDir,
  "public/images/pfos/proje-fabrikasi-mutfak-eskiz.png",
  fail,
  "[verify-home-hero-ads-kilit]",
);

const kilit = read("public/home-hero-ads-KILIT.txt");
if (!kilit.includes("b04a99b5") || !kilit.includes("4:3")) {
  fail("home-hero-ads-KILIT.txt: onay commit / 4:3 referansı yok");
}

const mount = read("components/home/HomeHeroAdsMount.tsx");
if (!mount.includes("eq-home-hero-mount")) fail("HomeHeroAdsMount.tsx: mount id yok");
if (!mount.includes("HomeHeroAds")) fail("HomeHeroAdsMount.tsx: HomeHeroAds portal yok");

const hero = read("components/home/HomeHeroAds.tsx");
if (!hero.includes("eq-home-hero-ads")) fail("HomeHeroAds.tsx: eq-home-hero-ads yok");
if (!hero.includes("hero-card-img--pfos-cover")) fail("HomeHeroAds.tsx: PFOS img sınıfı yok");

const home = read("lib/home-content.ts");
if (!home.includes('image: "/images/pfos/proje-fabrikasi-mutfak-eskiz.png"')) {
  fail("home-content.ts: PFOS eskiz yolu değişmiş");
}
if (!home.includes("imageWidth: 495") || !home.includes("imageHeight: 394")) {
  fail("home-content.ts: PFOS boyut ipuçları 495×394 değil");
}
if (!/id: "pfos"[\s\S]*?id: "yer"[\s\S]*?id: "besos"/.test(home)) {
  fail("home-content.ts: pfos/yer/besos sırası veya eksik kart");
}

const indexBody = read("lib/vitrin/bodies/index.ts");
if (!indexBody.includes("eq-home-hero-mount")) {
  fail("index.ts: eq-home-hero-mount yok");
}
if (!indexBody.includes("eq-home-platform-hero")) {
  fail("index.ts: eq-home-platform-hero sarmalayici yok");
}
if (indexBody.includes('<section class="hero eq-home-hero-ads"')) {
  fail("index.ts: gömülü hero HTML geri gelmiş (React portal kullanılmalı)");
}
if (indexBody.includes("eq-decor-promos")) {
  fail("index.ts: eq-decor-promos alt promo bandı geri gelmiş (kaldırılmalı)");
}

const page = read("app/(vitrin)/page.tsx");
if (!page.includes("HomeVitrinPortals")) fail("page.tsx: HomeVitrinPortals yok");
const portals = read("components/home/HomeVitrinPortals.tsx");
if (!portals.includes("HomeHeroAdsMount")) fail("HomeVitrinPortals.tsx: HomeHeroAdsMount yok");

const critical = read("lib/vitrin/legacy-scripts.ts");
if (!critical.includes("eq-home-hero-mount>section.hero.eq-home-hero-ads")) {
  fail("legacy-scripts.ts: portal grid critical CSS yok");
}
if (!critical.includes("--eq-home-hero-visual-aspect:4/3")) {
  fail("legacy-scripts.ts: 4:3 critical CSS yok");
}

const theme = read("public/theme.css");
if (!theme.includes(".eq-home-platform-hero > .hero-banner")) {
  fail("theme.css: platform-hero icindeki banner secicisi yok");
}
if (!theme.includes("--eq-home-hero-visual-aspect: 4 / 3")) {
  fail("theme.css: --eq-home-hero-visual-aspect 4/3 yok");
}
if (/hero-card-visual--pfos[\s\S]{0,120}aspect-ratio:\s*956\s*\/\s*1024/.test(theme)) {
  fail("theme.css: PFOS 956/1024 override geri gelmiş");
}

const decor = read("public/eq-home-decor.css");
if (!decor.includes("body.eq-home-decor .eq-decor-promos") || !decor.includes("display: none !important")) {
  fail("eq-home-decor.css: eq-decor-promos gizleme kuralı yok");
}
if (/hero-card-visual--pfos[\s\S]{0,120}aspect-ratio:\s*956\s*\/\s*1024/.test(decor)) {
  fail("eq-home-decor.css: PFOS 956/1024 override geri gelmiş");
}

if (err) {
  console.error("[verify-home-hero-ads-kilit] Kilit ihlali — public/home-hero-ads-KILIT.txt");
  process.exit(1);
}
console.log("[verify-home-hero-ads-kilit] OK — üçlü hero 4:3 + React portal");
