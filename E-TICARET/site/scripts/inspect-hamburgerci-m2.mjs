import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));
const burgerData = wizard.m2ByDukkan["Hamburgerci"];

console.log("=== HAMBURGERCİ WIZARD DATA ===");
console.log("Keys:", Object.keys(burgerData));
console.log("Slug:", burgerData.slug);
console.log("Bands:", Object.keys(burgerData.bands || {}));

const band35 = burgerData.bands["35-100"];
if (band35) {
  console.log("\n=== BAND 35-100 ===");
  console.log("M2:", band35.m2);
  console.log("Total Items:", band35.items?.length);
  
  if (band35.items) {
    console.log("\nListing matched products for Hamburgerci (first 10):");
    band35.items.slice(0, 10).forEach(item => {
      console.log(`- Poz: ${item.poz} | Ad: ${item.ad} | Adet: ${item.adet}`);
      if (item.product) {
        console.log(`  Matched SKU: ${item.product.sku} | Name: ${item.product.name} | Price: ${item.product.satis_fiyat_eur ?? item.product.price}`);
        console.log(`  Matched Image: ${item.product.images?.[0]?.path || item.product.images?.[0]?.url || "YOK"}`);
      } else {
        console.log("  Matched: NO PRODUCT MATCHED!");
      }
    });
  }
}
