#!/usr/bin/env node
/**
 * GMC 500×500: CafeMarkt hash/küçük hero görsellerini witcdn -B ile yerinde yükselt.
 *
 *   node scripts/fix-cafemarkt-gmc-hero-images.mjs --dry-run --limit=20
 *   node scripts/fix-cafemarkt-gmc-hero-images.mjs --limit=50 --concurrency=4
 *   node scripts/fix-cafemarkt-gmc-hero-images.mjs --concurrency=6 --delay=60
 *   node scripts/fix-cafemarkt-gmc-hero-images.mjs --upscale-fallback-only
 *
 * Strateji:
 * 1) public/data/dept/*.json içinden images/catalog/cafemarkt/* hero’ları topla
 * 2) Yerel dosya <500×500 ise (benzersiz path) CafeMarkt PDP → witcdn -B indir
 * 3) Aynı path’e ≥500 (hedef 1000) JPEG yaz — feed URL değişmez
 * 4) -B yoksa mevcut dosyayı upscale et (son çare)
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  extractCafemarktGallery,
  fetchCafemarktHtml,
  preferBUrl,
} from "./lib/image-enrich/cafemarkt-gallery.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT_DIR = path.join(ROOT, "scripts/data/image-enrich");

const MIN_PX = 500;
const TARGET_PX = 1000;
const MIN_BYTES = 4000;
const UA = "Mozilla/5.0 (Equsto-GMC-Hero; +https://equsto.com)";

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const upscaleOnly = argv.includes("--upscale-fallback-only");
const limitArg = argv.find((a) => a.startsWith("--limit="));
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="));
const delayArg = argv.find((a) => a.startsWith("--delay="));
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 0) : 0;
const concurrency = concurrencyArg
  ? Math.max(1, Math.min(12, Number(concurrencyArg.split("=")[1]) || 1))
  : 5;
const delayMs = delayArg ? Math.max(0, Number(delayArg.split("=")[1]) || 0) : 50;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeRel(raw) {
  return String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function isCafemarktHero(rel) {
  const r = normalizeRel(rel).toLowerCase();
  return r.startsWith("images/catalog/cafemarkt/") && /\.(jpe?g|png|webp)$/i.test(r);
}

async function localDims(abs) {
  try {
    const meta = await sharp(abs, { failOn: "none" }).rotate().metadata();
    return { w: meta.width || 0, h: meta.height || 0 };
  } catch {
    return null;
  }
}

async function processBufferToMinJpeg(buf) {
  if (!buf?.length || buf.length < MIN_BYTES) return null;
  let pipeline = sharp(buf, { failOn: "none" }).rotate();
  const meta = await pipeline.metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (w < 32 || h < 32) return null;

  // GMC: her iki kenar ≥500. fit:inside kare kutuda kısa kenarı yine <500 bırakır.
  if (w < MIN_PX || h < MIN_PX || w < TARGET_PX || h < TARGET_PX) {
    const scale = Math.max(MIN_PX / w, MIN_PX / h, TARGET_PX / Math.max(w, h));
    const tw = Math.max(MIN_PX, Math.round(w * scale));
    const th = Math.max(MIN_PX, Math.round(h * scale));
    pipeline = sharp(buf, { failOn: "none" })
      .rotate()
      .resize({
        width: tw,
        height: th,
        fit: "fill",
        withoutEnlargement: false,
      });
  } else {
    pipeline = sharp(buf, { failOn: "none" }).rotate();
  }

  const out = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const check = await sharp(out, { failOn: "none" }).metadata();
  if ((check.width || 0) < MIN_PX || (check.height || 0) < MIN_PX) return null;
  return out;
}

async function downloadUrl(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct && !/^image\//i.test(ct) && !/octet-stream/i.test(ct)) return null;
  return Buffer.from(await res.arrayBuffer());
}

function loadHeroJobs() {
  /** @type {Map<string, { rel: string, urls: Set<string>, skus: string[] }>} */
  const map = new Map();

  for (const file of fs.readdirSync(DEPT_DIR).sort()) {
    if (!file.endsWith(".json") || file.includes("_items.json")) continue;
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const row of rows) {
      const imgs = Array.isArray(row.images) ? row.images : [];
      if (!imgs.length) continue;
      const rel = normalizeRel(imgs[0]);
      if (!isCafemarktHero(rel)) continue;
      let job = map.get(rel);
      if (!job) {
        job = { rel, urls: new Set(), skus: [] };
        map.set(rel, job);
      }
      const u = String(row.cafemarkt_url || "").trim();
      if (u) job.urls.add(u);
      if (row.sku && job.skus.length < 3) job.skus.push(String(row.sku));
    }
  }
  return [...map.values()];
}

