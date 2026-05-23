/**
 * Atalay katalog görselleri — manifest vs dosya sistemi + ince şerit (PDF fallback) tespiti.
 *   node scripts/verify-atalay-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cat = JSON.parse(
  fs.readFileSync(path.join(ROOT, "scripts/data/atalay-pdf-catalog.json"), "utf8"),
);
const man = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public/images/catalog/atalay/_extract-manifest.json"), "utf8"),
);

const MIN_ASPECT = 0.35;
const MIN_WIDTH = 80;

const missing = [];
const strips = [];

for (const p of cat.products) {
  const rel = man[p.model];
  const fp = rel ? path.join(ROOT, "public", rel.replace(/^\//, "")) : "";
  if (!rel || !fs.existsSync(fp)) {
    missing.push(p.model);
    continue;
  }
  const m = await sharp(fp).metadata();
  if (m.width / m.height < MIN_ASPECT || m.width < MIN_WIDTH) {
    strips.push({ model: p.model, rel, w: m.width, h: m.height });
  }
}

let deptBad = 0;
let deptStrip = 0;
let deptAtalay = 0;
for (const f of fs.readdirSync(path.join(ROOT, "public/data/dept"))) {
  if (!f.endsWith(".json")) continue;
  const rows = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public/data/dept", f), "utf8"),
  );
  for (const r of rows) {
    if (!/atalay/i.test(r.brand || "")) continue;
    deptAtalay++;
    const rel = (r.images || [])[0] || "";
    const fp = rel ? path.join(ROOT, "public", rel.replace(/^\//, "")) : "";
    if (!fp || !fs.existsSync(fp)) {
      deptBad++;
      continue;
    }
    const m = await sharp(fp).metadata();
    if (m.width / m.height < MIN_ASPECT || m.width < MIN_WIDTH) deptStrip++;
  }
}

console.log("[verify-atalay-images]", {
  products: cat.products.length,
  manifest: Object.keys(man).length,
  missingCatalog: missing.length,
  stripManifest: strips.length,
  deptAtalay,
  deptMissingFile: deptBad,
  deptStripImages: deptStrip,
});
if (missing.length) console.log("  missing:", missing.slice(0, 20));
if (strips.length) console.log("  strips:", strips.slice(0, 15));
if (strips.length || deptStrip) process.exitCode = 1;
