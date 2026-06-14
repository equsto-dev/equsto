#!/usr/bin/env node
/**
 * Urban Bar Shopify katalog → Besos (Bar Design) — mağaza dept'e yazmaz.
 *
 *   node scripts/import-urbanbar-to-equsto.mjs
 *   node scripts/import-urbanbar-to-equsto.mjs --dry-run
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { buildUrbanBarRowsFromWeb } from "./lib/urbanbar-equsto-rows.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const { rows, skippedAlcohol, gbpTry, eurTry, productCount } = await buildUrbanBarRowsFromWeb({
    root: ROOT,
    dryRun,
    copyImages: !dryRun,
  });

  console.log(`[urbanbar-import] ${productCount} ürün (Bar Design / Besos)`);
  console.log(`[kur] 1 GBP = ${gbpTry} TRY, 1 EUR = ${eurTry} TRY`);
  if (skippedAlcohol) console.log(`[urbanbar-import] içki atlandı: ${skippedAlcohol} ürün`);

  const priced = rows.filter((r) => !r.fiyat_bekleniyor).length;
  const withImg = rows.filter((r) => r.images?.length).length;
  console.log(`[urbanbar-import] ${dryRun ? "DRY-RUN" : "OK"} ${rows.length} satır`);
  console.log(`  fiyatlı: ${priced}/${rows.length} | görselli: ${withImg}/${rows.length}`);
  console.log("  mağaza dept: yazılmıyor (yalnızca /besos)");

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/build-urbanbar-besos-catalog.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("\nYerel vitrin: http://localhost:3099/besos/bardaklar");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
