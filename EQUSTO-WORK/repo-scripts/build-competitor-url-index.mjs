/**
 * Rakip URL eşleme indeksi → public/data/competitor-url-index.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  ROOT,
  INDEX_PATH,
  MAP_PATH,
  buildUrlIndex,
} from "./lib/competitor-url-resolve.mjs";

const CATALOG = join(ROOT, "public", "data", "ekipmanlar.json");

function main() {
  const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
  let manual = { overrides: [] };
  try {
    manual = JSON.parse(readFileSync(MAP_PATH, "utf8"));
  } catch {
    /* optional */
  }
  const index = buildUrlIndex(catalog, manual);
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
  console.log(
    "[competitor-index]",
    "urls:",
    Object.keys(index.byUrl).length,
    "sku:",
    Object.keys(index.bySku).length,
    "→",
    INDEX_PATH
  );
}

main();
