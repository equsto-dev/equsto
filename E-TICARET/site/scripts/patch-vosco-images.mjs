#!/usr/bin/env node
/**
 * Mevcut Vosco satırlarına görsel ekle (vosco-web-catalog.json → images/catalog/vosco).
 *
 *   node scripts/patch-vosco-images.mjs
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/vosco/vosco-web-catalog.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/vosco");
const UA = "EqustoImport/1.0 (+https://equsto.com; vosco-images)";

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function imageRelFor(p) {
  const imgUrl = p.images?.[0];
  if (!imgUrl || !/^https?:\/\//i.test(imgUrl)) return "";
  let ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
  if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
  const safe = `vosco-${String(p.stockCode || p.productId || "p")
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")}${ext}`;
  return `images/catalog/vosco/${safe}`;
}

function isVoscoRow(r) {
  return String(r?.kaynak || "") === "vosco-web" || String(r?.id || "").startsWith("vosco__");
}

async function main() {
  const raw = JSON.parse(await fsp.readFile(SRC_JSON, "utf8"));
  const products = raw.products || [];
  const bySku = new Map();
  for (const p of products) {
    const sku = String(p.stockCode || "").trim();
    if (sku) bySku.set(sku, p);
  }

  let downloaded = 0;
  let skipped = 0;
  const skuToRel = new Map();

  for (const p of products) {
    const sku = String(p.stockCode || "").trim();
    const rel = imageRelFor(p);
    if (!sku || !rel) {
      skipped++;
      continue;
    }
    const dest = path.join(ROOT, "public", rel);
    if (fs.existsSync(dest)) {
      skuToRel.set(sku, rel);
      continue;
    }
    const ok = await downloadImage(p.images[0], dest);
    if (ok) {
      downloaded++;
      skuToRel.set(sku, rel);
      process.stdout.write(".");
    } else {
      skipped++;
      console.warn(`\nİndirilemedi: ${sku} ${p.images[0]}`);
    }
  }
  console.log(`\n[vosco-images] indirilen: ${downloaded}, atlanan: ${skipped}, toplam eşleşme: ${skuToRel.size}`);

  let patchedRows = 0;
  for (const file of fs.readdirSync(DEPT_DIR).sort()) {
    if (!file.endsWith(".json")) continue;
    const filePath = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (!Array.isArray(rows)) continue;
    let changed = false;
    for (const row of rows) {
      if (!isVoscoRow(row)) continue;
      const sku = String(row.sku || row.model || "").trim();
      const rel = skuToRel.get(sku);
      if (!rel) continue;
      if (row.images?.[0] === rel) continue;
      row.images = [rel];
      patchedRows++;
      changed = true;
    }
    if (changed) {
      const tmp = `${filePath}.tmp-${process.pid}`;
      fs.writeFileSync(tmp, JSON.stringify(rows), "utf8");
      fs.renameSync(tmp, filePath);
      console.log(`  güncellendi: ${file}`);
    }
  }

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  console.log(`[vosco-images] katalog satırı güncellendi: ${patchedRows}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
