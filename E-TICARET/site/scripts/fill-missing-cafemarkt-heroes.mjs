#!/usr/bin/env node
/**
 * Eksik CafeMarkt hero dosyalarını doldur (GMC 500×500).
 *
 * Kaynak sırası:
 *  1) CafeMarkt PDP witcdn -B (üretici katalog çekimi; filigranlıysa at)
 *  2) Üretici site görselleri (brand allowlist host; flickr/stock filigran yok)
 *
 *   node scripts/fill-missing-cafemarkt-heroes.mjs --dry-run --limit=10
 *   node scripts/fill-missing-cafemarkt-heroes.mjs --concurrency=6 --delay=40
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
  canonicalLocalRelFromGalleryEntry,
} from "./lib/image-enrich/cafemarkt-gallery.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT_DIR = path.join(ROOT, "scripts/data/image-enrich");

const MIN_PX = 500;
const TARGET_PX = 1000;
const MIN_BYTES = 5000;
const UA = "Mozilla/5.0 (Equsto-GMC-Fill; +https://equsto.com)";

/** Filigran / stok siteleri — asla kullanma */
const BLOCKED_HOST =
  /flickr\.|staticflickr|shutterstock|depositphotos|gettyimages|istockphoto|alamy|dreamstime|123rf|watermark|filigran/i;

/** Marka → resmi site host (opsiyonel arama) */
const BRAND_SITES = {
  santos: ["santos.fr", "www.santos.fr"],
  faema: ["faema.com", "www.faema.com", "groupe-cimbali.com"],
  "dito sama": ["ditosama.com", "www.ditosama.com"],
  animo: ["animo.eu", "www.animo.eu", "animo.nl"],
  kapp: ["kapp.com.tr", "www.kapp.com.tr"],
};

const argv = process.argv.slice(2);
const dryRun = argv.includes("--dry-run");
const limitArg = argv.find((a) => a.startsWith("--limit="));
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="));
const delayArg = argv.find((a) => a.startsWith("--delay="));
const limit = limitArg ? Math.max(1, Number(limitArg.split("=")[1]) || 0) : 0;
const concurrency = concurrencyArg
  ? Math.max(1, Math.min(10, Number(concurrencyArg.split("=")[1]) || 1))
  : 5;
const delayMs = delayArg ? Math.max(0, Number(delayArg.split("=")[1]) || 0) : 40;

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

