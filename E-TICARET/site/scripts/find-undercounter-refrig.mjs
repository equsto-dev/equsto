import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== TEZGAHALTI BUZDOLAPLARI ARAMA ===");
const results = products.filter(p => {
  const name = (p.name || "").toLowerCase();
  return (name.includes("tezgahaltı") || name.includes("tezgah altı") || name.includes("setaltı") || name.includes("set altı") || name.includes("cihazaltı") || name.includes("cihaz altı")) && (name.includes("buz") || name.includes("dondurucu") || name.includes("freez") || name.includes("soğut"));
});

console.log(`Bulunan: ${results.length}`);
results.slice(0, 30).forEach(r => {
  console.log(`SKU: ${r.sku} | Brand: ${r.brand} | Name: ${r.name} | Price: ${r.satis_fiyat_eur ?? r.price}`);
});

console.log("\n=== 140 VE 200 ARAMA ===");
products.filter(p => p.sku && (p.sku.includes("140") || p.sku.includes("200")) && (p.name.toLowerCase().includes("buz") || p.name.toLowerCase().includes("dondurucu")))
  .slice(0, 15).forEach(r => {
    console.log(`SKU: ${r.sku} | Brand: ${r.brand} | Name: ${r.name}`);
  });
