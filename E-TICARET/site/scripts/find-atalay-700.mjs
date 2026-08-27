import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

const atalay = products.filter(p => p.brand && p.brand.toLowerCase().includes("atalay"));

console.log("=== ATALAY 700/730 SERİSİ ===");
atalay.filter(p => p.name && (p.name.includes("700") || p.name.includes("730") || p.name.includes("70") || p.name.includes("73")))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