function brandKey(brand) {
  return String(brand || "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** Köşe bandında anormal tekrarlayan kenar / yarı saydam overlay tahmini */
async function looksWatermarked(buf) {
  try {
    const { data, info } = await sharp(buf, { failOn: "none" })
      .rotate()
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    if (w < 80 || h < 80) return true;

    const band = Math.max(8, Math.round(Math.min(w, h) * 0.08));
    let edgeAlphaLow = 0;
    let edgePx = 0;
    const at = (x, y) => {
      const i = (y * w + x) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    };
    const visit = (x, y) => {
      const p = at(x, y);
      edgePx++;
      // yarı saydam filigran
      if (p.a > 20 && p.a < 220) edgeAlphaLow++;
    };
    for (let y = 0; y < band; y++) for (let x = 0; x < w; x++) visit(x, y);
    for (let y = h - band; y < h; y++) for (let x = 0; x < w; x++) visit(x, y);
    for (let y = band; y < h - band; y++) {
      for (let x = 0; x < band; x++) visit(x, y);
      for (let x = w - band; x < w; x++) visit(x, y);
    }
    const frac = edgeAlphaLow / Math.max(1, edgePx);
    return frac > 0.12;
  } catch {
    return false;
  }
}

async function processToMinJpeg(buf) {
  if (!buf?.length || buf.length < MIN_BYTES) return null;
  if (await looksWatermarked(buf)) return null;

  const meta = await sharp(buf, { failOn: "none" }).rotate().metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (w < 64 || h < 64) return null;

  let pipeline;
  if (w < MIN_PX || h < MIN_PX || w < TARGET_PX || h < TARGET_PX) {
    const scale = Math.max(MIN_PX / w, MIN_PX / h, TARGET_PX / Math.max(w, h));
    const tw = Math.max(MIN_PX, Math.round(w * scale));
    const th = Math.max(MIN_PX, Math.round(h * scale));
    pipeline = sharp(buf, { failOn: "none" })
      .rotate()
      .resize({ width: tw, height: th, fit: "fill", withoutEnlargement: false });
  } else {
    pipeline = sharp(buf, { failOn: "none" }).rotate();
  }

  const out = await pipeline.jpeg({ quality: 88, mozjpeg: true }).toBuffer();
  const check = await sharp(out, { failOn: "none" }).metadata();
  if ((check.width || 0) < MIN_PX || (check.height || 0) < MIN_PX) return null;
  if (await looksWatermarked(out)) return null;
  return out;
}

async function downloadUrl(url) {
  if (!url || BLOCKED_HOST.test(url)) return null;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*,*/*" },
    redirect: "follow",
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const finalUrl = String(res.url || url);
  if (BLOCKED_HOST.test(finalUrl)) return null;
  const ct = res.headers.get("content-type") || "";
  if (ct && !/^image\//i.test(ct) && !/octet-stream/i.test(ct)) return null;
  return Buffer.from(await res.arrayBuffer());
}

function loadMissingJobs() {
  /** @type {Map<string, { hero: string, urls: Set<string>, brand: string, skus: string[], packFiles: Set<string>, rowRefs: { file: string, index: number }[] }>} */
  const map = new Map();

  for (const file of fs.readdirSync(DEPT_DIR).sort()) {
    if (!file.endsWith(".json") || file.includes("_items.json")) continue;
    const abs = path.join(DEPT_DIR, file);
    const rows = JSON.parse(fs.readFileSync(abs, "utf8"));
    if (!Array.isArray(rows)) continue;
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const imgs = Array.isArray(row.images) ? row.images : [];
      if (!imgs.length) continue;
      const hero = normalizeRel(imgs[0]);
      if (!isCafemarktHero(hero)) continue;
      const local = path.join(ROOT, "public", hero);
      if (fs.existsSync(local) && fs.statSync(local).size >= MIN_BYTES) continue;

      let job = map.get(hero);
      if (!job) {
        job = {
          hero,
          urls: new Set(),
          brand: String(row.brand || ""),
          skus: [],
          packFiles: new Set(),
          rowRefs: [],
        };
        map.set(hero, job);
      }
      const u = String(row.cafemarkt_url || row.kaynak_url || "").trim();
      if (u) job.urls.add(u);
      if (row.sku && job.skus.length < 4) job.skus.push(String(row.sku));
      job.packFiles.add(file);
      job.rowRefs.push({ file, index });
    }
  }
  return [...map.values()];
}

async function fromCafemarkt(pageUrl) {
  const html = await fetchCafemarktHtml(pageUrl);
  const gallery = extractCafemarktGallery(html, pageUrl);
  if (!gallery.length) return { buf: null, rel: "", reason: "no_gallery" };

  for (const entry of gallery.slice(0, 8)) {
    const prefer = preferBUrl(entry);
    let buf = await downloadUrl(prefer);
    if (!buf && prefer !== entry.url) buf = await downloadUrl(entry.url);
    if (!buf) continue;
    const out = await processToMinJpeg(buf);
    if (!out) continue; // filigran / küçük
    const rel = canonicalLocalRelFromGalleryEntry(entry);
    return { buf: out, rel, reason: "cafemarkt_b", src: prefer };
  }
  return { buf: null, rel: "", reason: "cm_rejected_or_fail" };
}

function extractBrandImages(html, brand) {
  const hosts = BRAND_SITES[brandKey(brand)] || [];
  if (!hosts.length) return [];
  const urls = [
    ...String(html || "").matchAll(/https?:\/\/[^"'\\\s<>]+\.(?:jpe?g|png|webp)/gi),
  ].map((m) => m[0]);
  const out = [];
  for (const u of urls) {
    if (BLOCKED_HOST.test(u)) continue;
    try {
      const host = new URL(u).hostname.toLowerCase();
      if (!hosts.some((h) => host === h || host.endsWith(`.${h}`))) continue;
      if (/logo|icon|sprite|banner|favicon|placeholder/i.test(u)) continue;
      out.push(u);
    } catch {
      /* ignore */
    }
  }
  return [...new Set(out)];
}

async function fromBrandSite(brand, queryHint) {
  const hosts = BRAND_SITES[brandKey(brand)];
  if (!hosts?.length) return { buf: null, reason: "no_brand_site" };
  const q = encodeURIComponent(String(queryHint || "").slice(0, 80));
  const tryUrls = [
    `https://${hosts[0]}/?s=${q}`,
    `https://${hosts[0]}/en/?s=${q}`,
    `https://${hosts[0]}/en/search?q=${q}`,
  ];
  for (const page of tryUrls) {
    try {
      const res = await fetch(page, {
        headers: { "User-Agent": UA, "Accept-Language": "en,tr;q=0.8" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const imgs = extractBrandImages(html, brand);
      for (const imgUrl of imgs.slice(0, 10)) {
        const buf = await downloadUrl(imgUrl);
        if (!buf) continue;
        const out = await processToMinJpeg(buf);
        if (!out) continue;
        return { buf: out, reason: "brand_site", src: imgUrl };
      }
    } catch {
      /* next */
    }
  }
  return { buf: null, reason: "brand_fail" };
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
  const jobs = loadMissingJobs();
  const slice = limit ? jobs.slice(0, limit) : jobs;
  console.log(
    JSON.stringify(
      {
        missingUnique: jobs.length,
        processing: slice.length,
        dryRun,
        concurrency,
        delayMs,
      },
      null,
      2,
    ),
  );

  const stats = {
    filledCm: 0,
    filledBrand: 0,
    failed: 0,
    watermarkSkip: 0,
    catalogUpdates: 0,
  };
  const results = [];
  /** @type {Map<string, any[]>} */
  const dirtyPacks = new Map();

  await mapPool(slice, concurrency, async (job) => {
    const outcome = {
      hero: job.hero,
      brand: job.brand,
      skus: job.skus,
      ok: false,
      method: null,
    };
    try {
      let got = null;
      for (const pageUrl of [...job.urls].slice(0, 2)) {
        try {
          got = await fromCafemarkt(pageUrl);
          if (got.buf) break;
          if (got.reason === "cm_rejected_or_fail") stats.watermarkSkip++;
        } catch (e) {
          outcome.cmErr = String(e.message || e).slice(0, 100);
        }
        if (delayMs) await sleep(delayMs);
      }

      if (!got?.buf) {
        const hint = job.skus[0] || path.basename(job.hero);
        got = await fromBrandSite(job.brand, hint);
      }

      if (!got?.buf) {
        stats.failed++;
        outcome.method = "failed";
        results.push(outcome);
        return;
      }

      // Katalogdaki hero path’i koru (içerik -B kalitesinde). webp → jpg + path güncelle.
      let destRel = job.hero;
      if (/\.webp$/i.test(destRel)) {
        destRel = got.rel && /\.jpe?g$/i.test(got.rel)
          ? got.rel
          : destRel.replace(/\.webp$/i, ".jpg");
      }

      const abs = path.join(ROOT, "public", destRel);
      if (!dryRun) {
        await fsp.mkdir(path.dirname(abs), { recursive: true });
        await fsp.writeFile(abs, got.buf);
      }

      if (destRel !== job.hero) {
        for (const ref of job.rowRefs) {
          if (!dirtyPacks.has(ref.file)) {
            dirtyPacks.set(
              ref.file,
              JSON.parse(fs.readFileSync(path.join(DEPT_DIR, ref.file), "utf8")),
            );
          }
          const rows = dirtyPacks.get(ref.file);
          const row = rows[ref.index];
          if (!row || !Array.isArray(row.images)) continue;
          const next = [...row.images];
          next[0] = destRel;
          // tekilleştir
          row.images = [...new Set(next.map((x) => normalizeRel(x)).filter(Boolean))];
          stats.catalogUpdates++;
        }
      }

      outcome.ok = true;
      outcome.method = got.reason;
      outcome.dest = destRel;
      outcome.src = got.src;
      if (got.reason === "cafemarkt_b") stats.filledCm++;
      else stats.filledBrand++;
      results.push(outcome);
    } catch (e) {
      stats.failed++;
      outcome.method = "error";
      outcome.err = String(e.message || e).slice(0, 120);
      results.push(outcome);
    }
    if (delayMs) await sleep(delayMs);
  });

  if (!dryRun && dirtyPacks.size) {
    for (const [file, rows] of dirtyPacks) {
      await fsp.writeFile(path.join(DEPT_DIR, file), JSON.stringify(rows, null, 2) + "\n");
    }
  }

  await fsp.mkdir(REPORT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(REPORT_DIR, `gmc-missing-fill-${stamp}.json`);
  const summary = {
    at: new Date().toISOString(),
    dryRun,
    stats,
    processing: slice.length,
    ok: results.filter((r) => r.ok).length,
    failSample: results.filter((r) => !r.ok).slice(0, 25),
    okSample: results.filter((r) => r.ok).slice(0, 10),
  };
  await fsp.writeFile(reportPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ ...summary, reportPath: path.relative(ROOT, reportPath) }, null, 2));
  if (stats.failed && stats.filledCm + stats.filledBrand === 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
