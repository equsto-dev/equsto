/**
 * geo-bodies-words.json (EN profiller) → public/data/geo-landings-en.json gövdeleri
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertGeoEnBody, normalizeGeoEnBody } from "./lib/normalize-geo-en-body.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const words = JSON.parse(fs.readFileSync(path.join(root, "scripts/geo-bodies-words.json"), "utf8"));
const enPath = path.join(root, "public/data/geo-landings-en.json");
const data = JSON.parse(fs.readFileSync(enPath, "utf8"));

const EN_MAP = {
  "en/industrial-kitchen-supplier-turkey": "seoEnIndustrial",
  "en/industrial-kitchen-equipment-turkey": "seoEnIndustrial",
  "en/commercial-kitchen-quotation": "seoEnQuotation",
};

for (const [pageKey, prof] of Object.entries(EN_MAP)) {
  if (!data[pageKey] || !words[prof]) continue;
  data[pageKey].body = assertGeoEnBody(pageKey, normalizeGeoEnBody(words[prof]));
}

fs.writeFileSync(enPath, JSON.stringify(data, null, 2) + "\n");
fs.copyFileSync(enPath, path.join(root, "lib/geo/landings-en.json"));
console.log("[patch-geo-landings-en-words] EN sayfa gövdeleri güncellendi (600-700 karakter)");
