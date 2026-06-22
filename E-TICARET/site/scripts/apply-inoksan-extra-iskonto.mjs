#!/usr/bin/env node
/**
 * Tüm İnoksan fiyatlarını güncel bayi iskontosuyla yeniden hesaplar (%18,5).
 *
 *   node scripts/apply-inoksan-extra-iskonto.mjs
 *   node scripts/apply-inoksan-extra-iskonto.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  applyInoksanPricing,
  INOKSAN_ISKONTO,
  isInoksanRow,
} from "./lib/inoksan-pricing.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const dryRun = process.argv.includes("--dry-run");

const tcmb = await fetchTcmbEurRate();
const kur =
  Number(process.env.EQUSTO_EUR_TRY) > 0
    ? Number(process.env.EQUSTO_EUR_TRY)
    : tcmb.rate;

let updated = 0;
let skipped = 0;
let filesTouched = 0;

for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const filePath = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) continue;

  let fileUpdated = 0;
  for (const row of rows) {
    if (!isInoksanRow(row)) continue;
    const before = row.fiyat_tl;
    const rowKur = Number(row.kur_eur_try) > 0 ? Number(row.kur_eur_try) : kur;
    if (!applyInoksanPricing(row, rowKur)) {
      skipped++;
      console.warn(`[inoksan] liste yok: ${row.sku || row.id}`);
      continue;
    }
    updated++;
    fileUpdated++;
    if (dryRun && fileUpdated <= 3) {
      console.log(
        `${row.sku}: ₺${before?.toLocaleString("tr-TR")} → ₺${row.fiyat_tl?.toLocaleString("tr-TR")} (bayi %${Math.round(row.bayi_iskonto * 100)})`,
      );
    }
  }

  if (fileUpdated > 0) {
    filesTouched++;
    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(rows), "utf8");
    }
    console.log(`  ${file}: ${fileUpdated} ürün`);
  }
}

if (!dryRun && updated > 0) {
  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

console.log(
  `\n[inoksan] ${dryRun ? "DRY-RUN" : "OK"} ${updated} ürün | iskonto %${Math.round(INOKSAN_ISKONTO * 1000) / 10} | ${filesTouched} dept dosyası${tcmb.fallback ? " | kur fallback" : ""}`,
);
if (skipped) console.warn(`[inoksan] atlanan (liste yok): ${skipped}`);
