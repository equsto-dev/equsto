#!/usr/bin/env node
/** Rapor eksik SKU — web indeks + shop --force */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyInoksanDescription,
  buildInoksanComIndexDescription,
  buildWebCodeIndex,
  matchInoksanWeb,
} from "./lib/inoksan-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT = path.join(ROOT, "scripts/data/inoksan-shop-desc-report.json");
const WEB_INDEX = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const FETCH = path.join(ROOT, "scripts/fetch-inoksan-shop-descriptions.mjs");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";

const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
const skus = report.missingSkus || [];
if (!skus.length) {
  console.log("[retry-inoksan] eksik SKU yok");
  process.exit(0);
}

const webIndex = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
const products = webIndex.products || [];
const codeIndex = buildWebCodeIndex(products);

function findRow(sku) {
  for (const f of fs.readdirSync(DEPT_DIR)) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    const row = list.find((r) => String(r.sku || "").toUpperCase() === sku.toUpperCase());
    if (row) return { row, file: f, list };
  }
  return null;
}

function saveRow(hit) {
  const dest = path.join(DEPT_DIR, hit.file);
  const out = hit.list.map((r) => (r.sku === hit.row.sku ? hit.row : r));
  fs.writeFileSync(dest, JSON.stringify(out), "utf8");
}

console.log(`[retry-inoksan] ${skus.length} SKU`);
let ok = 0;
let fail = 0;

for (const sku of skus) {
  const hit = findRow(sku);
  if (!hit) {
    console.log(`  SKIP ${sku} (katalogda yok)`);
    fail++;
    continue;
  }

  const match = matchInoksanWeb(sku, hit.row.name || "", products, codeIndex);
  const fromIndex = buildInoksanComIndexDescription(match?.product);
  if (fromIndex && applyInoksanDescription(hit.row, {
    ...fromIndex,
    url: match?.product?.id
      ? `https://inoksan.com/urun/${match.product.id}/${match.product.slug}`
      : hit.row.inoksan_url || "",
    shopSku: sku,
  })) {
    saveRow(hit);
    ok++;
    console.log(`  OK ${sku} (index)`);
    continue;
  }

  const r = spawnSync(process.execPath, [FETCH, "--skip-index", "--force", `--sku=${sku}`], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: "pipe",
    timeout: 180000,
  });
  const out = (r.stdout || "") + (r.stderr || "");
  if (/eksik:0/.test(out)) {
    ok++;
    console.log(`  OK ${sku} (fetch)`);
  } else {
    fail++;
    console.log(`  FAIL ${sku}`);
  }
}

spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

report.missingSkus = skus.filter((_, i) => i >= ok);
report.missing = fail;
report.at = new Date().toISOString();
fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
console.log(`[retry-inoksan] tamam ok:${ok} fail:${fail}`);
