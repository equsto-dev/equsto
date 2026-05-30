/**
 * Deploy öncesi PDP Cafemarkt buybox kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/pdp-buybox-cafemarkt-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-pdp-buybox-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/pdp-buybox-cafemarkt-KILIT.txt");

const kilit = read("public/pdp-buybox-cafemarkt-KILIT.txt");
if (!kilit.includes("2026-05-30") || !kilit.includes("eq-cmf-buybox")) {
  fail("pdp-buybox-cafemarkt-KILIT.txt: onay tarihi / buybox referansı yok");
}

const inline = read("public/eq-product-page-inline.js");
if (!inline.includes("pdp-buybox-cafemarkt-KILIT.txt")) {
  fail("eq-product-page-inline.js: buybox KİLİT referansı yok");
}
if (!inline.includes("function renderEpdpBuybox")) {
  fail("eq-product-page-inline.js: renderEpdpBuybox yok");
}
if (!inline.includes("function pdpBuyboxPerks")) {
  fail("eq-product-page-inline.js: pdpBuyboxPerks yok");
}
if (!inline.includes("function bindEpdpBuybox")) {
  fail("eq-product-page-inline.js: bindEpdpBuybox yok");
}
if (!/eq-cmf-buybox/.test(inline)) {
  fail("eq-product-page-inline.js: .eq-cmf-buybox HTML yok");
}
if (!/eq-cmf-qty__val/.test(inline)) {
  fail("eq-product-page-inline.js: adet stepper yok");
}
if (!/eq-cmf-add-btn/.test(inline)) {
  fail("eq-product-page-inline.js: .eq-cmf-add-btn yok");
}
if (/eq-amz-btn-buynow/.test(inline) && /renderEpdpBuybox[\s\S]*eq-amz-btn-buynow/.test(inline)) {
  fail("eq-product-page-inline.js: buybox içinde Proje Fabrikası (eq-amz-btn-buynow) — KİLİT ihlali");
}

const css = read("public/eq-product-page.css");
if (!css.includes(".eq-cmf-buybox")) fail("eq-product-page.css: .eq-cmf-buybox yok");
if (!css.includes(".eq-cmf-perks")) fail("eq-product-page.css: .eq-cmf-perks yok");
if (!css.includes(".eq-cmf-purchase")) fail("eq-product-page.css: .eq-cmf-purchase yok");
if (!css.includes(".eq-cmf-add-btn")) fail("eq-product-page.css: .eq-cmf-add-btn yok");

const cart = read("public/ecom-cart.js");
if (!cart.includes("eq-cmf-qty__val")) {
  fail("ecom-cart.js: buybox adet okuma (.eq-cmf-qty__val) yok");
}

const buildI18n = read("scripts/build-i18n-en.mjs");
if (!buildI18n.includes("add_to_cart_cmf")) {
  fail("build-i18n-en.mjs: pdp.add_to_cart_cmf EN override yok");
}

if (err) {
  console.error("\n[verify-pdp-buybox-kilit] KİLİT ihlali — pdp-buybox-cafemarkt-KILIT.txt");
  process.exit(1);
}
console.log("[verify-pdp-buybox-kilit] OK — Cafemarkt buybox + adet + perks kilidi");
