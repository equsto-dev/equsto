import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== DONDURUCU VE BUZDOLABI ARAMA ===");
const dondurucular = products.filter(p => p.name && (p.name.toLowerCase().includes("dondurucu") || p.name.toLowerCase().includes("freez")));
console.log(`Toplam dondurucu sayısı: ${dondurucular.length}`);

dondurucular.filter(p => p.name.includes("60") || p.sku.includes("60") || p.name.toLowerCase().includes("setaltı") || p.name.toLowerCase().includes("tezgahaltı"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Brand: ${p.brand} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
