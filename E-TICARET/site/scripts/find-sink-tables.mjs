import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log("=== EVYELİ TEZGAHLAR ===");
const evyeliler = products.filter(p => p.name && p.name.toLowerCase().includes("evyeli") && p.name.toLowerCase().includes("tezg"));
console.log(`Toplam evyeli tezgah: ${evyeliler.length}`);

evyeliler.filter(p => p.name.includes("140"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
