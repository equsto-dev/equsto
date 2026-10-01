#!/usr/bin/env node
/**
 * CafeMarkt PDP galerilerinden ek ürün fotoğrafları indir + kataloga yaz.
 *
 *   node scripts/enrich-cafemarkt-galleries.mjs --dry-run --brands=Faema,Santos --limit=20
 *   node scripts/enrich-cafemarkt-galleries.mjs --brands=Faema,Santos,Animo,"Dito Sama" --min-gallery=2
 *   node scripts/enrich-cafemarkt-galleries.mjs --premium --apply
 *   node scripts/enrich-cafemarkt-galleries.mjs --all --apply --concurrency=4
 *
 * Kaynak: var/catalog değil — public/data/dept/*.json güncellenir, sonra rebuild.
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { collectValidPhotos, normalizeRel } from "./lib/image-enrich/photos.mjs";
import {
  cafemarktImageIdFromRel,
  canonicalLocalRelFromGalleryEntry,
  extractCafemarktGallery,
  fetchCafemarktHtml,
  preferBUrl,
} from "./lib/image-enrich/cafemarkt-gallery.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT_DIR = path.join(ROOT, "scripts/data/image-enrich");

const PREMIUM_BRANDS = [
  "Faema",
  "Santos",
  "Dito Sama",
  "Animo",
  "Blendtec",
  "Nuova Simonelli",
  "Berkel",
];

const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const MIN_BYTES = 8000;
const MIN_PX = 500;
const TARGET_PX = 1000;
const MAX_GALLERY = 10;

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const apply = argv.includes("--apply") || !dryRun;
const premium = argv.includes("--premium");
const allBrands = argv.includes("--all");
const skipDownload = argv.includes("--discover-only");
const brandsArg = argv.find((a) => a.startsWith("--brands="));
const limitArg = argv.find((a) => a.startsWith("--limit="));
const minGalleryArg = argv.find((a) => a.startsWith("--min-gallery="));
const delayArg = argv.find((a) => a.startsWith("--delay="));
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="));
const onlySingle = !argv.includes("--include-multi");

const brands = brandsArg
  ? brandsArg
      .slice("--brands=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : allBrands
    ? []
    : PREMIUM_BRANDS;
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 0) : 0;
const minGallery = minGalleryArg ? Math.max(2, Number(minGalleryArg.split("=")[1]) || 2) : 2;
const delayMs = delayArg ? Math.max(50, Number(delayArg.split("=")[1]) || 250) : 250;
const concurrency = concurrencyArg
  ? Math.max(1, Math.min(8, Number(concurrencyArg.split("=")[1]) || 1))
  : 1;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function rowKey(row) {
  if (row.id) return `id:${row.id}`;
  return `sku:${row.dept || ""}|${row.sku || row.model || ""}|${row.name || ""}`;
}

function loadDeptRows() {
  /** @type {{ file: string, rows: any[] }[]} */
  const packs = [];
  for (const file of fs.readdirSync(DEPT_DIR).sort()) {
    if (!file.endsWith(".json") || file.includes("_items.json")) continue;
    const abs = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(abs, "utf8"));
    if (!Array.isArray(rows)) continue;
    packs.push({ file, rows });
  }
  return packs;
}

function brandMatch(rowBrand, wanted) {
  const a = String(rowBrand || "").toLowerCase();
  const b = String(wanted || "").toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

async function downloadProcessed(url, destAbs) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) {
    // -B yoksa orijinal URL dene
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) return null;
  let pipeline = sharp(buf, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (w < 64 || h < 64) return null;
  if (w < MIN_PX || h < MIN_PX || w < TARGET_PX || h < TARGET_PX) {
    const side = Math.max(MIN_PX, Math.min(TARGET_PX, Math.max(w, h, MIN_PX)));
    pipeline = sharp(buf, { failOn: "none" })
      .rotate()
      .resize({
        width: side,
        height: side,
        fit: "inside",
        withoutEnlargement: false,
      });
  } else {
    pipeline = sharp(buf, { failOn: "none" }).rotate();
  }
  const out = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  if (out.length < MIN_BYTES) return null;
  await fsp.mkdir(path.dirname(destAbs), { recursive: true });
  await fsp.writeFile(destAbs, out);
  return out.length;
}

