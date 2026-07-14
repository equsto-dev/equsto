/**
 * DB → pfos-referans-sku-links.json (atomik yazım)
 * Kullanım:
 *   node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs scripts/export-pfos-referans-sku-links.mjs
 */
import { exportReferansSkuLinksToJson } from "../lib/pfos/referans/export-sku-links.ts";

const result = await exportReferansSkuLinksToJson();
console.log(
  `[pfos:referans-sku-links:export] ${result.dbLinkCount} DB link → ${result.totalKeys} toplam anahtar (v${result.version})`,
);
console.log(`  → ${result.outPath}`);
