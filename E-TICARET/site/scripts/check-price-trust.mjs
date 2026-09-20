#!/usr/bin/env node
/**
 * CI — yayınlanan vitrin fiyatı piyasa referansına göre çok ucuz olamaz.
 *   node scripts/check-price-trust.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluatePriceTrust,
  isUntrustedPublishedPrice,
  normSku,
  num,
  skuOf,
} from "./lib/price-trust.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept");
const REFS = path.join(ROOT, "scripts/data/price-trust/market-refs.json");

function fail(msg) {
  console.error(`[price-trust:check] HATA: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(REFS)) fail(`Dosya yok: ${REFS}`);

const refs = JSON.parse(fs.readFileSync(REFS, "utf8"));
const wanted = refs.skus || {};
if (!Object.keys(wanted).length) fail("market-refs.json boş");

const bySku = new Map();
for (const f of fs.readdirSync(DEPT).filter((x) => x.endsWith(".json") && !x.includes("_items"))) {
  const rows = JSON.parse(fs.readFileSync(path.join(DEPT, f), "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    const sku = normSku(skuOf(row));
    if (wanted[sku]) bySku.set(`${sku}::${f}`, { row, file: f, sku });
  }
}

const failures = [];
for (const [sku, market] of Object.entries(wanted)) {
  const hits = [...bySku.values()].filter((h) => h.sku === sku);
  if (!hits.length) {
    failures.push(`${sku}: katalogda yok`);
    continue;
  }
  for (const hit of hits) {
    const siteTl = num(hit.row.fiyat_tl);
    const verdict = evaluatePriceTrust({
      siteTl,
      markets: { cafemarkt: market.cafemarkt, mutbex: market.mutbex },
      quoteOnly: !!hit.row.fiyat_bekleniyor,
      locked: !!hit.row.fiyat_kilit,
      fiyatGuven: hit.row.fiyat_guven,
    });
    if (!verdict.publishable && verdict.reason === "too_cheap") {
      failures.push(
        `${sku} (${hit.file}): yayınlanan ₺${siteTl} piyasa ₺${verdict.marketTl} — ${verdict.reason}`,
      );
    }
    if (isUntrustedPublishedPrice(hit.row)) {
      failures.push(`${sku} (${hit.file}): isUntrustedPublishedPrice=true (₺${siteTl})`);
    }
  }
}

if (failures.length) {
  for (const f of failures) console.error(`  - ${f}`);
  fail(`${failures.length} fiyat güveni hatası`);
}

console.log(`[price-trust:check] OK — ${Object.keys(wanted).length} SKU denetlendi`);
