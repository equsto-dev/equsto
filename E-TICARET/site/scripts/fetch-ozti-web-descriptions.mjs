#!/usr/bin/env node
/**
 * oztiryakiler.com.tr — tüm ürün açıklamaları (WP REST API)
 *
 *   node scripts/fetch-ozti-web-descriptions.mjs
 *   node scripts/fetch-ozti-web-descriptions.mjs --refresh-index
 *   node scripts/fetch-ozti-web-descriptions.mjs --refresh-index --resume
 *   node scripts/fetch-ozti-web-descriptions.mjs --index-only --refresh-index
 *   node scripts/fetch-ozti-web-descriptions.mjs --dry-run --limit 20
 *   node scripts/fetch-ozti-web-descriptions.mjs --sku=7865.N1.80908.10
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  OZTI_BRAND,
  applyOztiWebDescription,
  isOztiBrand,
  kodSoftKey,
  normKod,
} from "./lib/ozti-enrich.mjs";
import { isOztiTurkishProduct, parseOztiWpProduct } from "./lib/ozti-pdp-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const WEB_INDEX = path.join(ROOT, "scripts/data/ozti-web-index.json");
const REPORT = path.join(ROOT, "scripts/data/ozti-web-desc-report.json");
const API = "https://oztiryakiler.com.tr/wp-json/wp/v2/product";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const FETCH_TIMEOUT_MS = 45_000;
const MAX_RETRIES = 4;

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const refreshIndex = process.argv.includes("--refresh-index");
const resume = process.argv.includes("--resume");
const indexOnly = process.argv.includes("--index-only");
const skuFilter = process.argv.find((a) => a.startsWith("--sku="))?.split("=")[1]?.trim();
const limitArg = process.argv.includes("--limit")
  ? Number(process.argv[process.argv.indexOf("--limit") + 1])
  : 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const data = await res.json();
    return { data, headers: res.headers };
  } catch (err) {
    if (attempt >= MAX_RETRIES) throw err;
    console.warn(`[ozti-web] retry ${attempt}/${MAX_RETRIES} ${url} — ${err.message}`);
    await sleep(900 * attempt);
    return fetchJson(url, attempt + 1);
  }
}

function curlJson(url) {
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const hdr = path.join(ROOT, "scripts/data/trial", `_ozti-h-${process.pid}.txt`);
  const body = path.join(ROOT, "scripts/data/trial", `_ozti-b-${process.pid}.json`);
  fs.mkdirSync(path.dirname(hdr), { recursive: true });
  const r = spawnSync(
    curlBin,
    ["-sL", "--max-time", "60", "-D", hdr, "-o", body, "-A", UA, url],
    { encoding: "utf8", timeout: 75_000 },
  );
  if (r.status !== 0 && !fs.existsSync(body)) throw new Error(`curl failed ${url}`);
  const rawHdr = fs.existsSync(hdr) ? fs.readFileSync(hdr, "utf8") : "";
  const text = fs.readFileSync(body, "utf8");
  try {
    fs.unlinkSync(hdr);
    fs.unlinkSync(body);
  } catch {
    /* ignore */
  }
  const total = rawHdr.match(/x-wp-total:\s*(\d+)/i)?.[1];
  const pages = rawHdr.match(/x-wp-totalpages:\s*(\d+)/i)?.[1];
  return {
    data: JSON.parse(text),
    headers: {
      get: (k) => {
        if (k.toLowerCase() === "x-wp-total") return total;
        if (k.toLowerCase() === "x-wp-totalpages") return pages;
        return null;
      },
    },
  };
}

async function getJson(url) {
  try {
    return await fetchJson(url);
  } catch (err) {
    console.warn(`[ozti-web] fetch failed, curl fallback — ${err.message}`);
    return curlJson(url);
  }
}

function preferEntry(existing, candidate) {
  if (!existing) return candidate;
  if (!candidate) return existing;
  if (existing.lang === "tr" && candidate.lang !== "tr") return existing;
  if (candidate.lang === "tr" && existing.lang !== "tr") return candidate;
  if ((candidate.bullets?.length || 0) > (existing.bullets?.length || 0)) return candidate;
  return existing;
}

function saveIndexPartial(byKod, bySoft, meta) {
  if (dryRun) return;
  if (meta.lastPage % 5 !== 0 && meta.lastPage !== 1 && meta.lastPage < meta.totalPages) return;
  const index = {
    builtAt: new Date().toISOString(),
    apiTotal: meta.total,
    pages: meta.totalPages,
    lastPage: meta.lastPage,
    count: Object.keys(byKod).length,
    byKod,
    bySoft,
  };
  fs.mkdirSync(path.dirname(WEB_INDEX), { recursive: true });
  writeJsonAtomic(WEB_INDEX, index);
}

