/**
 * Deploy öncesi PDP / E-PDP kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/pdp-epdp-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-pdp-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/pdp-epdp-KILIT.txt");
mustExist("public/eq-product-page.css");

const inline = read("public/eq-product-page-inline.js");
if (!/function renderProduct\(x, all\)\s*\{\s*renderEpdpProduct\(x, all\);/.test(inline)) {
  fail("eq-product-page-inline.js: renderProduct → renderEpdpProduct değil");
}
if (/renderAmazonGridProduct\(x, all\)/.test(inline)) {
  fail("eq-product-page-inline.js: renderAmazonGridProduct aktif — KİLİT ihlali");
}
if (!inline.includes("function buyboxPriceParts")) {
  fail("eq-product-page-inline.js: buyboxPriceParts yok");
}
if (!inline.includes("pdp-epdp-KILIT.txt")) {
  fail("eq-product-page-inline.js: KİLİT başlığı yok");
}

const css = read("public/eq-product-page.css");
if (!css.includes(".eq-epdp-hero")) fail("eq-product-page.css: .eq-epdp-hero yok");
if (!css.includes(".eq-mbg-track")) fail("eq-product-page.css: .eq-mbg-track yok");

const theme = read("public/theme.css");
if (!theme.includes("PDP kritik")) fail("theme.css: PDP kritik yedek bloğu yok");
if (!theme.includes(".eq-epdp-hero")) fail("theme.css: .eq-epdp-hero yedek yok");

const page = read("app/(shop)/shop/[dept]/[slug]/page.tsx");
if (!page.includes("eq-product-page.css")) fail("page.tsx: eq-product-page.css link yok");

const styles = read("components/shop/ShopStyles.tsx");
if (!styles.includes("eq-product-page.css")) fail("ShopStyles.tsx: eq-product-page.css yok");

const scripts = read("components/shop/ShopProductScripts.tsx");
if (!scripts.includes("eq-pdp-page-css-bootstrap")) {
  fail("ShopProductScripts.tsx: CSS bootstrap yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes("SHOP_ASSET_V")) fail("assets.ts: SHOP_ASSET_V yok");

if (err) process.exit(1);
console.log("[verify-pdp-kilit] OK — E-PDP render + CSS + fiyat kilidi");
