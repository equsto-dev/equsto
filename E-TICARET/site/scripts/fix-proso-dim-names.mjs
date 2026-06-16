/**
 * Proso/Cağlayan varyant adlarındaki "937×0 mm" → "937 mm" düzeltmesi.
 * Kullanım: node scripts/fix-proso-dim-names.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIM_BAD = /(\d+)\s*[×x]\s*0(?:\s*[×x]\s*0)?\s*mm/gi;

function fixName(name) {
  if (!name || !DIM_BAD.test(name)) return name;
  DIM_BAD.lastIndex = 0;
  return name.replace(DIM_BAD, "$1 mm");
}

function patchArray(rows, label) {
  let n = 0;
  for (const row of rows) {
    if (!row || typeof row.name !== "string") continue;
    const fixed = fixName(row.name);
    if (fixed !== row.name) {
      row.name = fixed;
      n++;
    }
  }
  console.log(`  ${label}: ${n} ad düzeltildi`);
  return n;
}

function patchJson(relPath, getRows) {
  const file = join(ROOT, relPath);
  const data = JSON.parse(readFileSync(file, "utf8"));
  const rows = getRows(data);
  const n = patchArray(rows, relPath);
  if (n) writeFileSync(file, JSON.stringify(data));
  return n;
}

let total = 0;
total += patchJson("public/data/dept/market-reyon.json", (d) => d);
total += patchJson("public/data/proje-akis.json", (d) => d.data?.products || d.products || []);
total += patchJson("public/data/homepage-vitrin.json", (d) => d.products || []);

console.log(`Toplam: ${total} ad`);
