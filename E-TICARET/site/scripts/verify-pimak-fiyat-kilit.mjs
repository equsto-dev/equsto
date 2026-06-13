/**
 * Pimak PDF fiyat parse + site import kilit doğrulama.
 * Kilit: public/pimak-fiyat-pdf-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteDir, "../..");
const pfosPimak = path.join(repoRoot, "PFOS", "veri", "pimak");

const SHOP_ASSET_V = "20260613-pimak-pdp-ozti-v2";
const KILIT_COMMIT = "c96cd6bd";

/** PDF spot-check ile doğrulanmış liste EUR */
const PRICE_ANCHORS = {
  "PIMAK.16070.04": 630,
  BPD: 1250,
  "DR04-503030.00": 80,
  "TB04-503030.00": 160,
  "BPKM.32SCK": 3300,
};

let err = 0;

function fail(msg) {
  console.error("[verify-pimak-fiyat-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(abs) {
  if (!fs.existsSync(abs)) fail(`eksik dosya: ${abs}`);
}

mustExist(path.join(siteDir, "public/pimak-fiyat-pdf-KILIT.txt"));
mustExist(path.join(pfosPimak, "pimak_pdf_blocks.py"));
mustExist(path.join(pfosPimak, "parse-pdf-p188-197.py"));
mustExist(path.join(pfosPimak, "audit-pimak-full-pdf.py"));
mustExist(path.join(pfosPimak, "verify-spot-check.py"));

const kilit = read("public/pimak-fiyat-pdf-KILIT.txt");
if (!kilit.includes(KILIT_COMMIT)) {
  fail(`pimak-fiyat-pdf-KILIT.txt: commit ${KILIT_COMMIT} yok`);
}
if (!kilit.includes(SHOP_ASSET_V)) {
  fail(`pimak-fiyat-pdf-KILIT.txt: SHOP_ASSET_V=${SHOP_ASSET_V} yok`);
}
if (!kilit.includes("site_vs_pdf_hata: 0") && !kilit.includes("fiyat hatası: 0")) {
  fail("pimak-fiyat-pdf-KILIT.txt: sağlama özeti yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes(`SHOP_ASSET_V = "${SHOP_ASSET_V}"`)) {
  fail(`assets.ts: SHOP_ASSET_V=${SHOP_ASSET_V} değil`);
}

const syncPy = fs.readFileSync(path.join(siteDir, "scripts/sync-pimak-fiyat-pdf.py"), "utf8");
if (!syncPy.includes("pimak_pdf_blocks") || !syncPy.includes("extract_block_pairs_from_page")) {
  fail("sync-pimak-fiyat-pdf.py: blok parse kilidi yok");
}

const parsePy = fs.readFileSync(path.join(pfosPimak, "parse-pdf-p188-197.py"), "utf8");
if (!parsePy.includes("parse_page_blocks") || !parsePy.includes("BLOCK_PAGES")) {
  fail("parse-pdf-p188-197.py: parse_page_blocks / BLOCK_PAGES yok");
}
if (!parsePy.includes("pimak_pdf_blocks")) {
  fail("parse-pdf-p188-197.py: pimak_pdf_blocks import yok");
}

const blocksPy = fs.readFileSync(path.join(pfosPimak, "pimak_pdf_blocks.py"), "utf8");
if (!blocksPy.includes("pair_codes_prices_block")) {
  fail("pimak_pdf_blocks.py: pair_codes_prices_block yok");
}

const importPimak = read("scripts/import-pimak.mjs");
if (
  !/lookupListe\(priceMap[\s\S]*?\|\|[\s\S]*?Number\(d\.liste_fiyati_eur\)/.test(importPimak)
) {
  fail("import-pimak.mjs: PDF fiyat haritası manuel EUR'dan önce değil");
}

const pricePath = path.join(siteDir, "scripts/data/pimak-fiyat.json");
if (!fs.existsSync(pricePath)) fail("scripts/data/pimak-fiyat.json yok");
const priceJson = JSON.parse(fs.readFileSync(pricePath, "utf8"));
for (const [code, expected] of Object.entries(PRICE_ANCHORS)) {
  const row = priceJson[code];
  const got = Number(row?.liste_fiyati_eur);
  if (Math.abs(got - expected) > 0.01) {
    fail(`pimak-fiyat.json: ${code}=${got} (beklenen ${expected})`);
  }
}

const auditPath = path.join(pfosPimak, "pimak-full-pdf-audit.json");
if (fs.existsSync(auditPath)) {
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));
  const h = audit?.ozet?.site_vs_pdf_hata;
  if (h !== 0) fail(`pimak-full-pdf-audit.json: site_vs_pdf_hata=${h} (0 olmalı)`);
  const syncH = audit?.ozet?.sync_vs_pdf_hata;
  if (syncH !== 0) fail(`pimak-full-pdf-audit.json: sync_vs_pdf_hata=${syncH}`);
}

const tezgah = JSON.parse(read("public/data/dept/tezgah.json"));
const eq160 = tezgah.find((r) => r.sku === "EQUSTO.16070.04");
if (!eq160 || Math.abs(Number(eq160.liste_fiyati_eur) - 630) > 0.01) {
  fail("tezgah.json: EQUSTO.16070.04 liste 630 € değil");
}
const eq10070 = tezgah.find((r) => r.sku === "EQUSTO.10070.70");
if (!eq10070 || Math.abs(Number(eq10070.liste_fiyati_eur) - 470) > 0.01) {
  fail("tezgah.json: EQUSTO.10070.70 liste 470 € değil");
}

if (err) {
  console.error("[verify-pimak-fiyat-kilit] Kilit ihlali — public/pimak-fiyat-pdf-KILIT.txt");
  process.exit(1);
}
console.log(
  "[verify-pimak-fiyat-kilit] OK — Pimak PDF blok fiyat · Equsto s.188–197 · import önceliği",
);
