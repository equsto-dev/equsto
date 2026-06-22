#!/usr/bin/env node
/**
 * SPARO 2026 PDF fiyatları → dept/pisirme.json (30% iskonto, müşteri %70 öder)
 *
 *   npm run catalog:sparo:prices
 *   node scripts/apply-sparo-pdf-prices.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";
import {
  applySparoPricing,
  isSparoRow,
  loadSparoPdfPrices,
  SPARO_PDF_PRICES,
} from "./lib/sparo-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_FILE = path.join(ROOT, "public/data/dept/pisirme.json");
const dryRun = process.argv.includes("--dry-run");

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  const bundle = loadSparoPdfPrices();
  if (!bundle?.prices || !Object.keys(bundle.prices).length) {
    console.error(`Önce: python scripts/import-sparo-pdf-prices.py`);
    console.error(`  veya: npm run catalog:sparo:pdf-prices`);
    process.exit(1);
  }

  if (!fs.existsSync(DEPT_FILE)) {
    console.error("pisirme.json bulunamadı — önce npm run catalog:sparo:import");
    process.exit(1);
  }

  const rates = await fetchTcmbEurUsdRates();
  const usdTry = Number(process.env.EQUSTO_USD_TRY) > 0 ? Number(process.env.EQUSTO_USD_TRY) : rates.usdTry;
  const eurTry = Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : rates.eurTry;

  const rows = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  const priceMap = bundle.prices;
  let matched = 0;
  const unmatched = [];

  for (const row of rows) {
    if (!isSparoRow(row)) continue;
    if (applySparoPricing(row, priceMap, usdTry, eurTry)) {
      matched += 1;
    } else {
      unmatched.push(row.sku || row.model || row.id);
    }
  }

  if (!dryRun) {
    writeJsonAtomic(DEPT_FILE, rows);
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log(`[sparo-prices] ${dryRun ? "DRY-RUN" : "OK"} ${matched} ürün fiyatlandı`);
  console.log(`  Kaynak: ${bundle.source} (${Object.keys(priceMap).length} PDF kodu)`);
  console.log(`  Kur: 1 USD = ${usdTry} TRY, 1 EUR = ${eurTry} TRY`);
  if (unmatched.length) {
    console.log(`  PDF'de fiyat yok (${unmatched.length}):`, unmatched.slice(0, 20).join(", "));
    if (unmatched.length > 20) console.log(`    … +${unmatched.length - 20} daha`);
  }
  if (!dryRun) {
    console.log("\nMeilisearch: npm run search:index");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
