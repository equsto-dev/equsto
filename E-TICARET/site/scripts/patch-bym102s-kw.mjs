import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = join(root, "public/data/ekipmanlar.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

/** Cafemarkt / inoksan.com — giyotin BYM102S */
const POWER_LINES = [
  "Elektrik Girişi: 380-400V 3N 50Hz",
  "Tank Isı Kapasitesi(kW): 2,7",
  "Boyler Isı Kapasitesi(kW): 8",
  "Maks. Güç Tüketimi(kW): 11,3",
];

const idx = catalog.findIndex((r) => r.sku === "INO-BYM102S");
if (idx < 0) {
  console.error("INO-BYM102S not found");
  process.exit(1);
}

const row = catalog[idx];
const teknik = Array.isArray(row.teknik_ozellikler) ? [...row.teknik_ozellikler] : [];
for (const line of POWER_LINES) {
  if (!teknik.some((t) => String(t).includes(line.split(":")[0]))) teknik.push(line);
}
row.teknik_ozellikler = teknik;

let specs = String(row.specs ?? "");
if (!specs.includes("Maks. Güç Tüketimi")) {
  specs +=
    "\n\nTeknik Özellikler (cafemarkt.com)\n" + POWER_LINES.join("\n");
  row.specs = specs;
}

writeFileSync(catalogPath, JSON.stringify(catalog));
console.log("Patched INO-BYM102S with", POWER_LINES.at(-1));