async function buildWebIndex() {
  if (fs.existsSync(WEB_INDEX) && !refreshIndex) {
    return JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
  }

  let byKod = {};
  let bySoft = {};
  let page = 1;
  let totalPages = 1;
  let total = 0;

  if (resume && refreshIndex && fs.existsSync(WEB_INDEX)) {
    const partial = JSON.parse(fs.readFileSync(WEB_INDEX, "utf8"));
    byKod = partial.byKod || {};
    bySoft = partial.bySoft || {};
    page = Number(partial.lastPage || 0) + 1;
    totalPages = Number(partial.pages) || 1;
    total = Number(partial.apiTotal) || 0;
    console.log(`[ozti-web] resume — sayfa ${page}/${totalPages}, kod:${Object.keys(byKod).length}`);
  }

  console.log("[ozti-web] WP REST indeks oluşturuluyor…");

  while (page <= totalPages) {
    const url = `${API}?per_page=100&page=${page}&status=publish`;
    const { data, headers } = await getJson(url);
    if (!Array.isArray(data) || data.length === 0) break;

    totalPages = Number(headers.get("x-wp-totalpages")) || totalPages;
    total = Number(headers.get("x-wp-total")) || total;

    for (const product of data) {
      const parsed = parseOztiWpProduct(product);
      if (!parsed?.kod) continue;
      if (!isOztiTurkishProduct(product) && byKod[parsed.kod]) continue;

      byKod[parsed.kod] = preferEntry(byKod[parsed.kod], parsed);
      bySoft[parsed.kodSoft] = preferEntry(bySoft[parsed.kodSoft], parsed);
    }

    if (page % 5 === 0 || page === 1 || page >= totalPages) {
      console.log(`[ozti-web] sayfa ${page}/${totalPages} — kod:${Object.keys(byKod).length}`);
    }

    saveIndexPartial(byKod, bySoft, { total, totalPages, lastPage: page });
    page++;
    await sleep(150);
  }

  const index = {
    builtAt: new Date().toISOString(),
    apiTotal: total,
    pages: totalPages,
    lastPage: page - 1,
    count: Object.keys(byKod).length,
    byKod,
    bySoft,
  };

  if (!dryRun) {
    fs.mkdirSync(path.dirname(WEB_INDEX), { recursive: true });
    writeJsonAtomic(WEB_INDEX, index);
  }

  console.log(`[ozti-web] indeks hazır — ${index.count} kod (API toplam ~${total})`);
  return index;
}

function loadOztiRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (!isOztiBrand(row) && row.brand !== OZTI_BRAND) continue;
      const kod = normKod(row.urun_kodu || row.sku || row.model);
      if (!kod) continue;
      if (skuFilter && kod !== normKod(skuFilter) && kodSoftKey(kod) !== kodSoftKey(skuFilter)) continue;
      rows.push({ row, file: f, kod });
    }
  }
  return limitArg > 0 ? rows.slice(0, limitArg) : rows;
}

function lookupPayload(index, kod) {
  const k = normKod(kod);
  return index.byKod?.[k] || index.bySoft?.[kodSoftKey(k)] || null;
}

function writeJsonAtomic(dest, data) {
  const json = JSON.stringify(data);
  const tmp = `${dest}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, json, "utf8");
    fs.renameSync(tmp, dest);
  } catch (err) {
    if (err?.code === "EPERM" || err?.code === "EBUSY" || err?.code === "UNKNOWN") {
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

function saveDepts(entries) {
  const byFile = new Map();
  for (const { row, file } of entries) {
    if (!byFile.has(file)) byFile.set(file, new Map());
    byFile.get(file).set(row.sku || row.urun_kodu, row);
  }
  for (const [file, map] of byFile) {
    const dest = path.join(DEPT_DIR, file);
    const full = JSON.parse(fs.readFileSync(dest, "utf8"));
    const out = full.map((r) => {
      const key = r.sku || r.urun_kodu;
      return map.has(key) ? map.get(key) : r;
    });
    if (!dryRun) writeJsonAtomic(dest, out);
  }
}

async function applyToCatalog(index) {
  const entries = loadOztiRows();
  if (!entries.length) {
    console.log("[ozti-web] Öztiryakiler satırı yok");
    process.exit(1);
  }

  let ok = 0;
  let skipped = 0;
  const missing = [];

  for (let i = 0; i < entries.length; i++) {
    const { row, kod } = entries[i];

    if (
      !force &&
      row.ozti_web_description &&
      row.description &&
      String(row.ozti_description_at || "") >= "2026-06-13"
    ) {
      ok++;
      skipped++;
      continue;
    }

    const payload = lookupPayload(index, kod);
    if (payload?.description) {
      applyOztiWebDescription(row, payload);
      ok++;
    } else {
      missing.push(kod);
    }

    if ((i + 1) % 500 === 0 || i === entries.length - 1) {
      console.log(`[ozti-web] ${i + 1}/${entries.length} eşleşen:${ok} eksik:${missing.length}`);
    }
  }

  const report = {
    at: new Date().toISOString(),
    indexCount: index.count,
    catalogRows: entries.length,
    matched: ok,
    skippedExisting: skipped,
    missing: missing.length,
    missingKods: missing.slice(0, 300),
  };

  console.log(
    `[ozti-web] tamam — eşleşen:${ok}/${entries.length} eksik:${missing.length} (atlandı:${skipped})`,
  );

  if (!dryRun) {
    saveDepts(entries);
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  } else {
    console.log("[ozti-web] dry-run — dept/ekipmanlar yazılmadı");
  }

  return report;
}

async function main() {
  console.log("[ozti-web] başlatılıyor…");
  const index = await buildWebIndex();

  if (indexOnly) {
    console.log("[ozti-web] --index-only — katalog güncellenmedi");
    return;
  }

  await applyToCatalog(index);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
