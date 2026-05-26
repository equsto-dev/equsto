/**
 * Tulumba / köfte şekillendirme → hamur-hazirlik-makineleri (hazirlik).
 *   node scripts/reclass-tulumba-hamur.mjs
 *   node scripts/reclass-tulumba-hamur.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const APPLY = process.argv.includes("--apply");

function isTulumbaShaper(name) {
  const hay = String(name || "").toLocaleLowerCase("tr");
  if (!/tulumba/.test(hay)) return false;
  return (
    /şekillendirme|sekillendirme|şekil verme|sekil verme|makin|tk\.|emp\.tk/i.test(hay) ||
    /köfte|kofte/.test(hay)
  );
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const hits = catalog.filter((p) => isTulumbaShaper(p.name));

console.log(`[reclass] ${hits.length} tulumba şekillendirme ürünü`);
for (const p of hits) {
  console.log(`  ${p.id}`);
  console.log(`    ${p.category} (${p.dept}) → hamur-hazirlik-makineleri (hazirlik)`);
  if (APPLY) {
    p.category = "hamur-hazirlik-makineleri";
    p.dept = "hazirlik";
  }
}

if (APPLY && hits.length) {
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n[apply] ekipmanlar.json güncellendi — npm run data:dept");
} else if (!APPLY) {
  console.log("\nUygulamak için: node scripts/reclass-tulumba-hamur.mjs --apply");
}
