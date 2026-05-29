/**
 * Deploy öncesi footer marka şeridi kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/footer-brand-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-footer-brand-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/footer-brand-KILIT.txt");

const footer = read("public/eq-footer.js");
if (!footer.includes("footer-brand-KILIT.txt")) {
  fail("eq-footer.js: KİLİT başlığı yok");
}
if (!footer.includes('COMPANY_WORDS = ["EQUSTO", "TEKNOLOJİ", "LİMİTED"]')) {
  fail("eq-footer.js: COMPANY_WORDS üç kelime değil");
}
if (!footer.includes("function fixCompanyLine")) {
  fail("eq-footer.js: fixCompanyLine yok");
}
if (!footer.includes('data-eq-co-layout="word3"')) {
  fail("eq-footer.js: data-eq-co-layout=word3 yok");
}
if (!footer.includes("data-i18n-skip")) {
  fail("eq-footer.js: şirket satırı data-i18n-skip yok");
}
if (/eq-mfoot-back[\s\S]{0,80}Başa dön/.test(footer) || footer.includes('footer.back_to_top", "Başa dön"')) {
  fail("eq-footer.js: Başa dön geri gelmiş — KİLİT ihlali");
}
if (!footer.includes("__eqFixFooterCompanyAll")) {
  fail("eq-footer.js: __eqFixFooterCompanyAll export yok");
}

const theme = read("public/theme.css");
if (!theme.includes("footer-brand-KILIT.txt") && !theme.includes("margin-left: 3ch")) {
  fail("theme.css: kelime arası 3ch kuralı yok");
}
if (!/footer\.eq-mfoot \.eq-mfoot-company[\s\S]{0,200}letter-spacing:\s*0\s*!important/.test(theme)) {
  fail("theme.css: şirket satırı letter-spacing:0 !important yok");
}
if (!/\.eq-mfoot-brand[\s\S]{0,120}align-items:\s*center/.test(theme)) {
  fail("theme.css: eq-mfoot-brand ortalı değil");
}

const themeJs = read("public/theme.js");
if (!themeJs.includes("enforceFooterBrandLock")) {
  fail("theme.js: enforceFooterBrandLock yok");
}

const vitrin = read("public/data/footer-vitrin.json");
if (!vitrin.includes("EQUSTO   TEKNOLOJİ   LİMİTED")) {
  fail("footer-vitrin.json: companyDisplay üç kelime boşluklu değil");
}

if (err) process.exit(1);
console.log("[verify-footer-brand-kilit] OK — footer marka şeridi kilidi");
