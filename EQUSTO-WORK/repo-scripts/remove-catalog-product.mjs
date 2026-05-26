/**
 * Ürünü ekipmanlar.json'dan kalıcı çıkar + catalog-removed-ids.json güncelle.
 *   node scripts/remove-catalog-product.mjs --id=world-plas__...
 *   node scripts/remove-catalog-product.mjs --id=... --apply
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const REMOVED = path.join(ROOT, "public", "data", "catalog-removed-ids.json");
const APPLY = process.argv.includes("--apply");

const idArg = process.argv.find((a) => a.startsWith("--id="));
const PRODUCT_ID = idArg ? idArg.slice("--id=".length).trim() : "";

if (!PRODUCT_ID) {
  console.error("Kullanım: node scripts/remove-catalog-product.mjs --id=<ürün-id> [--apply]");
  process.exit(1);
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const idx = catalog.findIndex((p) => p.id === PRODUCT_ID);
if (idx < 0) {
  console.log(`[remove] Katalogda yok: ${PRODUCT_ID}`);
  process.exit(0);
}

const hit = catalog[idx];
console.log(`[remove] ${hit.name}`);
console.log(`  id: ${hit.id}`);
console.log(`  dept: ${hit.dept} / ${hit.category}`);

if (!APPLY) {
  console.log("\nUygulamak için: node scripts/remove-catalog-product.mjs --id=" + PRODUCT_ID + " --apply");
  process.exit(0);
}

catalog.splice(idx, 1);
fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + "\n", "utf8");

let removed = { description: "", ids: [] };
if (fs.existsSync(REMOVED)) removed = JSON.parse(fs.readFileSync(REMOVED, "utf8"));
if (!Array.isArray(removed.ids)) removed.ids = [];
if (removed.ids.indexOf(PRODUCT_ID) < 0) removed.ids.push(PRODUCT_ID);
fs.writeFileSync(REMOVED, JSON.stringify(removed, null, 2) + "\n", "utf8");

console.log("\n[apply] ekipmanlar.json + catalog-removed-ids.json güncellendi");
console.log("Sonraki: npm run data:dept && npm run data:fallback");
