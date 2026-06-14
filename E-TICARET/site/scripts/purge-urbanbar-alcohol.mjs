#!/usr/bin/env node
/**
 * Urban Bar alkollü ürünleri dept + ekipmanlar + besos katalogdan temizler.
 *   node scripts/purge-urbanbar-alcohol.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { isUrbanBarAlcoholRow } from "./lib/urbanbar-alcohol-filter.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const BRAND_ID = "urban-bar";
const KAYNAK = "urbanbar-web";

function isUrbanBarRow(r) {
  return String(r?.kaynak || "") === KAYNAK || String(r?.id || "").startsWith(`${BRAND_ID}__`);
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

let totalRemoved = 0;
const removedSamples = [];

for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
  const filePath = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const kept = [];
  let removed = 0;
  for (const row of rows) {
    if (isUrbanBarRow(row) && isUrbanBarAlcoholRow(row)) {
      removed++;
      if (removedSamples.length < 15) removedSamples.push(row.name || row.id);
      continue;
    }
    kept.push(row);
  }
  if (removed) {
    writeJsonAtomic(filePath, kept);
    console.log(`[purge-urbanbar-alcohol] ${file}: -${removed} (kalan ${kept.length})`);
    totalRemoved += removed;
  }
}

console.log(`[purge-urbanbar-alcohol] toplam kaldırılan: ${totalRemoved}`);
if (removedSamples.length) {
  console.log("  örnek:", removedSamples.slice(0, 8).join(" | "));
}

if (totalRemoved === 0) {
  console.log("[purge-urbanbar-alcohol] dept dosyalarında alkollü Urban Bar satırı yok.");
} else {
  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/build-urbanbar-besos-catalog.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}
