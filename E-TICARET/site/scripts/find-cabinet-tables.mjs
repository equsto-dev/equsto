import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== DOLAPLI TEZGAHLAR (170 VE 190) ===");

products.filter(p => p.name && p.name.toLowerCase().includes("dolaplı") && p.name.toLowerCase().includes("tezg") && (p.name.includes("190") || p.name.includes("170")))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });

console.log("\n=== DIGER DOLAPLI TEZGAHLAR (7911 veya PIMAK) ===");
products.filter(p => p.sku && p.sku.includes("7911.") && (p.sku.includes("190") || p.sku.includes("170")))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name}`);
  });
