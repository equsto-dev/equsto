import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== WORK TABLES 160*70 ===");
const tables = products.filter(p => p.name && p.name.toLowerCase().includes("tezg") && p.name.toLowerCase().includes("çalışma") && p.name.toLowerCase().includes("ara"));
console.log(`Toplam çalışma tezgahı: ${tables.length}`);

tables.filter(p => p.name.includes("160") || p.sku.includes("160"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });

console.log("\n=== ALL TABLES 160*70 ===");
products.filter(p => p.name && p.name.toLowerCase().includes("tezg") && p.name.includes("160") && p.name.includes("70"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
