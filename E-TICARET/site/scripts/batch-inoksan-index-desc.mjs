#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  applyInoksanDescription,
  buildInoksanComIndexDescription,
  buildWebCodeIndex,
  matchInoksanWeb,
} from "./lib/inoksan-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const WEB_INDEX = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const REPORT = path.join(ROOT, "scripts/data/inoksan-shop-desc-report.json");

const TARGET = [
  "INO-RBS100", "INO-RBS200", "INO-FBE10", "INO-FBE10T", "INO-FBE20", "INO-FBE20T",
  "INO-FBE40", "INO-FBE40T", "INO-7KG21", "INO-9TC10", "INO-9TC10S", "INO-9TC20",
  "INO-9TC20S", "INO-PDG300", "INO-PDG303", "INO-PDG400", "INO-PDG500", "INO-PDG503",
  "INO-PEK100", "INO-ZMD-9TC10", "INO-ZMD-9TC10S", "INO-ZBC-BS", "INO-ZBC-BS6",
];

const webIndex = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
const products = webIndex.products || [];
const codeIndex = buildWebCodeIndex(products);
const want = new Set(TARGET.map((s) => s.toUpperCase()));

const changedFiles = new Map();
let ok = 0;
const stillMissing = [];

for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  const dest = path.join(DEPT_DIR, file);
  const list = JSON.parse(fs.readFileSync(dest, "utf8"));
  let touched = false;
  for (const row of list) {
    const sku = String(row.sku || "").toUpperCase();
    if (!want.has(sku)) continue;
    want.delete(sku);
    const match = matchInoksanWeb(sku, row.name || "", products, codeIndex);
    const payload = buildInoksanComIndexDescription(match?.product);
    if (payload && applyInoksanDescription(row, {
      ...payload,
      url: match?.product?.id
        ? `https://inoksan.com/urun/${match.product.id}/${match.product.slug}`
        : row.inoksan_url || "",
      shopSku: sku,
    })) {
      ok++;
      touched = true;
      console.log("OK", sku);
    } else {
      stillMissing.push(sku);
      console.log("FAIL", sku);
    }
  }
  if (touched) changedFiles.set(file, list);
}

for (const [file, list] of changedFiles) {
  fs.writeFileSync(path.join(DEPT_DIR, file), JSON.stringify(list), "utf8");
}

spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

for (const sku of want) stillMissing.push(sku);

fs.writeFileSync(
  REPORT,
  JSON.stringify(
    {
      at: new Date().toISOString(),
      total: 947,
      indexBatchOk: ok,
      missing: stillMissing.length,
      missingSkus: stillMissing,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(`[batch-index] ok:${ok} fail:${stillMissing.length}`, stillMissing);
