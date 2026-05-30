/**
 * Deploy öncesi /arama history + geri tuşu kilit doğrulama.
 * Kilit: public/arama-history-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let err = 0;

function fail(msg) {
  console.error("[verify-arama-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/arama-history-KILIT.txt");

const kilit = read("public/arama-history-KILIT.txt");
if (!kilit.includes("2026-05-30") || !kilit.includes("c9d821b")) {
  fail("arama-history-KILIT.txt: onay tarihi / commit referansı yok");
}

const urls = read("public/eq-site-urls.js");
if (!urls.includes("arama-history-KILIT.txt")) {
  fail("eq-site-urls.js: arama-history-KILIT.txt referansı yok");
}
if (!urls.includes("window.eqNavigateArama")) {
  fail("eq-site-urls.js: eqNavigateArama yok");
}
if (!urls.includes("eqIsAramaPathname")) {
  fail("eq-site-urls.js: eqIsAramaPathname yok");
}
if (!urls.includes("history.pushState")) {
  fail("eq-site-urls.js: arama içi pushState yok");
}
if (!/curPath === tgtPath && curQ === tgtQ/.test(urls)) {
  fail("eq-site-urls.js: aynı URL no-op koruması yok");
}

const hdr = read("public/eq-header-search.js");
if (!hdr.includes("arama-history-KILIT.txt")) {
  fail("eq-header-search.js: KİLİT referansı yok");
}
if (!hdr.includes("eqNavigateArama")) {
  fail("eq-header-search.js: commitSearch eqNavigateArama kullanmıyor");
}
if (/function commitSearch[\s\S]{0,400}location\.href = aramaUrl/.test(hdr)) {
  fail("eq-header-search.js: commitSearch doğrudan location.href — KİLİT ihlali");
}

const theme = read("public/theme.js");
if (!theme.includes("arama-history-KILIT.txt")) {
  fail("theme.js: KİLİT referansı yok");
}
if (!theme.includes("eqNavigateArama")) {
  fail("theme.js: commitGlobalSearch eqNavigateArama kullanmıyor");
}

const arama = read("public/eq-arama-page.js");
if (!arama.includes("arama-history-KILIT.txt")) {
  fail("eq-arama-page.js: KİLİT referansı yok");
}
if (!arama.includes('addEventListener("popstate", bootAramaPage)')) {
  fail("eq-arama-page.js: popstate dinleyicisi yok");
}
if (!/if \(!isAramaPath\(\)\)[\s\S]{0,80}lastBootQ = null/.test(arama)) {
  fail("eq-arama-page.js: arama dışı lastBootQ sıfırlama yok");
}

if (err) {
  console.error("\n[verify-arama-kilit] KİLİT ihlali — arama-history-KILIT.txt");
  process.exit(1);
}
console.log("[verify-arama-kilit] OK — /arama geri tuşu + eqNavigateArama kilidi");
