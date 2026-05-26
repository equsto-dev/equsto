/**
 * Katalog fiyat tutarsızlığı raporu.
 * Ana sayfa eski parseFloat hatası: "₺18.221,49 + KDV" → 18.221 (≈18,22 TL)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePriceTLFromCatalog } from "./lib/parse-price-tl.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const CATALOG = path.join(ROOT, "public/data/ekipmanlar.json");

/** Eski ana sayfa (hatalı) */
function parseHomeLegacy(price) {
  if (!price) return NaN;
  return parseFloat(String(price).replace(/[^\d.,]/g, "").replace(",", "."));
}

function parseHomeFixed(price) {
  const n = parsePriceTLFromCatalog(price);
  return n > 0 ? n : NaN;
}

const MIN_SANE = 500; // endüstriyel ekipman alt sınır (şüpheli düşük)
const RATIO = 0.15; // legacy < %15 of fixed → hatalı say

const arr = JSON.parse(fs.readFileSync(CATALOG, "utf8"));
const bad = [];
let legacyLow = 0;

for (const x of arr) {
  const priceStr = x.price;
  if (!priceStr || /teklif|iletişim|fiyat alınız/i.test(String(priceStr))) continue;
  const legacy = parseHomeLegacy(priceStr);
  const fixed = parseHomeFixed(priceStr);
  if (!Number.isFinite(fixed) || fixed < MIN_SANE) continue;
  if (!Number.isFinite(legacy) || legacy <= 0) continue;
  if (legacy < fixed * RATIO || legacy < MIN_SANE) {
    bad.push({
      name: x.name,
      brand: x.brand,
      category: x.category,
      price: String(priceStr).split("\n")[0].slice(0, 80),
      legacy,
      fixed,
      fiyat_tl: x.fiyat_tl ?? null,
    });
    legacyLow++;
  }
}

bad.sort((a, b) => a.legacy - b.legacy);
const outPath = path.join(ROOT, "public/data/price-parse-errors.json");
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      catalogCount: arr.length,
      suspiciousCount: bad.length,
      note: "legacy = index.html eski parseFloat; fixed = ilk satır TR binlik kaldırma",
      samples: bad.slice(0, 50),
      all: bad,
    },
    null,
    2
  ),
  "utf8"
);

console.log("[report-catalog-prices] ürün:", arr.length);
console.log("[report-catalog-prices] şüpheli (eski parse << doğru):", bad.length);
console.log("[report-catalog-prices] rapor:", outPath);
console.log("\nÖrnek (ilk 10):");
for (const r of bad.slice(0, 10)) {
  console.log(
    `  ${r.legacy.toLocaleString("tr-TR")} → ${r.fixed.toLocaleString("tr-TR")} TL | ${r.brand} | ${r.name.slice(0, 55)}`
  );
}
