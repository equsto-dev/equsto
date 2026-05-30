/**
 * sanayi-tipi-izgaralar içindeki yanlış Atalay kayıtlarını doğru ?tip= slug'ına taşır.
 *   node scripts/fix-pisirme-izgara-categories.mjs
 *   npm run catalog:atalay:fix-izgara
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyMisfiledIzgaraFix } from "../lib/catalog/atalay-pisirme-category.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const CATALOG = path.join(ROOT, "scripts/data/atalay-pdf-catalog.json");

const rows = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
const counts = {};
let n = 0;

for (const row of rows) {
  const prev = row.category;
  const prevDept = row.dept;
  if (applyMisfiledIzgaraFix(row)) {
    n++;
    const key =
      prevDept && row.dept && prevDept !== row.dept
        ? `${prev} → ${row.category} (${prevDept}→${row.dept})`
        : `${prev} → ${row.category}`;
    counts[key] = (counts[key] || 0) + 1;
  }
}

fs.writeFileSync(PISIRME, JSON.stringify(rows) + "\n", "utf8");
console.log("pisirme.json:", n, "kayıt güncellendi");
console.log(counts);

if (fs.existsSync(CATALOG)) {
  const cat = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
  let c = 0;
  for (const row of cat.products || []) {
    if (applyMisfiledIzgaraFix(row)) c++;
  }
  fs.writeFileSync(CATALOG, JSON.stringify(cat, null, 2) + "\n", "utf8");
  console.log("atalay-pdf-catalog.json:", c, "kayıt");
}

console.log("Sonra: npm run catalog:atalay:ekipmanlar && npm run search:index");
