/**
 * Bar blender ürünlerini kahve/hazirlik → icecek (category: bar-blender).
 *
 *   node scripts/move-bar-blenders-to-icecek.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function isBarBlenderProduct(p) {
  const name = (p.name || "").toLowerCase();
  if (/kokteyl|shaker/.test(name) && !/bar blender/.test(name)) return false;
  if (/mikser/.test(name) && !/blender/.test(name)) return false;
  if (p.category === "bar-blenderlar") return /blender/.test(name) || /bbl\s*0/i.test(name);
  if (p.category === "bar-blender") return false;
  if (/bar blender/.test(name)) return true;
  return false;
}

function shouldRecategorizeInIcecek(p) {
  if (p.dept !== "icecek") return false;
  if (p.category === "bar-blender") return false;
  const name = (p.name || "").toLowerCase();
  return /bar\s+blender/.test(name);
}

function patchProduct(p) {
  const next = { ...p, dept: "icecek", category: "bar-blender" };
  if (next.urun_kategori && /kahve|hazirlik|hazırlık/i.test(next.urun_kategori)) {
    next.urun_kategori = "İçecek";
  }
  if (next.urun_alt_kategori === "Bar Blenderlar" || next.urun_alt_kategori === "Bar Blenderları") {
    next.urun_alt_kategori = "Bar Blender";
  }
  if (Array.isArray(next.kategori_yolu)) {
    next.kategori_yolu = next.kategori_yolu.map((s) =>
      /^(kahve|hazirlik|hazırlık)$/i.test(s) ? "icecek" : s,
    );
  }
  return next;
}

const icecekPath = path.join(DEPT_DIR, "icecek.json");
const icecek = JSON.parse(fs.readFileSync(icecekPath, "utf8"));
const icecekIds = new Set(icecek.map((p) => p.id).filter(Boolean));

let moved = 0;
let recategorized = 0;

for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json") || file === "icecek.json") continue;
  const filePath = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) continue;

  const keep = [];
  for (const row of rows) {
    if (!isBarBlenderProduct(row)) {
      keep.push(row);
      continue;
    }
    const patched = patchProduct(row);
    if (!icecekIds.has(patched.id)) {
      icecek.push(patched);
      if (patched.id) icecekIds.add(patched.id);
      moved++;
      console.log(`[move] ${file} → icecek: ${patched.name?.slice(0, 60)}`);
    } else {
      console.log(`[skip dup] ${patched.id}`);
    }
  }

  if (keep.length !== rows.length) {
    fs.writeFileSync(filePath, JSON.stringify(keep), "utf8");
    console.log(`[write] ${file}: ${rows.length} → ${keep.length}`);
  }
}

for (let i = 0; i < icecek.length; i++) {
  if (shouldRecategorizeInIcecek(icecek[i])) {
    icecek[i] = patchProduct(icecek[i]);
    recategorized++;
    console.log(`[recat] icecek: ${icecek[i].name?.slice(0, 60)}`);
  }
}

fs.writeFileSync(icecekPath, JSON.stringify(icecek), "utf8");
console.log(`\nDone: ${moved} moved, ${recategorized} recategorized, icecek total ${icecek.length}`);
