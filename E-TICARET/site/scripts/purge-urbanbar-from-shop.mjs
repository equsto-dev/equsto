#!/usr/bin/env node
/**
 * Bar Design (Urban Bar) ürünlerini mağaza dept + ekipmanlar kataloğundan kaldırır.
 * Besos katalog JSON ayrı kalır (build-urbanbar-besos-catalog.mjs).
 *
 *   node scripts/purge-urbanbar-from-shop.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { isBarDesignShopProduct } from "./lib/bar-design-shop-exclude.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

let totalRemoved = 0;

for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"))) {
  const filePath = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const kept = rows.filter((r) => !isBarDesignShopProduct(r));
  const removed = rows.length - kept.length;
  if (removed) {
    writeJsonAtomic(filePath, kept);
    console.log(`[purge-bar-design-shop] ${file}: -${removed} (kalan ${kept.length})`);
    totalRemoved += removed;
  }
}

console.log(`[purge-bar-design-shop] toplam kaldırılan: ${totalRemoved}`);

execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

execFileSync(process.execPath, ["scripts/build-urbanbar-besos-catalog.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
});

console.log("[purge-bar-design-shop] OK — Bar Design yalnızca /besos");
