/**
 * atalay-doner-ocak.json → public/data/fiyatlar.json (yalnız döner ocakları)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CATALOG = path.join(ROOT, "scripts/data/atalay-doner-ocak.json");
const OUT = path.join(ROOT, "public/data/fiyatlar.json");

const { products } = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const data = {};
for (const p of products) {
  data[p.modelCode] = p.priceTl;
  data[p.slug] = p.priceTl;
}

fs.writeFileSync(
  OUT,
  JSON.stringify({ version: 1, source: "atalay-doner-ocak", updatedAt: new Date().toISOString(), data }, null, 2),
  "utf8"
);
console.log("[fiyatlar] →", OUT, Object.keys(data).length / 2, "ürün");
