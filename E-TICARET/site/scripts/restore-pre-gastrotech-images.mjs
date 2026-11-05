/**
 * Gastrotech PDF thumbnail'leri mevcut markaların kaliteli görsellerini ezdi.
 * 60b7ae0d1 öncesi image/images alanlarını geri yükle (yalnızca gastrotech/ path'li olanlar).
 * Yeni Gastrotech markalı ürünlere dokunma.
 *
 *   node scripts/restore-pre-gastrotech-images.mjs
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO = path.resolve(ROOT, "../..");
const DEPT = path.join(ROOT, "public/data/dept");
const BASE = "60b7ae0d1";

function gitShowJson(rel) {
  const out = execFileSync("git", ["show", `${BASE}:${rel}`], {
    cwd: REPO,
    encoding: "utf8",
    maxBuffer: 200 * 1024 * 1024,
  });
  return JSON.parse(out);
}

function isGastrotechThumb(p) {
  return typeof p === "string" && p.includes("images/catalog/gastrotech/");
}

function shouldRestore(row) {
  const brand = String(row.brand || "").toLowerCase();
  const id = String(row.id || "");
  if (id.startsWith("gastrotech__") || brand === "gastrotech") return false;
  const imgs = row.images || [];
  const main = row.image || imgs[0] || "";
  return isGastrotechThumb(main) || imgs.some(isGastrotechThumb);
}

const files = fs.readdirSync(DEPT).filter((f) => f.endsWith(".json") && !f.includes("_items"));
let restored = 0;
let skipped = 0;

for (const file of files) {
  const rel = `E-TICARET/site/public/data/dept/${file}`;
  let before;
  try {
    before = gitShowJson(rel);
  } catch {
    continue;
  }
  if (!Array.isArray(before)) continue;
  const byId = new Map(before.filter((r) => r?.id).map((r) => [r.id, r]));

  const full = path.join(DEPT, file);
  const rows = JSON.parse(fs.readFileSync(full, "utf8"));
  if (!Array.isArray(rows)) continue;
  let changed = false;

  for (const row of rows) {
    if (!shouldRestore(row)) {
      skipped++;
      continue;
    }
    const prev = byId.get(row.id);
    if (!prev) continue;
    const prevImgs = Array.isArray(prev.images) ? prev.images.filter(Boolean) : [];
    const prevMain = prev.image || prevImgs[0] || "";
    if (!prevMain || isGastrotechThumb(prevMain)) continue;
    row.images = prevImgs.length ? prevImgs : [prevMain];
    row.image = prevMain;
    if (row.gastrotech_image) delete row.gastrotech_image;
    restored++;
    changed = true;
  }

  if (changed) {
    const tmp = `${full}.tmp-${process.pid}`;
    fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + "\n", "utf8");
    fs.renameSync(tmp, full);
  }
}

console.log(`[restore-pre-gt-images] restored=${restored} kept_gt_or_ok=${skipped}`);
