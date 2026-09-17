#!/usr/bin/env node
/**
 * Çağlayan ürünlerini dept kataloglarından çıkar → ekipmanlar + proje-akis.
 *   node scripts/strip-caglayan-from-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function isCaglayan(row) {
  const blob = `${row.brand || ""} ${row.kaynak || ""} ${row.category || ""} ${row.id || ""} ${row.oem_brand || ""}`;
  return /çağlayan|caglayan/i.test(blob);
}

function writeJsonArray(filePath, rows) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

let removed = 0;
let files = 0;
for (const file of fs.readdirSync(DEPT_DIR).sort()) {
  if (!file.endsWith(".json")) continue;
  if (file.includes("_items.json")) continue;
  const full = path.join(DEPT_DIR, file);
  const rows = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(rows)) continue;
  const next = rows.filter((row) => {
    if (!row || typeof row !== "object") return true;
    if (isCaglayan(row)) {
      removed++;
      return false;
    }
    return true;
  });
  if (next.length !== rows.length) {
    writeJsonArray(full, next);
    files++;
    console.log(`[strip-caglayan] ${file}: ${rows.length} → ${next.length}`);
  }
}

console.log(`[strip-caglayan] silinen satır: ${removed} · dosya: ${files}`);

function run(script) {
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status || 1);
}

run("scripts/rebuild-ekipmanlar-from-dept.mjs");
run("scripts/sync-proje-akis-products.mjs");
