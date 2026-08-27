import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== DAVLUMBAZLAR ===");
products.filter(p => p.name && p.name.toLowerCase().includes("davlumbaz") && p.brand && p.brand.toLowerCase().includes("öztiryakiler"))
  .slice(0, 30).forEach(p => {
    const img = p.images && p.images.length > 0 ? (p.images[0].path || p.images[0].url) : "YOK";
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price} | Görsel: ${img}`);
  });
