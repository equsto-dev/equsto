/**
 * Deploy öncesi ürün kartı ambient hover kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/prod-card-ambient-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

const tint = read("public/eq-product-card-tint.js");
if (!tint.includes("prod-card-ambient-KILIT.txt")) {
  fail("eq-product-card-tint.js: KİLİT başlığı yok");
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
]) {
  const src = read(rel);
  if (!src.includes("eq-product-card-tint.js")) fail(`${rel}: tint script yok`);
}

const nav = read("public/nav.js");
if (!nav.includes("eq-product-card-tint.js")) {
  fail("nav.js: lazy eq-product-card-tint.js yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes("SHOP_ASSET_V")) fail("assets.ts: SHOP_ASSET_V yok");

if (err) process.exit(1);
console.log("[verify-prod-card-ambient-kilit] OK — ambient hover + script yükleme kilidi");
