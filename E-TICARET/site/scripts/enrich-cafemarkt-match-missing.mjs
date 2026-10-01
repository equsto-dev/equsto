#!/usr/bin/env node
/**
 * cafemarkt_url olmayan (veya tek foto) ürünleri CafeMarkt aramasından eşle,
 * PDP galerisi ≥2 ise indir + kataloga yaz.
 *
 *   node scripts/enrich-cafemarkt-match-missing.mjs --brands=Brema,Scotsman --limit=40 --dry-run
 *   node scripts/enrich-cafemarkt-match-missing.mjs --brands=Brema --apply --concurrency=3
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
import { CAFE_UA } from "./lib/cafemarkt-fetch.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT_DIR = path.join(ROOT, "scripts/data/image-enrich");

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const apply = argv.includes("--apply") || !dryRun;
const brandsArg = argv.find((a) => a.startsWith("--brands="));
const limitArg = argv.find((a) => a.startsWith("--limit="));
const delayArg = argv.find((a) => a.startsWith("--delay="));
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="));
const minGalleryArg = argv.find((a) => a.startsWith("--min-gallery="));

const brands = brandsArg
  ? brandsArg
      .slice("--brands=".length)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : [];
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 0) : 0;
const delayMs = delayArg ? Math.max(50, Number(delayArg.split("=")[1]) || 200) : 200;
const concurrency = concurrencyArg
  ? Math.max(1, Math.min(6, Number(concurrencyArg.split("=")[1]) || 1))
  : 2;
const minGallery = minGalleryArg ? Math.max(2, Number(minGalleryArg.split("=")[1]) || 2) : 2;
const MIN_BYTES = 8000;
const MIN_PX = 500;
const TARGET_PX = 1000;
const MAX_GALLERY = 10;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function brandMatch(rowBrand, wanted) {
  const a = String(rowBrand || "").toLowerCase();
  const b = String(wanted || "").toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

function normHay(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

function loadDeptRows() {
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

async function searchCafemarkt(query) {
  const url = `https://www.cafemarkt.com/arama?q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": CAFE_UA, "Accept-Language": "tr-TR,tr;q=0.9" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  /** @type {{ url: string, name: string, brand: string, code: string }[]} */
  const hits = [];
  const re =
    /PRODUCT_DATA\.push\(JSON\.parse\('((?:\\'|[^'])*)'\)\)/g;
  let m;
  while ((m = re.exec(html))) {
    try {
      const raw = m[1].replace(/\\'/g, "'").replace(/\\\\/g, "\\");
      const j = JSON.parse(raw);
      const slug = String(j.url || "").replace(/^\/+/, "");
      if (!slug) continue;
      hits.push({
        url: `https://www.cafemarkt.com/${slug}`,
        name: String(j.name || ""),
        brand: String(j.brand || ""),
        code: String(j.code || j.supplier_code || ""),
      });
    } catch {
      /* skip */
    }
  }
  // fallback: href product links from ItemList
  if (!hits.length) {
    for (const hm of html.matchAll(
      /"url"\s*:\s*"https:\\\/\\\/www\.cafemarkt\.com\\\/([^"]+)"/gi,
    )) {
      const slug = hm[1].replace(/\\\//g, "/");
      if (!slug || slug.includes("arama")) continue;
      hits.push({
        url: `https://www.cafemarkt.com/${slug}`,
        name: slug,
        brand: "",
        code: "",
      });
    }
  }
  const seen = new Set();
  return hits.filter((h) => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });
}

