/**
 * Mevcut dept JSON satırlarına oem_brand: Electrolux ekle (medya kopyalamadan).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const KAYNAK = "electrolux-professional";
const OEM = "Electrolux";

let patched = 0;
for (const f of fs.readdirSync(DEPT_DIR)) {
  if (!f.endsWith(".json")) continue;
  const p = path.join(DEPT_DIR, f);
  const rows = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = false;
  for (const r of rows) {
    if (!r || r.kaynak !== KAYNAK) continue;
    if (r.oem_brand !== OEM) {
      r.oem_brand = OEM;
      patched++;
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(p, JSON.stringify(rows), "utf8");
}
console.log("[patch-electrolux-oem]", patched, "satır güncellendi");
