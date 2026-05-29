/**
 * Deploy öncesi footer marka şeridi kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/footer-brand-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCKED_LINE = "E Q U S T O   T E K N O L O J İ   L İ M İ T E D";
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
mustExist("public/eq-footer.js");
mustExist("public/theme.css");

const footerJs = read("public/eq-footer.js");
if (!footerJs.includes('COMPANY_DISPLAY_LINE = "' + LOCKED_LINE + '"')) {
  fail("eq-footer.js: COMPANY_DISPLAY_LINE kilit metni eşleşmiyor");
}
if (!footerJs.includes("data-i18n-skip")) {
  fail("eq-footer.js: data-i18n-skip yok");
}
if (!footerJs.includes("watchCompanyLine")) {
  fail("eq-footer.js: watchCompanyLine yok");
}
if (!footerJs.includes("__eqFixFooterCompanyAll")) {
  fail("eq-footer.js: __eqFixFooterCompanyAll yok");
}

const themeCss = read("public/theme.css");
if (!/\.eq-mfoot-company[\s\S]*white-space:\s*pre/.test(themeCss)) {
  fail("theme.css: .eq-mfoot-company white-space: pre yok");
}

const vitrin = JSON.parse(read("public/data/footer-vitrin.json"));
if (vitrin.companyDisplay !== LOCKED_LINE) {
  fail("footer-vitrin.json: companyDisplay kilit metni eşleşmiyor");
}

for (const loc of ["public/i18n/tr.json", "public/i18n/en.json"]) {
  const j = JSON.parse(read(loc));
  if (j.footer?.company_display !== LOCKED_LINE) {
    fail(`${loc}: footer.company_display kilit metni eşleşmiyor`);
  }
}

if (err) {
  console.error("\n[verify-footer-brand-kilit] KİLİT ihlali — footer-brand-KILIT.txt");
  process.exit(1);
}
console.log("[verify-footer-brand-kilit] OK:", LOCKED_LINE);
