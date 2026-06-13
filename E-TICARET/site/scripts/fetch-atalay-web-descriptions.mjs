#!/usr/bin/env node
/**
 * atalay.com.tr — tüm ürün Özellikler + Teknik Özellikler
 *
 *   node scripts/fetch-atalay-web-descriptions.mjs
 *   node scripts/fetch-atalay-web-descriptions.mjs --refresh-index
 *   node scripts/fetch-atalay-web-descriptions.mjs --dry-run --limit 20
 *   node scripts/fetch-atalay-web-descriptions.mjs --sku=EAEI-360
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  ATALAY_BRAND,
  applyAtalayWebDescription,
  isAtalayBrand,
  matchAtalayEntry,
  norm,
} from "./lib/atalay-enrich.mjs";
import { parseAtalayPdpHtml } from "./lib/atalay-pdp-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const WEB_INDEX = path.join(ROOT, "scripts/data/atalay-web-index.json");
const REPORT = path.join(ROOT, "scripts/data/atalay-web-desc-report.json");
const BASE = "https://www.atalay.com.tr";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const FETCH_DELAY_MS = 120;

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const refreshIndex = process.argv.includes("--refresh-index");
const indexOnly = process.argv.includes("--index-only");
const skuFilter = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1]?.trim();
const limitArg = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fetchHtml(url) {
  const r = spawnSync("curl.exe", ["-sL", "-A", UA, url], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0 && !r.stdout) throw new Error(`curl failed ${url}`);
  return r.stdout || "";
}

function abs(href) {
  if (!href || href.startsWith("http")) return href;
  if (href.startsWith("/")) return BASE + href;
  return `${BASE}/${href}`;
}

function extractLinks(html) {
  return [...String(html || "").matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
}

function isCategory(href) {
  return /\/TR\/C\//i.test(href) && !/kategori\.html/i.test(href);
}

function isProduct(href) {
  return /\/TR\/urun-detay\//i.test(href);
}

function crawlProductUrls() {
  const queue = [{ url: `${BASE}/TR/C/kategori.html`, depth: 0 }];
  const seenCat = new Set();
  const products = new Set();
  while (queue.length) {
    const { url, depth } = queue.shift();
    if (seenCat.has(url)) continue;
    seenCat.add(url);
    const html = fetchHtml(url);
    for (const href of extractLinks(html)) {
      const full = abs(href).split("#")[0];
      if (isProduct(full)) products.add(full);
      else if (depth < 4 && isCategory(href)) {
        const u = abs(href).split("#")[0];
        if (!seenCat.has(u)) queue.push({ url: u, depth: depth + 1 });
      }
    }
  }
  return [...products].sort();
}

function writeJsonAtomic(dest, data) {
  const json = JSON.stringify(data);
  const tmp = `${dest}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, json, "utf8");
    fs.renameSync(tmp, dest);
  } catch (err) {
    if (err?.code === "EPERM" || err?.code === "EBUSY") {
      fs.writeFileSync(dest, json, "utf8");
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      return;
    }
    throw err;
  }
}

async function buildWebIndex() {
  if (fs.existsSync(WEB_INDEX) && !refreshIndex) {
    return JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  }

  console.log("[atalay-web] kategori taraması…");
  const urls = crawlProductUrls();
  console.log(`[atalay-web] ${urls.length} ürün URL bulundu`);

  const entries = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      const html = fetchHtml(url);
      const parsed = parseAtalayPdpHtml(html, url);
      if (!parsed) continue;
      entries.push({
        ...parsed,
        hay: norm(parsed.title),
      });
    } catch (err) {
      console.warn(`[atalay-web] parse fail ${url} — ${err.message}`);
    }
    if ((i + 1) % 25 === 0 || i === urls.length - 1) {
      console.log(`[atalay-web] fetch ${i + 1}/${urls.length} — parsed:${entries.length}`);
      if (!dryRun && refreshIndex) {
        writeJsonAtomic(WEB_INDEX, {
          builtAt: new Date().toISOString(),
          partial: true,
          count: entries.length,
          entries,
        });
      }
    }
    await sleep(FETCH_DELAY_MS);
  }

  const index = {
    builtAt: new Date().toISOString(),
    count: entries.length,
    crawledUrls: urls.length,
    entries,
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(WEB_INDEX), { recursive: true });
    writeJsonAtomic(WEB_INDEX, index);
  }

  console.log(`[atalay-web] indeks hazır — ${index.count} ürün`);
  return index;
}

function loadAtalayRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (!isAtalayBrand(row) && row.brand !== ATALAY_BRAND) continue;
      const sku = String(row.sku || row.model || "").trim();
      if (!sku) continue;
      if (skuFilter && norm(sku) !== norm(skuFilter)) continue;
      rows.push({ row, file: f, sku });
    }
  }
  return limitArg > 0 ? rows.slice(0, limitArg) : rows;
}

function saveDepts(entries) {
  const byFile = new Map();
  for (const { row, file } of entries) {
    if (!byFile.has(file)) byFile.set(file, new Map());
    byFile.get(file).set(row.sku || row.model, row);
  }
  for (const [file, map] of byFile) {
    const dest = path.join(DEPT_DIR, file);
    const full = JSON.parse(fs.readFileSync(dest, "utf8"));
    const out = full.map((r) => {
      const key = r.sku || r.model;
      return map.has(key) ? map.get(key) : r;
    });
    if (!dryRun) writeJsonAtomic(dest, out);
  }
}

async function applyToCatalog(index) {
  const entries = loadAtalayRows();
  if (!entries.length) {
    console.log("[atalay-web] Atalay satırı yok");
    process.exit(1);
  }

  let ok = 0;
  let skipped = 0;
  const missing = [];

  for (let i = 0; i < entries.length; i++) {
    const { row, sku } = entries[i];

    if (
      !force &&
      row.atalay_web_description &&
      row.description &&
      String(row.atalay_description_at || "") >= "2026-06-13"
    ) {
      ok++;
      skipped++;
      continue;
    }

    const payload = matchAtalayEntry(index, row);
    if (payload?.description || payload?.bullets?.length) {
      applyAtalayWebDescription(row, payload);
      ok++;
    } else {
      missing.push(sku);
    }

    if ((i + 1) % 100 === 0 || i === entries.length - 1) {
      console.log(`[atalay-web] ${i + 1}/${entries.length} eşleşen:${ok} eksik:${missing.length}`);
    }
  }

  const report = {
    at: new Date().toISOString(),
    indexCount: index.count,
    catalogRows: entries.length,
    matched: ok,
    skippedExisting: skipped,
    missing: missing.length,
    missingSkus: missing.slice(0, 200),
  };

  console.log(
    `[atalay-web] tamam — eşleşen:${ok}/${entries.length} eksik:${missing.length} (atlandı:${skipped})`,
  );

  if (!dryRun) {
    saveDepts(entries);
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } else {
    console.log("[atalay-web] dry-run — dept/ekipmanlar yazılmadı");
  }

  return report;
}

async function main() {
  console.log("[atalay-web] başlatılıyor…");
  const index = await buildWebIndex();
  if (indexOnly) {
    console.log("[atalay-web] --index-only — katalog güncellenmedi");
    return;
  }
  await applyToCatalog(index);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
