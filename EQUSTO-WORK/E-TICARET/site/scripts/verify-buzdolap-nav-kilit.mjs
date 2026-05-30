/**
 * Deploy öncesi Buzdolapları nav kilit doğrulama.
 * Çıkış kodu 0 = OK, 1 = hata.
 * Kilit: public/buzdolap-nav-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LOCKED_LINE =
  '{ label: "Buzdolapları", labelKey: "nav.sub.buzdolaplari", search: "buzdolab|buzdolap" }';
const FORBIDDEN = [
  'label: "Tezgah Tipi", tip: "tezgah-tipi-buzdolabi"',
  'label: "Make Up Dolapları", tip: "make-up-dolabi"',
  'label: "Pastane Buzdolapları"',
  'nav.sub.pastane_buzdolaplari", search: "pastane buzdolab',
];
let err = 0;

function fail(msg) {
  console.error("[verify-buzdolap-nav-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/buzdolap-nav-KILIT.txt");
mustExist("public/nav.js");

const kilit = read("public/buzdolap-nav-KILIT.txt");
if (!kilit.includes("2026-05-30") || !kilit.includes("a2ffd88")) {
  fail("buzdolap-nav-KILIT.txt: onay tarihi / commit referansı yok");
}

const nav = read("public/nav.js");
if (!nav.includes("buzdolap-nav-KILIT.txt")) {
  fail("nav.js: buzdolap-nav-KILIT.txt referansı yok");
}
if (!nav.includes(LOCKED_LINE)) {
  fail("nav.js: kilitli Buzdolapları satırı eşleşmiyor");
}

const sogIdx = nav.indexOf('id: "sogutma"');
if (sogIdx < 0) fail('nav.js: id: "sogutma" bloğu yok');
const sogBlock = nav.slice(sogIdx, sogIdx + 1200);

if (/label:\s*"Buzdolapları"[\s\S]{0,120}subs:\s*\[/.test(sogBlock)) {
  fail("nav.js: Buzdolapları altında subs flyout geri gelmiş — KİLİT ihlali");
}

for (const frag of FORBIDDEN) {
  if (sogBlock.includes(frag)) {
    fail(`nav.js: yasak alt dal bulundu (${frag.slice(0, 40)}…)`);
  }
}

if (err) {
  console.error("\n[verify-buzdolap-nav-kilit] KİLİT ihlali — buzdolap-nav-KILIT.txt");
  process.exit(1);
}
console.log("[verify-buzdolap-nav-kilit] OK — Buzdolapları düz satır, alt dal yok");
