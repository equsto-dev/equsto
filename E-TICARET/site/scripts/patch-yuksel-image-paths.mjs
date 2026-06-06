/**
 * Yüksel görselleri → images/catalog/yuksel/ (statik /images/ yolu, CDN bypass).
 *
 *   node scripts/patch-yuksel-image-paths.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_IMG = path.join(ROOT, "public/data/images");
const CAT_DIR = path.join(ROOT, "public/images/catalog/yuksel");

function toCatalogRel(rel) {
  const s = String(rel || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "");
  if (!s) return s;
  const file = s
    .replace(/^\/data\/images\//i, "")
    .replace(/^images\/catalog\/yuksel\//i, "")
    .replace(/^images\//i, "");
  if (!/^yuksel-/i.test(file) && !/^embed\//i.test(file)) return s;
  if (/^embed\//i.test(file)) return `images/catalog/yuksel/${file}`;
  return `images/catalog/yuksel/${file}`;
}

function patchImagesField(images) {
  if (!Array.isArray(images) || !images.length) return images;
  return images.map((rel) => toCatalogRel(rel));
}

function patchRows(rows) {
  let n = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    if (!String(row.kaynak_fiyat_listesi || "").includes("yuksel-2025-yerli")) continue;
    const prev = JSON.stringify(row.images || []);
    row.images = patchImagesField(row.images);
    if (JSON.stringify(row.images) !== prev) n++;
  }
  return n;
}

function patchJsonFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (!Array.isArray(rows)) return 0;
  const n = patchRows(rows);
  if (n) fs.writeFileSync(filePath, JSON.stringify(rows), "utf8");
  return n;
}

function patchImageMap() {
  const mapPath = path.join(
    ROOT,
    "public/data/fiyat-listeleri/yuksel/2025-yerli/_pdf-images-map.json",
  );
  if (!fs.existsSync(mapPath)) return;
  const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  for (const key of ["models", "pages"]) {
    const bag = map[key] || {};
    for (const k of Object.keys(bag)) {
      bag[k] = toCatalogRel(bag[k]);
    }
    map[key] = bag;
  }
  fs.writeFileSync(mapPath, JSON.stringify(map, null, 2), "utf8");
}

function ensureCatalogFiles() {
  fs.mkdirSync(CAT_DIR, { recursive: true });
  let copied = 0;
  for (const name of fs.readdirSync(DATA_IMG)) {
    if (!/^yuksel-/i.test(name)) continue;
    const dest = path.join(CAT_DIR, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(DATA_IMG, name), dest);
      copied++;
    }
  }
  return copied;
}

let total = 0;
total += patchJsonFile(path.join(ROOT, "public/data/ekipmanlar.json"));
for (const file of fs.readdirSync(path.join(ROOT, "public/data/dept"))) {
  if (!file.endsWith(".json")) continue;
  total += patchJsonFile(path.join(ROOT, "public/data/dept", file));
}
patchImageMap();
const copied = ensureCatalogFiles();
console.log(`[patch-yuksel-images] ${total} kayıt güncellendi, ${copied} dosya kopyalandı → images/catalog/yuksel/`);
