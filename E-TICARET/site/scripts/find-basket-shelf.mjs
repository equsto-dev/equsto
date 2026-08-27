import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== BASKET VE DUVAR RAFLARI ===");
products.filter(p => p.name && (p.name.toLowerCase().includes("basket") || p.name.toLowerCase().includes("süzmeli")) && p.name.toLowerCase().includes("raf"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });

console.log("\n=== 7897 SİZES WITH 140 ===");
products.filter(p => p.sku && p.sku.startsWith("7897.140"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name}`);
  });
