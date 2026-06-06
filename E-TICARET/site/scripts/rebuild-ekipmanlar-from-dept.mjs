/**
 * public/data/dept/*.json → tek public/data/ekipmanlar.json (mağaza + /api/urunler).
 * PFOS/BESOS HTML’e dokunmaz; pfos hâlâ /data/ekipmanlar.json okur (tüm dept birleşimi).
 *
 *   node scripts/rebuild-ekipmanlar-from-dept.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT = path.join(ROOT, "public/data/ekipmanlar.json");
const ARCHIVE = path.join(ROOT, "public/data/ekipmanlar-full-archive.json");

function rowKey(row) {
  if (row.id) return String(row.id);
  const dept = row.dept || "";
  const sku = row.sku || row.model || "";
  if (sku) return `${dept}__${sku}`;
  return `${dept}__${row.brand || ""}__${row.name || ""}`;
}

const merged = [];
const seen = new Set();

for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
  if (!Array.isArray(rows)) continue;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const k = rowKey(row);
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(row);
  }
}

if (fs.existsSync(OUT) && !fs.existsSync(ARCHIVE)) {
  fs.copyFileSync(OUT, ARCHIVE);
  console.log("[rebuild-ekipmanlar] arşiv:", path.basename(ARCHIVE));
}

const tmp = `${OUT}.tmp-${process.pid}`;
fs.writeFileSync(tmp, JSON.stringify(merged), "utf8");
try {
  if (fs.existsSync(OUT)) fs.unlinkSync(OUT);
} catch (_) {}
fs.renameSync(tmp, OUT);
console.log("[rebuild-ekipmanlar] yazıldı:", merged.length, "ürün →", path.relative(ROOT, OUT));