async function processRow(row, stats) {
  const url = String(row.cafemarkt_url || "").trim();
  if (!url) return null;

  const existing = collectValidPhotos(row.images);
  if (existing.length >= minGallery && existing.length >= 3) {
    stats.skippedEnough++;
    return null;
  }

  let html;
  try {
    html = await fetchCafemarktHtml(url);
  } catch (e) {
    stats.errors.push({ sku: row.sku, url, err: String(e.message || e) });
    return null;
  }

  const gallery = extractCafemarktGallery(html, url);
  if (gallery.length < minGallery) {
    stats.skippedNoGallery++;
    return {
      sku: row.sku,
      url,
      galleryFound: gallery.length,
      applied: false,
      reason: "gallery_lt_min",
    };
  }

  const newRels = [];
  const seenIds = new Set(
    existing.map((p) => cafemarktImageIdFromRel(p)).filter(Boolean),
  );

  for (const entry of gallery.slice(0, MAX_GALLERY)) {
    const rel = canonicalLocalRelFromGalleryEntry(entry);
    const abs = path.join(ROOT, "public", rel);
    const prefer = preferBUrl(entry);

    if (entry.id && seenIds.has(entry.id)) {
      continue; // aynı CM id zaten katalogda (O/K/B fark etmez)
    }

    if (skipDownload || dryRun) {
      newRels.push(rel);
      if (entry.id) seenIds.add(entry.id);
      continue;
    }

    if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES) {
      newRels.push(rel);
      if (entry.id) seenIds.add(entry.id);
      continue;
    }

    let bytes = await downloadProcessed(prefer, abs);
    if (!bytes && prefer !== entry.url) {
      bytes = await downloadProcessed(entry.url, abs);
    }
    if (!bytes) {
      stats.downloadFail++;
      continue;
    }
    stats.downloaded++;
    newRels.push(rel);
    if (entry.id) seenIds.add(entry.id);
    await sleep(80);
  }

  // Mevcut hero’yu koru; yeni id’leri ekle (path + CM id tekilleştir)
  const merged = [];
  const seenPath = new Set();
  const seenMergeIds = new Set();
  for (const p of [...existing, ...newRels]) {
    const n = normalizeRel(p);
    if (!n) continue;
    const pathKey = n.toLowerCase();
    const id = cafemarktImageIdFromRel(n);
    if (seenPath.has(pathKey)) continue;
    if (id && seenMergeIds.has(id)) continue;
    seenPath.add(pathKey);
    if (id) seenMergeIds.add(id);
    merged.push(n);
    if (merged.length >= MAX_GALLERY) break;
  }

  if (merged.length <= existing.length) {
    stats.skippedNoNew++;
    return {
      sku: row.sku,
      url,
      galleryFound: gallery.length,
      applied: false,
      reason: "no_new_files",
      photos: merged.length,
    };
  }

  if (apply && !dryRun && !skipDownload) {
    row.images = merged;
    stats.updated++;
  } else {
    stats.wouldUpdate++;
  }

  return {
    sku: row.sku,
    brand: row.brand,
    url,
    galleryFound: gallery.length,
    before: existing.length,
    after: merged.length,
    applied: apply && !dryRun && !skipDownload,
    images: merged,
  };
}

async function mapPool(items, size, worker) {
  let idx = 0;
  const out = new Array(items.length);
  async function run() {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => run()));
  return out;
}

async function main() {
  const packs = loadDeptRows();
  const brandSet = new Set(brands.map((b) => b.toLowerCase()));
  const filterByBrand = !allBrands && brandSet.size > 0;

  /** @type {any[]} */
  const targets = [];
  for (const pack of packs) {
    for (const row of pack.rows) {
      if (!row?.cafemarkt_url) continue;
      if (filterByBrand && ![...brandSet].some((b) => brandMatch(row.brand, b))) continue;
      const photos = collectValidPhotos(row.images);
      if (photos.length >= 4) continue;
      if (onlySingle && photos.length >= 2) continue;
      targets.push({ pack, row });
    }
  }

  // Marka başına dağılım — büyükleri önce işle (ROI)
  targets.sort((a, b) => {
    const ba = String(a.row.brand || "");
    const bb = String(b.row.brand || "");
    if (ba !== bb) return ba.localeCompare(bb, "tr");
    return String(a.row.sku || "").localeCompare(String(b.row.sku || ""));
  });

  const slice = limit ? targets.slice(0, limit) : targets;
  console.log(
    JSON.stringify(
      {
        mode: allBrands ? "all-cafemarkt-url" : premium ? "premium" : "brands",
        brands: allBrands ? ["*"] : brands,
        targets: targets.length,
        processing: slice.length,
        dryRun,
        apply: apply && !dryRun,
        minGallery,
        skipDownload,
        concurrency,
        onlySingle,
      },
      null,
      2,
    ),
  );

  const stats = {
    updated: 0,
    wouldUpdate: 0,
    downloaded: 0,
    downloadFail: 0,
    skippedEnough: 0,
    skippedNoGallery: 0,
    skippedNoNew: 0,
    errors: [],
  };
  const results = [];
  const dirtyFiles = new Set();
  let done = 0;

  await mapPool(slice, concurrency, async ({ pack, row }) => {
    const r = await processRow(row, stats);
    if (r) results.push(r);
    if (r?.applied) dirtyFiles.add(pack.file);
    done += 1;
    if (done % 25 === 0 || done === slice.length) {
      console.log(
        `[enrich-cm] ${done}/${slice.length} updated=${stats.updated} would=${stats.wouldUpdate} dl=${stats.downloaded} noGal=${stats.skippedNoGallery} err=${stats.errors.length}`,
      );
    }
    if (delayMs > 0) await sleep(delayMs);
    return r;
  });

  if (dirtyFiles.size && apply && !dryRun) {
    for (const file of dirtyFiles) {
      const pack = packs.find((p) => p.file === file);
      if (!pack) continue;
      const abs = path.join(DEPT_DIR, file);
      fs.writeFileSync(abs, JSON.stringify(pack.rows), "utf8");
      console.log("[enrich-cm] wrote", file);
    }
    const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (rebuild.status !== 0) {
      console.error(rebuild.stderr || rebuild.stdout);
      throw new Error("rebuild-ekipmanlar failed");
    }
    console.log(rebuild.stdout.trim());
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(
    REPORT_DIR,
    `cafemarkt-gallery-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  const latestPath = path.join(REPORT_DIR, "cafemarkt-gallery-latest.json");
  const report = {
    generatedAt: new Date().toISOString(),
    mode: allBrands ? "all" : premium ? "premium" : "brands",
    brands: allBrands ? ["*"] : brands,
    dryRun,
    concurrency,
    stats: { ...stats, errors: stats.errors.slice(0, 100) },
    results,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        report: path.relative(ROOT, reportPath),
        stats: {
          ...stats,
          errors: stats.errors.length,
        },
        sample: results.filter((r) => (r.after || 0) > (r.before || 0)).slice(0, 8),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("[enrich-cm]", e);
  process.exit(1);
});
