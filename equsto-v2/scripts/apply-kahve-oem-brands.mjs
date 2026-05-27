/**
 * kahve.json — Öztiryakiler bayi satırına OEM marka (oem_brand) yazar.
 *   node scripts/apply-kahve-oem-brands.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectOztiOemBrand } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const TARGETS = [
  path.join(ROOT, "public/data/dept/kahve.json"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public/data/dept/kahve.json"),
  path.resolve(ROOT, "../veri/public-data/dept/kahve.json"),
];

function applyOne(file) {
  if (!fs.existsSync(file)) {
    console.log("[skip]", file);
    return null;
  }
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  const counts = {};
  for (const row of rows) {
    const oem = detectOztiOemBrand(row.name, row.category, row.sku || row.urun_kodu || row.model);
    row.oem_brand = oem;
    counts[oem] = (counts[oem] || 0) + 1;
  }
  fs.writeFileSync(file, JSON.stringify(rows), "utf8");
  return { file, total: rows.length, counts };
}

const results = TARGETS.map(applyOne).filter(Boolean);
for (const r of results) {
  console.log("\n[kahve-oem]", r.file);
  console.log("  total:", r.total);
  Object.keys(r.counts)
    .sort((a, b) => r.counts[b] - r.counts[a])
    .forEach((k) => console.log(" ", k + ":", r.counts[k]));
}
