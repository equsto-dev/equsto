/**
 * ozti-missing-images.json içindeki fixable kayıtları public/data/images/ altına kopyalar.
 *   node scripts/report-ozti-missing-images.mjs
 *   node scripts/fix-ozti-missing-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "public", "data", "ozti-missing-images.json");
const SITE_IMG = path.join(ROOT, "public", "data", "images");
const ARCHIVE_IMG = path.join(ROOT, ".tmp-omer-images", "oztiryakiler", "images");

if (!fs.existsSync(REPORT)) {
  console.error("Önce: node scripts/report-ozti-missing-images.mjs");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
let copied = 0;
let skipped = 0;

for (const row of report.allMissingFiles || []) {
  if (row.status === "not-in-archive") continue;
  const arch = row.archiveFile;
  if (!arch) continue;
  const src = path.join(ARCHIVE_IMG, arch);
  const dest = path.join(SITE_IMG, row.file);
  if (!fs.existsSync(src)) {
    console.warn("[fix] arşivde yok:", arch);
    continue;
  }
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    skipped++;
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

console.log("[fix-ozti] Kopyalandı:", copied, "zaten vardı:", skipped);
console.log("[fix-ozti] Ardından raporu yenileyin: node scripts/report-ozti-missing-images.mjs");