function scoreMatch(row, hit) {
  const model = normHay(row.model || row.sku || "");
  const sku = normHay(row.sku || row.urun_kodu || "");
  const name = normHay(row.name || "");
  const hName = normHay(hit.name);
  const hCode = normHay(hit.code);
  const hUrl = normHay(hit.url);
  let s = 0;
  if (model && (hName.includes(model) || hUrl.includes(model) || hCode.includes(model))) s += 50;
  if (sku && (hCode.includes(sku) || hUrl.includes(sku) || hName.includes(sku))) s += 40;
  // model tokens length>=3
  for (const tok of String(row.model || row.sku || "").split(/[\s./_-]+/)) {
    const t = normHay(tok);
    if (t.length >= 3 && (hName.includes(t) || hUrl.includes(t))) s += Math.min(t.length, 8);
  }
  if (hit.brand && brandMatch(row.brand, hit.brand)) s += 25;
  else if (hit.brand && !brandMatch(row.brand, hit.brand)) s -= 40;
  // brand word in url
  const brandTok = normHay(String(row.brand || "").split(/\s+/)[0] || "");
  if (brandTok.length >= 4 && hUrl.includes(brandTok)) s += 15;
  if (name && hName && name.slice(0, 12) === hName.slice(0, 12)) s += 10;
  return s;
}

async function downloadProcessed(url, destAbs) {
  const res = await fetch(url, { headers: { "User-Agent": CAFE_UA } });
  if (!res.ok) return null;
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
      .resize({ width: side, height: side, fit: "inside", withoutEnlargement: false });
  } else {
    pipeline = sharp(buf, { failOn: "none" }).rotate();
  }
  const out = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  if (out.length < MIN_BYTES) return null;
  await fsp.mkdir(path.dirname(destAbs), { recursive: true });
  await fsp.writeFile(destAbs, out);
  return out.length;
}

