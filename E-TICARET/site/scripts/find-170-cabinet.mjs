import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== 170 DOLAPLI TEZGAH ARAMA ===");
products.filter(p => p.sku && p.sku.includes("7911.170"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name}`);
  });
