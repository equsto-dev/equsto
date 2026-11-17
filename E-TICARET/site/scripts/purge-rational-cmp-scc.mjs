#!/usr/bin/env node
/**
 * Cafemarkt'tan gelen eski Rational CombiMaster Plus (CMP) ve
 * SelfCooking Center satırlarını kaldırır. iCombi + iVario kalır.
 * Özti markalı SCC WE satırlarına dokunmaz.
 *
 *   node scripts/purge-rational-cmp-scc.mjs
 *   node scripts/purge-rational-cmp-scc.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PISIRME = path.join(ROOT, "public/data/dept/pisirme.json");
const dryRun = process.argv.includes("--dry-run");

function shouldPurge(row) {
  const sku = String(row.sku || row.urun_kodu || "");
  const name = String(row.name || "");
  const brand = String(row.brand || "");
  if (/^9890\.OCMP/i.test(sku)) return true;
  if (/^9890\.SCCWEXS/i.test(sku)) return true;
  if (/rational/i.test(brand) && /\bCMP\d|CombiMaster/i.test(name)) return true;
  if (/rational/i.test(brand) && /SelfCooking\s*Center/i.test(name)) return true;
  return false;
}

const rows = JSON.parse(fs.readFileSync(PISIRME, "utf8"));
const keep = [];
const removed = [];
for (const row of rows) {
  if (shouldPurge(row)) removed.push(row);
  else keep.push(row);
}

console.log(`[purge-rational-cmp-scc] silinecek: ${removed.length}`);
for (const r of removed) {
  console.log(`  - ${r.sku || r.id} | ${(r.name || "").slice(0, 72)}`);
}

if (!dryRun && removed.length > 0) {
  fs.writeFileSync(PISIRME, JSON.stringify(keep), "utf8");
  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log(`[purge-rational-cmp-scc] OK — kalan pisirme: ${keep.length}`);
} else {
  console.log(
    `[purge-rational-cmp-scc] ${dryRun ? "DRY-RUN" : "değişiklik yok"}`,
  );
}
