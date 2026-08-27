import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== 170*60 Arama ===");
products.filter(p => p.name && p.name.includes("1700") && p.name.includes("600"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });

console.log("\n=== 170 Arama ===");
products.filter(p => p.name && p.name.includes("170") && (p.name.toLowerCase().includes("tezg") || p.name.toLowerCase().includes("dolap")))
  .slice(0, 15).forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name}`);
  });
