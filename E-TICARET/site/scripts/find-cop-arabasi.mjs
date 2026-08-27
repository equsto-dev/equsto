import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== COP ARABASI ARAMA ===");
products.filter(p => p.sku && p.sku.startsWith("7962."))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name}`);
  });

console.log("\n=== DIGER ARABALAR ===");
products.filter(p => p.name && p.name.toLowerCase().includes("çöp arabası"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name}`);
  });
