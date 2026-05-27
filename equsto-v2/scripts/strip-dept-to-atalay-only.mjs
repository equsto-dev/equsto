/**
 * public/data/dept/*.json → yalnızca Atalay katalog satırları (kaynak / marka / görsel yolu).
 *   node scripts/strip-dept-to-atalay-only.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function isAtalay(row) {
  const k = row.kaynak || row.kaynak_fiyat_listesi || "";
  if (/^atalay-2025/i.test(k)) return true;
  if (/atalay/i.test(String(row.brand || ""))) return true;
  const img = (Array.isArray(row.images) ? row.images[0] : row.image) || "";
  if (/catalog\/atalay\//i.test(String(img).replace(/\\/g, "/"))) return true;
  return false;
}

const summary = {};
for (const file of fs.readdirSync(DEPT_DIR)) {
  if (!file.endsWith(".json")) continue;
  const p = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(rows)) continue;
  const kept = rows.filter(isAtalay);
  fs.writeFileSync(p, JSON.stringify(kept), "utf8");
  summary[file] = { before: rows.length, after: kept.length };
}

console.log("[strip-dept-atalay-only]", JSON.stringify(summary, null, 2));
