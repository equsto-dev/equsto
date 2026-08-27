import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const WIZARD_PATH = path.join(SITE, "public", "data", "pfos-wizard-branches.json");

const wizard = JSON.parse(fs.readFileSync(WIZARD_PATH, "utf8"));

// Let's find any object in the wizard JSON that mentions bulut-burger
const matches = [];

function searchObj(obj, parentKey = "") {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => searchObj(item, `${parentKey}[${idx}]`));
  } else {
    // If it has a key related to burger or is a package for bulut-burger
    if (obj.kategoriId === "bulut-burger" || obj.id === "bulut-burger" || obj.key === "bulut-burger") {
      matches.push({ path: parentKey, data: obj });
    }
    for (const [k, v] of Object.entries(obj)) {
      searchObj(v, parentKey ? `${parentKey}.${k}` : k);
    }
  }
}

searchObj(wizard);

console.log(`Found ${matches.length} matches for bulut-burger.`);

for (const m of matches) {
  console.log(`\n======================================`);
  console.log(`Path: ${m.path}`);
  console.log(`======================================`);
  
  // If it has kalemler (items) or products, let's list them
  const items = m.data.kalemler || m.data.products || m.data.items || [];
  console.log(`Items count: ${items.length}`);
  
  // If it's a m2 band or branch, let's see
  if (m.data.kategoriId === "bulut-burger") {
    console.log(`kategoriId: ${m.data.kategoriId}, label: ${m.data.label}`);
    if (m.data.kalemler) {
      console.log("Listing first 10 items with matched products:");
      m.data.kalemler.slice(0, 10).forEach(item => {
        const u = item.eslesme || {};
        console.log(`  - Poz: ${item.poz} | Ad: ${item.ad}`);
        console.log(`    Matched SKU: ${u.sku || "YOK"} | Name: ${u.name || u.ad || "YOK"} | Price: ${u.price ?? u.fiyat_try ?? "YOK"}`);
        console.log(`    Matched Image: ${u.image || (u.images && u.images.length > 0 ? u.images[0].path : "YOK")}`);
      });
    }
  } else {
    console.log(JSON.stringify(m.data, null, 2).slice(0, 1000));
  }
}
