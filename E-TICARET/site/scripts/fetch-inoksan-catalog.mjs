#!/usr/bin/env node
/**
 * inoksan.com → dept katalog zenginleştirme (görsel + tanım + kısa spec).
 * Yalnız brand=İnoksan / kaynak inoksan-fiyat-listesi-2026-r1 satırları.
 *
 *   node scripts/fetch-inoksan-catalog.mjs
 *   node scripts/fetch-inoksan-catalog.mjs --refresh-index
 *   node scripts/fetch-inoksan-catalog.mjs --force
 *   node scripts/fetch-inoksan-catalog.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  buildWebCodeIndex,
  downloadInoksanImage,
  enrichInoksanRow,
  isValidImageFile,
  matchInoksanWeb,
  skuCore,
} from "./lib/inoksan-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const IMG_DIR = path.join(ROOT, "public/images/catalog/inoksan/web");
const IMG_SUB = "images/catalog/inoksan/web";
const CACHE = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const REPORT = path.join(ROOT, "scripts/data/inoksan-enrich-report.json");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");
const missingOnly = process.argv.includes("--missing-only");
const deptFilter = process.argv.find((a) => a.startsWith("--dept="))?.split("=")[1] || "";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function curlText(url) {
  const r = spawnSync(
    "curl.exe",
    ["-sL", "--max-time", "45", "-A", UA, url],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  return r.stdout || "";
}

function loadInoksanRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (row?.brand === "İnoksan" || row?.kaynak_fiyat_listesi === KAYNAK) {
        if (deptFilter && row.dept !== deptFilter) continue;
        rows.push({ row, file: f });
      }
    }
  }
  return rows;
}

function discoverCategories() {
  const html = curlText("https://inoksan.com/");
  const links = [...new Set(html.match(/https:\/\/inoksan\.com\/urunler\/[a-z0-9/-]+/gi) || [])];
  return links.filter((u) => u.split("/").length >= 5);
}

function partialParams(catUrl) {
  const html = curlText(catUrl);
  const m = html.match(
    /geturunlerpartial\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"\s*,\s*"([^"]*)"/,
  );
  if (!m) return null;
  return { altbolum: m[1], altbaslik: m[2], katid: m[3], enkatid: m[4], catUrl };
}

async function buildWebIndex() {
  if (fs.existsSync(CACHE) && !process.argv.includes("--refresh-index")) {
    return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  }
  const cats = discoverCategories();
  const products = [];
  for (const catUrl of cats) {
    const p = partialParams(catUrl);
    if (!p) continue;
    const q = new URLSearchParams({
      altbolum: p.altbolum,
      altbaslik: p.altbaslik,
      katid: p.katid,
      enkatid: p.enkatid,
    });
    const partial = curlText(`https://inoksan.com/includes/urunler-cgty.asp?${q}`);
    const cards = partial.split('class="product product-box').slice(1);
    for (const block of cards) {
      const link = block.match(/href="\/urun\/(\d+)\/([^"]+)"/);
      const titleM = block.match(/<h5[^>]*><b>([^<]+)<\/b>/i);
      if (!link || !titleM) continue;
      const imgs = [
        ...block.matchAll(/data-src="(https:\/\/www\.inoksan\.com\/imagesfolder\/products\/[^"]+)"/gi),
      ].map((x) => x[1].split("?")[0]);
      const specs = [...block.matchAll(/<li><b>([^<:]+):<\/b>\s*([^<]+)/gi)].map((x) => ({
        k: x[1].trim(),
        v: x[2].trim(),
      }));
      products.push({
        id: link[1],
        slug: link[2],
        title: titleM[1].trim(),
        imgs,
        specs,
        catUrl,
      });
    }
    await sleep(120);
  }
  const index = { builtAt: new Date().toISOString(), count: products.length, products };
  if (!dryRun) {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(index, null, 2), "utf8");
  }
  console.log("[inoksan-web] index:", products.length, "ürün");
  return index;
}

function writeJsonAtomic(dest, data) {
  const dir = path.dirname(dest);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(dest)}.${process.pid}.tmp`);
  const payload = JSON.stringify(data);
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.writeFileSync(tmp, payload, "utf8");
      fs.renameSync(tmp, dest);
      return;
    } catch (err) {
      try {
        fs.unlinkSync(tmp);
      } catch (_) {}
      if (attempt === 5) throw err;
      spawnSync("powershell.exe", ["-Command", `Start-Sleep -Milliseconds ${250 * attempt}`], {
        stdio: "ignore",
      });
    }
  }
}

function saveDepts(updates) {
  const byFile = new Map();
  for (const { row, file } of updates) {
    if (!byFile.has(file)) byFile.set(file, new Map());
    byFile.get(file).set(row.sku, row);
  }
  for (const [file, map] of byFile) {
    const dest = path.join(DEPT_DIR, file);
    const full = JSON.parse(fs.readFileSync(dest, "utf8"));
    const out = full.map((r) => (map.has(r.sku) ? map.get(r.sku) : r));
    if (!dryRun) writeJsonAtomic(dest, out);
  }
}

async function main() {
  const entries = loadInoksanRows();
  if (!entries.length) {
    console.log("[inoksan-web] Katalogda İnoksan satırı yok — önce sync-inoksan-fiyat-2026.py");
    process.exit(1);
  }

  const index = await buildWebIndex();
  const codeIndex = buildWebCodeIndex(index.products);

  let webMatched = 0;
  let imged = 0;
  const missingWeb = [];
  const missingImg = [];
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const { row } = entry;
    if (
      missingOnly &&
      !force &&
      row.inoksan_web_id &&
      row.images?.length &&
      isValidImageFile(path.join(ROOT, "public", row.images[0])) &&
      row.model === skuCore(row.sku) &&
      !String(row.name || "").includes("L/R")
    ) {
      if (row.inoksan_web_id) webMatched++;
      if (row.images?.length) imged++;
      continue;
    }

    const shortName = row.inoksan_excel_name || row.aciklama || row.name || "";
    const match = matchInoksanWeb(row.sku, shortName, index.products, codeIndex);
    const imgResult = downloadInoksanImage(row.sku, match?.product, IMG_DIR, IMG_SUB, {
      dryRun,
      force,
      row,
    });

    if (match) webMatched++;
    else missingWeb.push(row.sku);

    if (imgResult?.rel) imged++;
    else missingImg.push(row.sku);

    enrichInoksanRow(row, match, imgResult);

    if ((i + 1) % 50 === 0 || i === entries.length - 1) {
      console.log(`[inoksan-web] ${i + 1}/${total} web:${webMatched} img:${imged}`);
      if (!dryRun && (i + 1) % 50 === 0) {
        saveDepts(entries);
      }
    }
  }

  const report = {
    at: new Date().toISOString(),
    total,
    webMatched,
    webMissing: missingWeb.length,
    images: imged,
    imagesMissing: missingImg.length,
    missingWebSkus: missingWeb,
    missingImgSkus: missingImg,
  };

  console.log(
    `[inoksan-web] web: ${webMatched}/${total} | görsel: ${imged}/${total} | web eksik: ${missingWeb.length} | görsel eksik: ${missingImg.length}`,
  );

  if (!dryRun) {
    saveDepts(entries);
    fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), "utf8");
    spawnSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  if (missingImg.length) {
    console.warn("[inoksan-web] görsel eksik SKU:", missingImg.slice(0, 15).join(", "));
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
