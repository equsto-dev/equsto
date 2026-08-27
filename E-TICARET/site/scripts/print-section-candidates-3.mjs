import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const JSON_PATH = path.join(SITE, "..", "..", "PFOS", "veri", "hamburgerci-candidates-full.json");

const data = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

const keys = ["A1", "A2", "B1", "B2", "C1", "C2"];

for (const id of keys) {
  const info = data[id];
  if (!info) continue;
  console.log(`\n======================================`);
  console.log(`POZ ${id}: ${info.label}`);
  console.log(`======================================`);
  const topMatches = info.matches.slice(0, 5);
  if (topMatches.length === 0) {
    console.log("  Hiç eşleşme bulunamadı.");
  }
  for (const m of topMatches) {
    const imgStr = m.images.length > 0 ? (m.images[0].path || m.images[0].url || m.images[0]) : "YOK";
    console.log(`  - SKU: ${m.sku} | Marka: ${m.brand} | Fiyat: ${m.price} | Score: ${m.score}`);
    console.log(`    Ad: ${m.name}`);
    console.log(`    Görsel: ${imgStr}`);
  }
}
