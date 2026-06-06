#!/usr/bin/env node
/**
 * Yüksel PDF import hatası: ölçü satırları (144X64X62 vb.) buzdolabı sanılıp kataloga girmiş.
 *   node scripts/purge-yuksel-dimension-junk.mjs
 *   node scripts/purge-yuksel-dimension-junk.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const dryRun = process.argv.includes("--dry-run");

function isDimensionOnlySku(model) {
  const m = String(model || "")
    .trim()
    .replace(/\s+/g, "");
  return /^\d{2,3}[Xx]\d{2}[Xx]\d{2,3}(\/\d+)?$/.test(m);
}

function isYukselDimensionJunk(row) {
  if (!String(row.kaynak_fiyat_listesi || "").includes("yuksel-2025-yerli")) return false;
  const sku = String(row.sku || row.model || "").trim();
  if (isDimensionOnlySku(sku)) return true;
  const hay = `${row.name || ""} ${row.specs || ""}`.toLocaleLowerCase("tr");
  if (/tel\s*raf\s*dikme/.test(hay) && isDimensionOnlySku(sku)) return true;
  if (/her\s*kap[iı]da\s*1\s*adet\s*raf\s*bulunmakt/.test(hay) && /\d{2,3}[xX]\d{2}[xX]\d/.test(sku + hay)) {
    return true;
  }
  return false;
}

const deptFiles = fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json"));
let totalRemoved = 0;

for (const file of deptFiles) {
  const fp = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!Array.isArray(rows)) continue;
  const kept = rows.filter((r) => !isYukselDimensionJunk(r));
  const removed = rows.length - kept.length;
  if (removed === 0) continue;
  totalRemoved += removed;
  console.log(`[purge-dimension-junk] ${file}: -${removed} (kalan ${kept.length})`);
  if (!dryRun) fs.writeFileSync(fp, JSON.stringify(kept), "utf8");
}

console.log(`[purge-dimension-junk] toplam silinen: ${totalRemoved}${dryRun ? " (dry-run)" : ""}`);

if (!dryRun && totalRemoved > 0) {
  const r = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  process.exit(r.status ?? 1);
}
