/**
 * Deploy öncesi Besos logo + footer chrome kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/besos-chrome-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-besos-chrome-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/besos-chrome-KILIT.txt");
mustExist("components/shop/EqustoLogoLink.tsx");
mustExist("components/shop/ShopFooterHost.tsx");
mustExist("lib/shop/logo.ts");

const logoLink = read("components/shop/EqustoLogoLink.tsx");
if (!logoLink.includes("eq-logo-img")) fail("EqustoLogoLink.tsx: eq-logo-img yok");
if (!logoLink.includes("EQUSTO_LOGO_LIGHT")) fail("EqustoLogoLink.tsx: EQUSTO_LOGO_LIGHT yok");
if (!logoLink.includes("EQUSTO_LOGO_REFRESH")) fail("EqustoLogoLink.tsx: EQUSTO_LOGO_REFRESH yok");

const footerHost = read("components/shop/ShopFooterHost.tsx");
if (!footerHost.includes("__eqMountMarketFooter")) {
  fail("ShopFooterHost.tsx: __eqMountMarketFooter yok");
}
if (!footerHost.includes("suppressHydrationWarning")) {
  fail("ShopFooterHost.tsx: suppressHydrationWarning yok");
}

const chrome = read("components/shop/ShopEqustoChrome.tsx");
if (!chrome.includes("<EqustoLogoLink")) fail("ShopEqustoChrome.tsx: EqustoLogoLink kullanılmıyor");
if (chrome.includes('<a className="logo" href="/"')) {
  fail("ShopEqustoChrome.tsx: boş logo linki geri gelmiş");
}

const besosScripts = read("components/besos/BesosScripts.tsx");
if (!besosScripts.includes("EQUSTO_LOGO_REFRESH")) {
  fail("BesosScripts.tsx: logo onReady yok");
}
if (!besosScripts.includes("__eqMountMarketFooter")) {
  fail("BesosScripts.tsx: footer onReady yok");
}

for (const page of ["app/besos/page.tsx", "app/besos/imt300/page.tsx"]) {
  const src = read(page);
  if (!src.includes("ShopFooterHost")) fail(`${page}: ShopFooterHost yok`);
}

const modul = read("lib/besos/render-modul-page.tsx");
if (!modul.includes("ShopFooterHost")) fail("render-modul-page.tsx: ShopFooterHost yok");

const logoJs = read("public/equsto-logo.js");
if (!logoJs.includes('getElementById("eq-shop-chrome-root")')) {
  fail("equsto-logo.js: chrome root MutationObserver yok");
}

const footerJs = read("public/eq-footer.js");
if (!footerJs.includes('bd-page") && !b.classList.contains("besos")')) {
  fail("eq-footer.js: besos shouldMount koşulu değişmiş");
}

const besosCss = read("app/besos/besos.css");
if (!/body\.bd-page\.besos\.eq-shop footer\.footer\.eq-mfoot[\s\S]{0,120}display:\s*block/.test(besosCss)) {
  fail("besos.css: eq-mfoot display:block yok");
}

const shellCss = read("public/besos-shell.css");
if (!shellCss.includes("header.hdr > a.logo")) {
  fail("besos-shell.css: header logo görünürlük kuralı yok");
}

const besosEqusto = read("components/besos/BesosEqustoChrome.tsx");
if (!/variant\s*=\s*["']besos["']/.test(besosEqusto)) {
  fail("BesosEqustoChrome.tsx: variant=besos kullanmalı");
}

if (err) process.exit(1);
console.log("[verify-besos-chrome-kilit] OK — Besos logo + footer chrome kilidi");
