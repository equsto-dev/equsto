/**
 * Öztiryakiler katalog — üretici marka taraması
 * node scripts/audit-ozti-oem-brands.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { detectOztiOemBrand, isOztiBrand, stripOztiNameLead } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const rows = JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/ekipmanlar.json"), "utf8"));
const oz = rows.filter(isOztiBrand);

const stored = {};
const detected = {};
const leadWord = {};

for (const r of oz) {
  const s = r.oem_brand || "(yok)";
  stored[s] = (stored[s] || 0) + 1;
  const d = detectOztiOemBrand(r.name, r.category, r.sku || r.model);
  detected[d] = (detected[d] || 0) + 1;

  if (d === "Öztiryakiler") {
    const hay = stripOztiNameLead(r.name || "");
    const m = hay.match(/^([A-ZÇĞİÖŞÜ][A-Z0-9ÇĞİÖŞÜa-zçğıöşü.\-]+(?:\s+[A-ZÇĞİÖŞÜ][A-Z0-9ÇĞİÖŞÜa-zçğıöşü.\-]+)?)/);
    if (m) {
      const w = m[1].trim();
      if (w.length >= 3 && !/^(CAY|TEZ|BUZ|KON|AMX|OKY|GN|STAND|MAKARNA|EL\s)/i.test(w)) {
        leadWord[w] = (leadWord[w] || 0) + 1;
      }
    }
  }
}

const mism = oz.filter((r) => {
  const d = detectOztiOemBrand(r.name, r.category, r.sku || r.model);
  return (r.oem_brand || "Öztiryakiler") !== d;
});

console.log("=== stored oem_brand ===");
Object.entries(stored)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(v, k));

console.log("\n=== detectOztiOemBrand (simule) ===");
Object.entries(detected)
  .sort((a, b) => b[1] - a[1])
  .forEach(([k, v]) => console.log(v, k));

console.log("\n=== stored != detected:", mism.length);
mism.slice(0, 20).forEach((r) =>
  console.log(r.sku, "|", r.oem_brand, "→", detectOztiOemBrand(r.name, r.category, r.sku), "|", r.name?.slice(0, 55)),
);

console.log("\n=== ad basi (hala Oztiryakiler) en sik 50 ===");
Object.entries(leadWord)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50)
  .forEach(([k, v]) => console.log(v, k));
