#!/usr/bin/env node
/**
 * market-reyon / self-servis-hatti İnoksan görselleri
 * Kaynak: inoksan.com/imagesfolder/products/{KOD}.jpg
 *
 *   node scripts/sync-inoksan-self-servis-images.mjs
 *   node scripts/sync-inoksan-self-servis-images.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const MARKET = path.join(ROOT, "public/data/dept/market-reyon.json");
const IMG_DIR = path.join(ROOT, "public/images/catalog/inoksan/web");
const IMG_SUB = "images/catalog/inoksan/web";
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

function isValidImageFile(dest) {
  if (!fs.existsSync(dest)) return false;
  if (fs.statSync(dest).size <= 3000) return false;
  const head = fs.readFileSync(dest, { start: 0, end: 11 });
  if (head[0] === 0xff && head[1] === 0xd8) return true;
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return true;
  return false;
}

function curlBin(url, dest) {
  if (dryRun) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync("curl.exe", ["-sL", "--max-time", "60", "-o", dest, url], { stdio: "pipe" });
  if (r.status !== 0 || !isValidImageFile(dest)) {
    try {
      fs.unlinkSync(dest);
    } catch (_) {}
    return false;
  }
  return true;
}

/** SKU kodu imagesfolder/products/{KOD}.jpg yoksa — inoksan.com kategori görseli */
const SKU_PREFIX_FALLBACKS = [
  [/^KLGK/i, "https://www.inoksan.com/imagesfolder/products/GLNK-TEPSI-STANDI.png"],
  [/^KLG/i, "https://www.inoksan.com/imagesfolder/products/GLN-TEPSI-STANDI.png"],
  [/^GT07/i, "https://www.inoksan.com/imagesfolder/products/GTN-SERVIS-TEZGAHI-ARA-RAFLI.png"],
  [/^KST/i, "https://www.inoksan.com/imagesfolder/products/GSN-SICAK-SERVIS-UNITESI.png"],
  [/^KBN/i, "https://www.inoksan.com/imagesfolder/products/KBN-Servis-Buzdolabi.png"],
  [/^KBT/i, "https://www.inoksan.com/imagesfolder/products/KBN-Servis-Buzdolabi.png"],
];

function imgUrlsForSku(sku) {
  const code = String(sku || "")
    .replace(/^INO-/i, "")
    .trim();
  const bases = [code, `INO-${code}`];
  const exts = [".jpg", ".png", ".JPG", ".PNG"];
  const out = [];
  for (const b of bases) {
    for (const ext of exts) {
      out.push(`https://www.inoksan.com/imagesfolder/products/${b}${ext}`);
    }
  }
  return out;
}

function localDest(sku) {
  return path.join(IMG_DIR, `${slugify(sku)}.jpg`);
}

function imgRel(sku) {
  return `${IMG_SUB}/${slugify(sku)}.jpg`;
}

function hasGoodLocal(dest) {
  return isValidImageFile(dest);
}

function fallbackUrlsForSku(sku) {
  const code = String(sku || "").replace(/^INO-/i, "").trim();
  for (const [re, url] of SKU_PREFIX_FALLBACKS) {
    if (re.test(code)) return [url];
  }
  return [];
}

function downloadForSku(sku) {
  const dest = localDest(sku);
  if (!force && hasGoodLocal(dest)) {
    return imgRel(sku);
  }
  const urls = [...imgUrlsForSku(sku), ...fallbackUrlsForSku(sku)];
  for (const url of urls) {
    if (curlBin(url, dest)) return imgRel(sku);
  }
  return hasGoodLocal(dest) ? imgRel(sku) : "";
}

function main() {
  const rows = JSON.parse(fs.readFileSync(MARKET, "utf8"));
  let touched = 0;
  let downloaded = 0;
  let failed = 0;

  const out = rows.map((row) => {
    if (row?.brand !== "İnoksan" || row?.category !== "self-servis-hatti") return row;
    const had = row.images?.[0];
    const rel = downloadForSku(row.sku);
    if (!rel) {
      failed++;
      if (!had) console.warn("[inoksan-img] görsel yok:", row.sku);
      return row;
    }
    if (row.images?.[0] !== rel) {
      row = { ...row, images: [rel] };
      touched++;
    }
    if (!had || force) downloaded++;
    return row;
  });

  console.log(
    `[inoksan-img] ${dryRun ? "DRY-RUN" : "OK"} | güncellenen: ${touched} | indirilen/yerel: ${downloaded} | başarısız: ${failed}`,
  );

  if (!dryRun) {
    fs.writeFileSync(MARKET, JSON.stringify(out), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main();
