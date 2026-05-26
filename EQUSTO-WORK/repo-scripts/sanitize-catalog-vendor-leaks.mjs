/**
 * ekipmanlar.json + data/dept/*.json — Kariyer Mutfak vb. görünen metin temizliği
 *
 *   node scripts/sanitize-catalog-vendor-leaks.mjs
 *   node scripts/sanitize-catalog-vendor-leaks.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  sanitizeCatalogList,
  catalogHasVendorLeak,
} from "./lib/sanitize-vendor-leaks.mjs";
import {
  buildUrlIndex,
  INDEX_PATH,
  MAP_PATH,
} from "./lib/competitor-url-resolve.mjs";

const DRY = process.argv.includes("--dry-run");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const DEPT_DIR = path.join(ROOT, "public", "data", "dept");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function saveJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function main() {
  let manual = { overrides: [] };
  try {
    manual = JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
  } catch {
    /* optional */
  }
  const catalog = loadJson(CATALOG);
  const index = buildUrlIndex(catalog, manual);

  function processFileWithIndex(p) {
    const raw = loadJson(p);
    const arr = Array.isArray(raw) ? raw : raw.items;
    if (!Array.isArray(arr)) {
      console.warn("[skip]", p, "— dizi değil");
      return { path: p, changed: 0, leaksBefore: 0 };
    }
    const leaksBefore = arr.filter(catalogHasVendorLeak).length;
    const { changed } = sanitizeCatalogList(arr, index);
    if (!DRY && changed > 0) {
      if (Array.isArray(raw)) saveJson(p, arr);
      else {
        raw.items = arr;
        saveJson(p, raw);
      }
    }
    return { path: p, changed, leaksBefore };
  }

  const results = [processFileWithIndex(CATALOG)];
  if (fs.existsSync(DEPT_DIR)) {
    for (const name of fs.readdirSync(DEPT_DIR)) {
      if (!name.endsWith(".json")) continue;
      results.push(processFileWithIndex(path.join(DEPT_DIR, name)));
    }
  }
  if (!DRY) {
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2) + "\n", "utf8");
    console.log("[competitor-index]", INDEX_PATH);
  }
  const totalChanged = results.reduce((s, r) => s + r.changed, 0);
  const totalLeaks = results.reduce((s, r) => s + r.leaksBefore, 0);
  console.log(DRY ? "[dry-run]" : "[apply]", "vendor sanitize");
  for (const r of results) {
    if (r.leaksBefore || r.changed) {
      console.log(" ", path.basename(r.path), "leaks:", r.leaksBefore, "changed:", r.changed);
    }
  }
  console.log("Toplam sızıntı kaydı:", totalLeaks, "güncellenen:", totalChanged);
  if (DRY) console.log("Uygulamak için bayrak olmadan tekrar çalıştırın.");
}

main();
