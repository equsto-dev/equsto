/**
 * Takım / çatal-bıçak silme makineleri → bulaşık yıkama (yikama).
 *   node scripts/reclass-takim-silme-yikama.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const APPLY = process.argv.includes("--apply");

function isTakimSilme(name) {
  const hay = String(name || "").toLocaleLowerCase("tr");
  return (
    /takım\s*silme|takim\s*silme|çatal\s*bıçak\s*sil|catal\s*bicak\s*sil|polisaj\s*mak/i.test(hay) ||
    (/sessiz/i.test(hay) && /takım|takim/i.test(hay) && /silme|kurutma/i.test(hay))
  );
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const hits = catalog.filter((p) => isTakimSilme(p.name));

console.log(`[reclass] ${hits.length} takım silme → bulasik-makineleri (yikama)`);
for (const p of hits) {
  console.log(`  ${p.id}`);
  console.log(`    ${p.category} (${p.dept}) → bulasik-makineleri (yikama)`);
  if (APPLY) {
    p.category = "bulasik-makineleri";
    p.dept = "yikama";
  }
}

if (APPLY && hits.length) {
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");
  console.log("\n[apply] ekipmanlar.json — npm run data:dept");
} else if (!APPLY) {
  console.log("\nUygulamak için: node scripts/reclass-takim-silme-yikama.mjs --apply");
}
