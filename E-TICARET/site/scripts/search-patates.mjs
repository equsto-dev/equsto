import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

const atalay = products.filter(p => p.brand && p.brand.toLowerCase().includes("atalay"));

console.log("=== APD veya Patates Arama ===");
atalay.filter(p => p.sku.includes("APD") || p.name.toLowerCase().includes("patates") || p.name.toLowerCase().includes("dinlendirme"))
  .forEach(p => {
    console.log(`SKU: ${p.sku} | Name: ${p.name} | Price: ${p.satis_fiyat_eur ?? p.price}`);
  });
