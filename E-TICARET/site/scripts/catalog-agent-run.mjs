#!/usr/bin/env node
/**
 * Katalog AI ajanı — fiyat denetimi, rakip karşılaştırma, birleşik rapor
 *
 *   node scripts/catalog-agent-run.mjs
 *   node scripts/catalog-agent-run.mjs --quiet
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCatalogAgentChecks } from "./lib/catalog-agent-core.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/catalog-agent");
const OUT_JSON = path.join(OUT_DIR, "latest.json");
const quiet = process.argv.includes("--quiet");

async function main() {
  const report = await runCatalogAgentChecks();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  if (!quiet) {
    console.log("=== Katalog Ajanı ===");
    console.log(`Durum: ${report.status} | Kur: ${report.kur} | Süre: ${report.durationMs}ms`);
    console.log(`Toplam sorun: ${report.issueCount}`);
    for (const [brand, n] of Object.entries(report.summary.byBrand || {})) {
      console.log(`  ${brand}: ${n}`);
    }
    console.log("\nDenetimler:");
    for (const [key, chk] of Object.entries(report.checks)) {
      console.log(`  ${key}: ${chk.status}${chk.total != null ? ` (${chk.total} ürün)` : ""}`);
    }
    if (report.issues.length) {
      console.log("\nÖncelikli sorunlar:");
      for (const i of report.issues.slice(0, 8)) {
        console.log(`  [${i.severity}] ${i.brand} ${i.sku}: ${i.message}`);
      }
      if (report.issueCount > 8) {
        console.log(`  … +${report.issueCount - 8} sorun daha`);
      }
    }
    console.log(`\n→ ${OUT_JSON}`);
  }

  process.exit(report.status === "error" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
