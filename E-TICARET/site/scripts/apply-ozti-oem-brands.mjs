/**
 * Tüm dept/*.json — Öztiryakiler bayi satırlarına oem_brand yazar.
 *   node scripts/apply-ozti-oem-brands.mjs
 *   node scripts/apply-ozti-oem-brands.mjs icecek kahve
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectOztiOemBrand, isOztiBrand } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_ROOTS = [
  path.join(ROOT, "public"),
  path.resolve(ROOT, "../../../EQUSTO-CURSOR/equsto-v2/public"),
  path.resolve(ROOT, "../veri/public-data"),
];

const onlyDepts = process.argv.slice(2).map((d) => d.replace(/\.json$/, ""));

function applyDeptFile(file) {
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  const counts = {};
  let touched = 0;
  for (const row of rows) {
    if (!isOztiBrand(row)) continue;
    const oem = detectOztiOemBrand(row.name, row.category, row.sku || row.urun_kodu || row.model);
    row.oem_brand = oem;
    counts[oem] = (counts[oem] || 0) + 1;
    touched++;
  }
  fs.writeFileSync(file, JSON.stringify(rows), "utf8");
  return { file, total: rows.length, touched, counts };
}

for (const pub of PUBLIC_ROOTS) {
  const deptDir = path.join(pub, "data/dept");
  if (!fs.existsSync(deptDir)) {
    console.log("[skip root]", deptDir);
    continue;
  }
  console.log("\n===", deptDir, "===");
  const files = fs
    .readdirSync(deptDir)
    .filter((f) => f.endsWith(".json"))
    .filter((f) => !onlyDepts.length || onlyDepts.includes(f.replace(/\.json$/, "")));

  const grand = {};
  for (const f of files) {
    const r = applyDeptFile(path.join(deptDir, f));
    if (!r.touched) continue;
    console.log(`[${f}] ozti: ${r.touched}/${r.total}`);
    Object.keys(r.counts)
      .sort((a, b) => r.counts[b] - r.counts[a])
      .forEach((k) => {
        console.log(`  ${k}: ${r.counts[k]}`);
        grand[k] = (grand[k] || 0) + r.counts[k];
      });
  }
  if (Object.keys(grand).length) {
    console.log("— toplam OEM —");
    Object.keys(grand)
      .sort((a, b) => grand[b] - grand[a])
      .forEach((k) => console.log(`  ${k}: ${grand[k]}`));
  }
}
