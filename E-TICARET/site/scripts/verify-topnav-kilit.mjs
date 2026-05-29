/**
 * Deploy öncesi topnav / Bar Design sırası kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/topnav-bar-design-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-topnav-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

function barDesignAfterDepts(src, label) {
  const mapIdx = src.indexOf("TOP_DEPTS.map");
  const deptNavIdx = src.indexOf("DEPT_NAV.map");
  const besosIdx = src.lastIndexOf("topnav-besos");
  const icecekIdx = src.lastIndexOf('goEqDept("icecek")');
  const anchor = mapIdx >= 0 ? mapIdx : deptNavIdx >= 0 ? deptNavIdx : icecekIdx;
  if (besosIdx < 0) fail(`${label}: topnav-besos yok`);
  else if (anchor >= 0 && !(anchor < besosIdx)) fail(`${label}: Bar Design departman listesinden önce`);
}

mustExist("public/topnav-bar-design-KILIT.txt");

barDesignAfterDepts(read("components/shop/ShopEqustoChrome.tsx"), "ShopEqustoChrome.tsx");

const besosChrome = read("components/besos/BesosEqustoChrome.tsx");
if (!/variant\s*=\s*["']besos["']/.test(besosChrome)) {
  fail("BesosEqustoChrome.tsx: ShopEqustoChrome variant=besos kullanmalı");
}

const pfos = read("components/pfos/public/PfosEqustoChrome.tsx");
const pfosIcecek = pfos.lastIndexOf('goEqDept("icecek")');
const pfosBesos = pfos.lastIndexOf("topnav-besos");
if (pfosBesos < 0 || pfosIcecek < 0 || !(pfosIcecek < pfosBesos)) {
  fail("PfosEqustoChrome.tsx: Bar Design icecek sonrası değil");
}

const partial = read("public/partials/eq-d-header.html");
const partialIcecek = partial.indexOf("nav.icecek");
const partialBesos = partial.indexOf("topnav-besos");
if (partialBesos < 0 || partialIcecek < 0 || !(partialIcecek < partialBesos)) {
  fail("eq-d-header.html: Bar Design icecek sonrası değil");
}

const themeJs = read("public/theme.js");
if (!themeJs.includes("function normalizeTopnavBarDesignLast")) {
  fail("theme.js: normalizeTopnavBarDesignLast yok");
}
if (!themeJs.includes("topnav-bar-design-KILIT.txt") && !themeJs.includes("normalizeTopnavBarDesignLast")) {
  /* optional cross-ref in theme.js — normalize is enough */
}

const themeCss = read("public/theme.css");
if (!themeCss.includes("width: max-content")) fail("theme.css: topnav-inner max-content yok");
if (
  !/body\.eq-shop:not\(\.admin-app\):not\(\.bd-page\)\s+nav\.topnav[\s\S]{0,160}display:\s*flex\s*!important/.test(
    themeCss
  )
) {
  fail("theme.css: mobil topnav display:flex yok — KİLİT ihlali");
}

const sync = read("lib/shop/sync-shop-chrome.ts");
if (!sync.includes("topnav-besos")) fail("sync-shop-chrome.ts: Bar Design kaydırma yok");

if (err) process.exit(1);
console.log("[verify-topnav-kilit] OK — Bar Design en sağda + topnav kilidi");
