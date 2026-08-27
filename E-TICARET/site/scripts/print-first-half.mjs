import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

function findSKUs(pattern) {
  return products.filter(p => p.sku && p.sku.toLowerCase().includes(pattern.toLowerCase()));
}

function findName(pattern) {
  return products.filter(p => p.name && p.name.toLowerCase().includes(pattern.toLowerCase()));
}

const queries = [
  { label: "Soğuk Oda 200*300", pattern: "cr2030" },
  { label: "Soğuk Oda 3020", pattern: "cr3020" },
  { label: "Soğuk Oda CR", pattern: "7919.CR" },
  { label: "Deep Freeze DF", pattern: "7919.DF" },
  { label: "Dizden Basmalı El Yıkama", pattern: "7822.04" },
  { label: "Tek Eviyeli Tezgah 140", pattern: "7721." },
  { label: "Evyeli Tezgah 140", pattern: "evyeli" },
  { label: "TAG Buzdolabı 60 LMV", pattern: "tag 60" },
  { label: "TAG 60 LMV", pattern: "79E3.06" },
  { label: "TAG 60 LMV Dondurucu", pattern: "79E3.06LMV" },
  { label: "Setaltı Dondurucu", pattern: "79e3." },
  { label: "Make Up Dolap", pattern: "makeup" },
  { label: "Pizza Hazırlık Dolap", pattern: "pizza hazırlık" },
  { label: "Pizza Hazırlık Öztiryakiler", pattern: "7919.33" },
  { label: "Salata Hazırlık Öztiryakiler", pattern: "7919.27" },
  { label: "Salata Hazırlık Öztiryakiler 370", pattern: "7919.37" },
  { label: "Atalay 4 Açık Alevli Ocak", pattern: "9160.4" },
  { label: "Atalay Setüstü Ocak", pattern: "9160" },
  { label: "Atalay Fritöz", pattern: "9235" },
  { label: "Atalay Patates", pattern: "9239" },
  { label: "Atalay Izgara", pattern: "9160.P" },
  { label: "Atalay Plate", pattern: "plate" }
];

for (const q of queries) {
  let matches = findSKUs(q.pattern);
  if (matches.length === 0) {
    matches = findName(q.pattern);
  }
  console.log(`\n======================================`);
  console.log(`QUERY: ${q.label} ("${q.pattern}") - Found: ${matches.length}`);
  console.log(`======================================`);
  for (const m of matches.slice(0, 4)) {
    const img = m.images && m.images.length > 0 ? (m.images[0].path || m.images[0].url) : "YOK";
    console.log(`SKU: ${m.sku} | Marka: ${m.brand} | Fiyat: ${m.satis_fiyat_eur ?? m.price ?? "Yok"}`);
    console.log(`Ad: ${m.name}`);
    console.log(`Görsel: ${img}`);
  }
}
