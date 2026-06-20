/**
 * Deploy öncesi marka PLP sol filtre kilit doğrulama.
 * Kilit: public/marka-plp-facets-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-marka-plp-facets-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/marka-plp-facets-KILIT.txt");

const kilit = read("public/marka-plp-facets-KILIT.txt");
if (!kilit.includes("2026-06-19") || !kilit.includes("7161b659")) {
  fail("marka-plp-facets-KILIT.txt: onay tarihi / commit referansı yok");
}

const page = read("app/(shop)/shop/marka/[slug]/page.tsx");
if (!page.includes("marka-plp-facets-KILIT.txt")) {
  fail("page.tsx: marka-plp-facets-KILIT.txt referansı yok");
}
if (!page.includes('id="eq-marka-plp-facets"')) {
  fail("page.tsx: #eq-marka-plp-facets host yok");
}
if (!page.includes("eq-filter-sec--marka-facets")) {
  fail("page.tsx: eq-filter-sec--marka-facets sınıfı yok");
}

const facets = read("public/eq-marka-plp-facets.js");
if (!facets.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-marka-plp-facets.js: KİLİT referansı yok");
}
if (!facets.includes("EqMarkaPlpFacets")) {
  fail("eq-marka-plp-facets.js: EqMarkaPlpFacets export yok");
}
if (!facets.includes('id: "pisirme"')) {
  fail("eq-marka-plp-facets.js: pisirme dept tile yok");
}
if (!facets.includes("hideBrands: true")) {
  fail("eq-marka-plp-facets.js: hideBrands kullanımı yok");
}
if (!facets.includes("eqProductMatchesDept")) {
  fail("eq-marka-plp-facets.js: eqProductMatchesDept tile eşleşmesi yok");
}

const boot = read("public/eq-marka-plp-boot.js");
if (!boot.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-marka-plp-boot.js: KİLİT referansı yok");
}
if (!boot.includes("EqMarkaPlpFacets.create")) {
  fail("eq-marka-plp-boot.js: EqMarkaPlpFacets.create yok");
}
if (!boot.includes("getPlpFilterFn")) {
  fail("eq-marka-plp-boot.js: getPlpFilterFn bağlantısı yok");
}
if (!boot.includes("facetCtrl.mount")) {
  fail("eq-marka-plp-boot.js: facetCtrl.mount yok");
}

const loader = read("public/eq-marka-scripts-loader.js");
if (!loader.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-marka-scripts-loader.js: KİLİT referansı yok");
}
for (const name of ["eq-pisirme-facets.js", "eq-dept-cm-facets.js", "eq-marka-plp-facets.js"]) {
  if (!loader.includes(name)) fail(`eq-marka-scripts-loader.js: ${name} yüklenmiyor`);
}

const shell = read("public/eq-category-shell.js");
if (!shell.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-category-shell.js: KİLİT referansı yok");
}
if (!shell.includes("getPlpFilterFn")) {
  fail("eq-category-shell.js: getPlpFilterFn yok");
}
if (!shell.includes("refresh:")) {
  fail("eq-category-shell.js: refresh API yok");
}

const cm = read("public/eq-dept-cm-facets.js");
if (!cm.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-dept-cm-facets.js: KİLİT referansı yok");
}
if (!cm.includes("hideBrands")) {
  fail("eq-dept-cm-facets.js: hideBrands desteği yok");
}
if (!cm.includes("showPisirmeTip")) {
  fail("eq-dept-cm-facets.js: showPisirmeTip desteği yok");
}

const filterCol = read("public/eq-filter-column.js");
if (!filterCol.includes("marka-plp-facets-KILIT.txt")) {
  fail("eq-filter-column.js: KİLİT referansı yok");
}
if (!filterCol.includes("eq-marka-plp-shop")) {
  fail("eq-filter-column.js: injectDeptChrome eq-marka-plp-shop desteği yok");
}

if (err) {
  console.error("\n[verify-marka-plp-facets-kilit] KİLİT ihlali — marka-plp-facets-KILIT.txt");
  process.exit(1);
}
console.log(
  "[verify-marka-plp-facets-kilit] OK — marka PLP sol filtre · kategori · pişirme tipi · fiyat",
);