async function fetchBestBBuffer(pageUrl) {
  const html = await fetchCafemarktHtml(pageUrl);
  const gallery = extractCafemarktGallery(html, pageUrl);
  if (!gallery.length) return { buf: null, reason: "no_gallery", gallery: 0 };

  for (const entry of gallery.slice(0, 6)) {
    const prefer = preferBUrl(entry);
    let buf = await downloadUrl(prefer);
    if (!buf && prefer !== entry.url) buf = await downloadUrl(entry.url);
    if (!buf) continue;
    const out = await processBufferToMinJpeg(buf);
    if (out) return { buf: out, reason: "b_ok", gallery: gallery.length, src: prefer };
  }
  return { buf: null, reason: "download_fail", gallery: gallery.length };
}

async function upscaleLocal(abs) {
  const buf = await fsp.readFile(abs);
  return processBufferToMinJpeg(buf);
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
  const all = loadHeroJobs();
  /** @type {typeof all} */
  const small = [];

  for (const job of all) {
    const abs = path.join(ROOT, "public", job.rel);
    if (!fs.existsSync(abs)) {
      job._skip = "missing_file";
      continue;
    }
    const d = await localDims(abs);
    if (!d) {
      job._skip = "unreadable";
      continue;
    }
    if (d.w >= MIN_PX && d.h >= MIN_PX) {
      job._skip = "already_ok";
      continue;
    }
    job.before = d;
    small.push(job);
  }

  const slice = limit ? small.slice(0, limit) : small;
  console.log(
    JSON.stringify(
      {
        totalHeroes: all.length,
        small: small.length,
        processing: slice.length,
        dryRun,
        upscaleOnly,
        concurrency,
        delayMs,
        minPx: MIN_PX,
        targetPx: TARGET_PX,
      },
      null,
      2,
    ),
  );

  const stats = {
    replacedFromB: 0,
    upscaledLocal: 0,
    failed: 0,
    skippedNoUrl: 0,
    errors: [],
  };
  const results = [];

  await mapPool(slice, concurrency, async (job) => {
    const abs = path.join(ROOT, "public", job.rel);
    const urls = [...job.urls];
    let outcome = {
      rel: job.rel,
      before: job.before,
      skus: job.skus,
      method: null,
      after: null,
      ok: false,
    };

    try {
      let outBuf = null;
      let method = null;

      if (!upscaleOnly && urls.length) {
        for (const pageUrl of urls.slice(0, 2)) {
          try {
            const got = await fetchBestBBuffer(pageUrl);
            if (got.buf) {
              outBuf = got.buf;
              method = "cafemarkt_b";
              outcome.src = got.src;
              outcome.gallery = got.gallery;
              break;
            }
            outcome.galleryFail = got.reason;
          } catch (e) {
            outcome.fetchErr = String(e.message || e).slice(0, 120);
          }
          if (delayMs) await sleep(delayMs);
        }
      } else if (!urls.length) {
        stats.skippedNoUrl++;
      }

      if (!outBuf) {
        outBuf = await upscaleLocal(abs);
        method = outBuf ? "upscale_local" : null;
      }

      if (!outBuf) {
        stats.failed++;
        outcome.ok = false;
        outcome.method = "failed";
        results.push(outcome);
        return;
      }

      if (!dryRun) {
        await fsp.writeFile(abs, outBuf);
      }

      const after = dryRun
        ? await sharp(outBuf, { failOn: "none" }).metadata()
        : await localDims(abs);
      outcome.after = { w: after.width || after.w || 0, h: after.height || after.h || 0 };
      outcome.method = method;
      outcome.ok =
        (outcome.after.w || 0) >= MIN_PX && (outcome.after.h || 0) >= MIN_PX;

      if (method === "cafemarkt_b") stats.replacedFromB++;
      else if (method === "upscale_local") stats.upscaledLocal++;
      if (!outcome.ok) stats.failed++;
      results.push(outcome);
    } catch (e) {
      stats.failed++;
      stats.errors.push({ rel: job.rel, err: String(e.message || e).slice(0, 160) });
      outcome.ok = false;
      outcome.method = "error";
      results.push(outcome);
    }

    if (delayMs) await sleep(delayMs);
  });

  await fsp.mkdir(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(REPORT_DIR, `gmc-hero-fix-${stamp}.json`);
  const summary = {
    at: new Date().toISOString(),
    dryRun,
    upscaleOnly,
    stats,
    processing: slice.length,
    ok: results.filter((r) => r.ok).length,
    sample: results.filter((r) => r.ok).slice(0, 15),
    failSample: results.filter((r) => !r.ok).slice(0, 20),
  };
  await fsp.writeFile(reportPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, reportPath: path.relative(ROOT, reportPath) }, null, 2));

  if (stats.failed > 0 && stats.replacedFromB + stats.upscaledLocal === 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
