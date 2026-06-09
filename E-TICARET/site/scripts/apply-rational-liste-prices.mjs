#!/usr/bin/env node
/**
 * Rational Combi Classic / iCombi Pro — liste × 59% × 110% kar
 *
 *   node scripts/apply-rational-liste-prices.mjs
 *   node scripts/apply-rational-liste-prices.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  applyRationalPricing,
  isRationalCombiSku,
  rationalListEur,
  RATIONAL_ISKONTO,
  RATIONAL_KAR_ORAN,
} from "./lib/rational-liste-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const dryRun = process.argv.includes("--dry-run");

const tcmb = await fetchTcmbEurRate();
const kur =
  Number(process.env.EQUSTO_EUR_TRY) > 0
    ? Number(process.env.EQUSTO_EUR_TRY)
    : tcmb.rate;

const rows = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
let updated = 0;
let missing = 0;

for (const row of rows) {
  const sku = row.sku || row.urun_kodu;
  if (!isRationalCombiSku(sku)) continue;
  if (!rationalListEur(sku)) {
    missing++;
    console.warn(`[rational] liste yok: ${sku}`);
    continue;
  }
  const before = row.fiyat_tl;
  applyRationalPricing(row, kur);
  updated++;
  console.log(
    `${sku}: ₺${before?.toLocaleString("tr-TR")} → ₺${row.fiyat_tl?.toLocaleString("tr-TR")} (liste €${row.rational_liste_eur})`,
  );
}

if (!dryRun && updated > 0) {
  fs.writeFileSync(PISIRME, JSON.stringify(rows), "utf8");
  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

console.log(
  `\n[rational] ${dryRun ? "DRY-RUN" : "OK"} ${updated} ürün | iskonto %${Math.round(RATIONAL_ISKONTO * 100)} | kar %${Math.round(RATIONAL_KAR_ORAN * 100)} | kur ${kur}${tcmb.fallback ? " (fallback)" : ""}`,
);
if (missing) console.warn(`[rational] liste eşleşmeyen: ${missing}`);
