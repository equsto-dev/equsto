/**
 * ekipmanlar.json — görselsiz ürün analizi
 *   node scripts/analyze-missing-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EKIP = path.join(ROOT, "public/data/ekipmanlar.json");

function hasImg(r) {
  return Array.isArray(r.images) && String(r.images[0] || "").trim().length > 0;
}

function isOzti(r) {
  return /öztiryaki|oztiryaki/i.test(r.brand || "");
}

const rows = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const noImg = rows.filter((r) => !hasImg(r));

const byBrand = new Map();
for (const r of rows) {
  const b = r.brand || "(boş)";
  if (!byBrand.has(b)) byBrand.set(b, { t: 0, i: 0 });
  const s = byBrand.get(b);
  s.t++;
  if (hasImg(r)) s.i++;
}

console.log("=== ekipmanlar.json ===");
console.log("toplam:", rows.length);
console.log("görselli:", rows.length - noImg.length);
console.log("görselsiz:", noImg.length);

console.log("\n--- marka (ilk 15) ---");
[...byBrand.entries()]
  .sort((a, b) => b[1].t - a[1].t)
  .slice(0, 15)
  .forEach(([b, s]) => {
    console.log(`  ${b}: ${s.i}/${s.t} görselli, ${s.t - s.i} eksik`);
  });

const ozMiss = noImg.filter(isOzti);
console.log("\n--- Öztiryakiler görselsiz:", ozMiss.length);
const ozDept = {};
for (const r of ozMiss) {
  const d = r.dept || "?";
  ozDept[d] = (ozDept[d] || 0) + 1;
}
console.log("dept dağılımı:", Object.entries(ozDept).sort((a, b) => b[1] - a[1]));

const manifestPath = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
let manifestKeys = 0;
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifestKeys = Object.keys(m).length;
}
console.log("\nozti _manifest keys:", manifestKeys);

const ozNoImgKod = ozMiss.map((r) => r.urun_kodu || r.sku || r.model).filter(Boolean);
fs.writeFileSync(
  path.join(ROOT, "scripts/data/ozti-missing-images-kod.json"),
  JSON.stringify(ozNoImgKod, null, 2),
  "utf8",
);
console.log("yazıldı: scripts/data/ozti-missing-images-kod.json", ozNoImgKod.length, "kod");

const otherMiss = noImg.filter((r) => !isOzti(r));
console.log("\n--- Diğer markalar görselsiz:", otherMiss.length);
const otherBrands = {};
for (const r of otherMiss) {
  const b = r.brand || "?";
  otherBrands[b] = (otherBrands[b] || 0) + 1;
}
console.log(Object.entries(otherBrands).sort((a, b) => b[1] - a[1]).slice(0, 10));
