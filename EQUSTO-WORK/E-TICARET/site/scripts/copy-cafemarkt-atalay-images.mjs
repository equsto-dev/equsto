#!/usr/bin/env node
/**
 * cafemarkt-atalay.json → images-atalay klasörüne görsel kopyala.
 *   node scripts/copy-cafemarkt-atalay-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const JSON_PATH = path.join(ROOT, "scripts/data/cafemarkt-atalay.json");
const SRC_DIR =
  "C:/Users/User/OneDrive/Masaüstü/SİTELER/cafemarkt görseller/images";
const DEST_DIR =
  "C:/Users/User/OneDrive/Masaüstü/SİTELER/cafemarkt görseller/images-atalay";

const products = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const files = new Set();

for (const p of products) {
  for (const r of p.resimler || []) {
    const name = String(r)
      .replace(/\\/g, "/")
      .replace(/^images\//i, "")
      .trim();
    if (name) files.add(name);
  }
}

fs.mkdirSync(DEST_DIR, { recursive: true });

let ok = 0;
let miss = 0;
const missList = [];

for (const f of files) {
  const src = path.join(SRC_DIR, f);
  const dst = path.join(DEST_DIR, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    ok++;
  } else {
    miss++;
    if (missList.length < 20) missList.push(f);
  }
}

console.log(`Atalay ürün: ${products.length}`);
console.log(`Benzersiz görsel: ${files.size}`);
console.log(`Kopyalandı: ${ok}`);
console.log(`Eksik: ${miss}`);
console.log(`Hedef: ${DEST_DIR}`);
if (missList.length) {
  console.log("Eksik örnek:");
  missList.forEach((f) => console.log("  ", f));
}
