import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== CİHAZALTI BUZDOLAPLARI SIZES ===");
products.filter(p => p.sku && (p.sku.includes("NTV.C") || p.sku.includes("NTV.S") || p.sku.includes("NMV")))
  .filter(p => p.name.toLowerCase().includes("cihazaltı") || p.name.toLowerCase().includes("yatay"))
  .slice(0, 30).forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
