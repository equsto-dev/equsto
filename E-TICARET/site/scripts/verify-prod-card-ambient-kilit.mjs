/**
 * Deploy öncesi ürün kartı ambient hover kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/prod-card-ambient-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TINT_V = "v12";
const TINT_ASSET_V = "20260530prod-card-tint-v12";
let err = 0;

function fail(msg) {
  console.error("[verify-prod-card-ambient-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/prod-card-ambient-KILIT.txt");
mustExist("public/eq-product-card-tint.js");

const kilit = read("public/prod-card-ambient-KILIT.txt");
if (!kilit.includes("2026-05-30") || !kilit.includes("v12")) {
  fail("prod-card-ambient-KILIT.txt: v12 onay tarihi / sürüm yok");
}

const tint = read("public/eq-product-card-tint.js");
if (!tint.includes("prod-card-ambient-KILIT.txt")) {
  fail("eq-product-card-tint.js: KİLİT başlığı yok");
}
if (!tint.includes('CACHE_VER = "' + TINT_V + '"')) {
  fail(`eq-product-card-tint.js: CACHE_VER ${TINT_V} değil`);
}
if (!tint.includes("FALLBACK_RGB") || !tint.includes("isFallbackRgb")) {
  fail("eq-product-card-tint.js: FALLBACK_RGB / isFallbackRgb yok");
}
if (!tint.includes("sampleFromDisplayImgDeep") || !tint.includes("pickRicherRgb")) {
  fail("eq-product-card-tint.js: merkez odaklı örnekleme (deep/richer) yok");
}
if (!/avgS\s*<\s*24\s*&&\s*bestS\s*>\s*20/.test(tint)) {
  fail("eq-product-card-tint.js: soluk ortalama → canlı piksel yedeği yok");
}
if (/enrichRgb[\s\S]{0,800}return\s*\{\s*r:\s*118,\s*g:\s*132,\s*b:\s*168\s*\}/.test(tint)) {
  fail("eq-product-card-tint.js: enrichRgb sabit gri-mavi dönüşü — KİLİT ihlali");
}
if (!tint.includes("!isFallbackRgb(rgb)") && !tint.includes("!isFallbackRgb(rgb))")) {
  fail("eq-product-card-tint.js: fallback önbellek koruması yok");
}
if (!tint.includes("function findTintCard")) {
  fail("eq-product-card-tint.js: findTintCard yok");
}
if (!tint.includes("--eq-prod-tint-border")) {
  fail("eq-product-card-tint.js: --eq-prod-tint-border yok");
}
if (!tint.includes("--eq-prod-tint-shadow")) {
  fail("eq-product-card-tint.js: --eq-prod-tint-shadow yok");
}
if (!tint.includes("eq-prod-tint-active")) {
  fail("eq-product-card-tint.js: eq-prod-tint-active sınıfı yok");
}
if (tint.includes(".prod-info")) {
  fail("eq-product-card-tint.js: .prod-info tint — KİLİT ihlali");
}
if (/crossOrigin\s*=/.test(tint) || tint.includes("ensureImgCrossOrigin")) {
  fail("eq-product-card-tint.js: görünen img crossOrigin — PLP görselleri kırılır");
}

const theme = read("public/theme.css");
if (!theme.includes(".prod-card-wrap.eq-prod-tint-active")) {
  fail("theme.css: .prod-card-wrap.eq-prod-tint-active yok");
}
if (!theme.includes("--eq-prod-tint-border")) {
  fail("theme.css: --eq-prod-tint-border kullanımı yok");
}
if (/\.main \.products \.prod-card:hover\s*\{[^}]*border-color:\s*var\(--eq-border\)\s*!important/.test(theme)) {
  fail("theme.css: hover çerçeve kilidi geri gelmiş — KİLİT ihlali");
}
if (theme.includes(".eq-prod-tint-active .prod-info")) {
  fail("theme.css: .prod-info ambient gradient — KİLİT ihlali");
}
if (!theme.includes("--eq-plp-ambient-border")) {
  fail("theme.css: PLP ambient border yok");
}
if (!theme.includes(".eq-dept-plp-card__img:hover")) {
  fail("theme.css: PLP kart hover ambient yok");
}

const homeCss = read("public/eq-home-mutbex.css");
if (!homeCss.includes(".prod-card-wrap.eq-prod-tint-active")) {
  fail("eq-home-mutbex.css: prod-card ambient override yok");
}
if (!homeCss.includes(":not(.eq-prod-tint-active)")) {
  fail("eq-home-mutbex.css: :not(.eq-prod-tint-active) hover fallback yok");
}

const legacy = read("lib/vitrin/legacy-scripts.ts");
if (!legacy.includes("eq-product-card-tint.js")) {
  fail("legacy-scripts.ts: HOME_SCRIPTS içinde eq-product-card-tint.js yok");
}

for (const rel of [
  "components/shop/ShopPlpScripts.tsx",
  "components/shop/ShopSearchScripts.tsx",
  "components/shop/ShopProductScripts.tsx",
  "components/besos/BesosModulProductScripts.tsx",
]) {
  const src = read(rel);
  if (!src.includes("eq-product-card-tint.js")) fail(`${rel}: tint script yok`);
}

const nav = read("public/nav.js");
if (!nav.includes("eq-product-card-tint.js")) {
  fail("nav.js: lazy eq-product-card-tint.js yok");
}
if (!nav.includes('EQ_TINT_ASSET_V = "' + TINT_ASSET_V + '"')) {
  fail("nav.js: EQ_TINT_ASSET_V kilit değeri eşleşmiyor");
}
if (!nav.includes('filename === "eq-product-card-tint.js"') || !nav.includes("EQ_TINT_ASSET_V")) {
  fail("nav.js: eq-product-card-tint.js ?v= cache bust yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes("SHOP_ASSET_V")) fail("assets.ts: SHOP_ASSET_V yok");

if (err) {
  console.error("\n[verify-prod-card-ambient-kilit] KİLİT ihlali — prod-card-ambient-KILIT.txt");
  process.exit(1);
}
console.log("[verify-prod-card-ambient-kilit] OK — ambient hover v12 + script yükleme kilidi");