async function resolveHit(row) {
  const brand = String(row.brand || "").split(/\s+/)[0] || "";
  const model = String(row.model || row.sku || "").trim();
  const queries = [
    `${brand} ${model}`.trim(),
    model,
    String(row.name || "").split(/[,(-]/)[0].trim(),
  ].filter((q) => q && q.length >= 3);

  let best = null;
  let bestScore = 0;
  for (const q of queries) {
    const hits = await searchCafemarkt(q);
    for (const hit of hits.slice(0, 8)) {
      const sc = scoreMatch(row, hit);
      if (sc > bestScore) {
        bestScore = sc;
        best = hit;
      }
    }
    if (bestScore >= 55) break;
    await sleep(80);
  }
  if (!best || bestScore < 45) return null;
  return { hit: best, score: bestScore };
}

async function enrichRow(row, stats) {
  const existing = collectValidPhotos(row.images);
  let cmUrl = String(row.cafemarkt_url || "").trim();
  let matched = null;

  if (!cmUrl) {
    matched = await resolveHit(row);
    if (!matched) {
      stats.noMatch++;
      return { sku: row.sku || row.model, applied: false, reason: "no_match" };
    }
    cmUrl = matched.hit.url;
    stats.matched++;
  }

  let html;
  try {
    html = await fetchCafemarktHtml(cmUrl);
  } catch (e) {
    stats.errors.push({ sku: row.sku, err: String(e.message || e) });
    return null;
  }

  const gallery = extractCafemarktGallery(html, cmUrl);
  if (gallery.length < minGallery) {
    // URL eşleşti ama galeri tek — yine de url yaz (ileride işe yarar)
    if (matched && apply && !dryRun && !row.cafemarkt_url) {
      row.cafemarkt_url = cmUrl;
      stats.urlOnly++;
    }
    stats.skippedNoGallery++;
    return {
      sku: row.sku || row.model,
      url: cmUrl,
      score: matched?.score,
      galleryFound: gallery.length,
      applied: false,
      reason: "gallery_lt_min",
      urlSaved: Boolean(matched && apply && !dryRun),
    };
  }

  const newRels = [];
  const seenIds = new Set(existing.map((p) => cafemarktImageIdFromRel(p)).filter(Boolean));

  for (const entry of gallery.slice(0, MAX_GALLERY)) {
    const rel = canonicalLocalRelFromGalleryEntry(entry);
    const abs = path.join(ROOT, "public", rel);
    if (entry.id && seenIds.has(entry.id)) continue;
    if (dryRun) {
      newRels.push(rel);
      if (entry.id) seenIds.add(entry.id);
      continue;
    }
    if (fs.existsSync(abs) && fs.statSync(abs).size >= MIN_BYTES) {
      newRels.push(rel);
      if (entry.id) seenIds.add(entry.id);
      continue;
    }
    let bytes = await downloadProcessed(preferBUrl(entry), abs);
    if (!bytes && preferBUrl(entry) !== entry.url) {
      bytes = await downloadProcessed(entry.url, abs);
    }
    if (!bytes) {
      stats.downloadFail++;
      continue;
    }
    stats.downloaded++;
    newRels.push(rel);
    if (entry.id) seenIds.add(entry.id);
    await sleep(60);
  }

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
      sku: row.sku || row.model,
      url: cmUrl,
      galleryFound: gallery.length,
      applied: false,
      reason: "no_new_files",
    };
  }

  if (apply && !dryRun) {
    row.images = merged;
    if (!row.cafemarkt_url) row.cafemarkt_url = cmUrl;
    stats.updated++;
  } else {
    stats.wouldUpdate++;
  }

  return {
    sku: row.sku || row.model,
    brand: row.brand,
    url: cmUrl,
    score: matched?.score,
    galleryFound: gallery.length,
    before: existing.length,
    after: merged.length,
    applied: apply && !dryRun,
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
  if (!brands.length) {
    console.error("Usage: --brands=Brema,Scotsman[,...]");
    process.exit(1);
  }
  const packs = loadDeptRows();
  const targets = [];
  for (const pack of packs) {
    for (const row of pack.rows) {
      if (!brands.some((b) => brandMatch(row.brand, b))) continue;
      const photos = collectValidPhotos(row.images);
      if (photos.length >= 2) continue;
      targets.push({ pack, row });
    }
  }
  const slice = limit ? targets.slice(0, limit) : targets;
  console.log(
    JSON.stringify(
      { brands, targets: targets.length, processing: slice.length, dryRun, apply: apply && !dryRun, concurrency, minGallery },
      null,
      2,
    ),
  );

  const stats = {
    updated: 0,
    wouldUpdate: 0,
    downloaded: 0,
    downloadFail: 0,
    matched: 0,
    noMatch: 0,
    urlOnly: 0,
    skippedNoGallery: 0,
    skippedNoNew: 0,
    errors: [],
  };
  const results = [];
  const dirty = new Set();
  let done = 0;

  await mapPool(slice, concurrency, async ({ pack, row }) => {
    const r = await enrichRow(row, stats);
    if (r) results.push(r);
    if (r?.applied || r?.urlSaved) dirty.add(pack.file);
    done += 1;
    if (done % 10 === 0 || done === slice.length) {
      console.log(
        `[match-cm] ${done}/${slice.length} updated=${stats.updated} would=${stats.wouldUpdate} matched=${stats.matched} noGal=${stats.skippedNoGallery} noMatch=${stats.noMatch}`,
      );
    }
    await sleep(delayMs);
    return r;
  });

  if (dirty.size && apply && !dryRun) {
    for (const file of dirty) {
      const pack = packs.find((p) => p.file === file);
      if (!pack) continue;
      fs.writeFileSync(path.join(DEPT_DIR, file), JSON.stringify(pack.rows), "utf8");
      console.log("[match-cm] wrote", file);
    }
    const rebuild = spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      encoding: "utf8",
    });
    if (rebuild.status !== 0) {
      console.error(rebuild.stderr || rebuild.stdout);
      throw new Error("rebuild failed");
    }
    console.log(rebuild.stdout.trim());
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(
    REPORT_DIR,
    `cafemarkt-match-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  const report = { generatedAt: new Date().toISOString(), brands, dryRun, stats, results };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        report: path.relative(ROOT, reportPath),
        stats: { ...stats, errors: stats.errors.length },
        sample: results.filter((r) => r?.applied || (r?.after || 0) > (r?.before || 0)).slice(0, 10),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("[match-cm]", e);
  process.exit(1);
});
