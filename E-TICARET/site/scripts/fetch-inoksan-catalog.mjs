#!/usr/bin/env node
/**
 * inoksan.com → dept katalog zenginleştirme (görsel + tanım + kısa spec).
 * Yalnız brand=İnoksan / kaynak inoksan-fiyat-listesi-2026-r1 satırları.
 *
 *   node scripts/fetch-inoksan-catalog.mjs
 *   node scripts/fetch-inoksan-catalog.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { foldTr, slugify } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const IMG_DIR = path.join(ROOT, "public/images/catalog/inoksan/web");
const IMG_SUB = "images/catalog/inoksan/web";
const CACHE = path.join(ROOT, "scripts/data/inoksan-web-index.json");
const KAYNAK = "inoksan-fiyat-listesi-2026-r1";
const UA = "Mozilla/5.0 (Equsto; +https://equsto.com)";
const dryRun = process.argv.includes("--dry-run");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function curlText(url) {
  const r = spawnSync(
    "curl.exe",
    ["-sL", "--max-time", "45", "-H", `User-Agent: ${UA}`, url],
    { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
  );
  return r.stdout || "";
}

function curlBin(url, dest) {
  if (dryRun) return false;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const r = spawnSync("curl.exe", ["-sL", "--max-time", "60", "-o", dest, url], { stdio: "pipe" });
  return r.status === 0 && fs.existsSync(dest) && fs.statSync(dest).size > 3000;
}

function loadInoksanRows() {
  const rows = [];
  for (const f of fs.readdirSync(DEPT_DIR).sort()) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    for (const row of list) {
      if (row?.brand === "İnoksan" || row?.kaynak_fiyat_listesi === KAYNAK) rows.push(row);
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

function codeVariants(sku) {
  const code = String(sku || "").replace(/^INO-/i, "").trim();
  const out = new Set([
    code,
    code.replace(/-/g, ""),
    code.replace(/-/g, " "),
    code.replace(/\./g, ""),
  ]);
  const m = code.match(/^([A-Za-z]+)[-.]?0*(\d[\w.-]*)$/i);
  if (m) {
    const letters = m[1].toUpperCase();
    const nums = m[2];
    const numTrim = nums.replace(/^0+/, "") || nums;
    for (const n of [nums, numTrim, nums.padStart(3, "0")]) {
      out.add(`${letters}${n}`);
      out.add(`${letters} ${n}`);
      out.add(`${letters}-${n}`);
    }
  }
  return [...out].map((s) => foldTr(s).replace(/\s+/g, " ").trim()).filter((s) => s.length >= 3);
}

function matchProduct(sku, shortName, products) {
  const vars = codeVariants(sku);
  const shortF = foldTr(shortName).replace(/\s+/g, " ").trim();
  const slugCode = foldTr(String(sku).replace(/^INO-/i, ""));
  let best = null;
  let bestScore = 0;
  for (const p of products) {
    const tf = foldTr(p.title);
    const sf = foldTr(p.slug);
    let score = 0;
    for (const v of vars) {
      if (!v) continue;
      if (tf.includes(v)) score += v.length + 12;
      if (sf.includes(v.replace(/\s+/g, "-"))) score += v.length + 8;
    }
    if (slugCode && sf.includes(slugCode.replace(/\s+/g, "-"))) score += 20;
    if (shortF.length > 8) {
      const chunk = shortF.slice(0, 28);
      if (tf.includes(chunk)) score += 8;
      const words = shortF.split(/[^a-z0-9]+/).filter((w) => w.length > 5);
      for (const w of words.slice(0, 4)) {
        if (tf.includes(w)) score += 4;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 10 ? best : null;
}

function imgFileFor(sku) {
  return path.join(IMG_DIR, `${slugify(sku)}.jpg`);
}

function enrichRow(row, web) {
  if (!web) return false;
  const imgUrl = web.imgs?.[0];
  let imgRel = row.images?.[0] || "";
  if (imgUrl) {
    const dest = imgFileFor(row.sku);
    const ok = curlBin(imgUrl, dest);
    if (ok) imgRel = `${IMG_SUB}/${slugify(row.sku)}.jpg`;
  }
  const specLines = (web.specs || []).map((s) => `${s.k}: ${s.v}`);
  const tech = [...(row.teknik_ozellikler || [])];
  for (const line of specLines) {
    if (!tech.includes(line)) tech.push(line);
  }
  row.name = web.title || row.name;
  if (imgRel) row.images = [imgRel];
  row.teknik_ozellikler = tech;
  row.inoksan_web_id = web.id;
  row.inoksan_slug = web.slug;
  row.inoksan_url = `https://inoksan.com/urun/${web.id}/${web.slug}`;
  const extra = specLines.length ? "\n\nTeknik Özellikler (inoksan.com)\n" + specLines.join("\n") : "";
  if (extra && !String(row.specs || "").includes("Teknik Özellikler (inoksan.com)")) {
    row.specs = String(row.specs || "") + extra;
  }
  row.aciklama = `${row.name}\n\nKategori: ${row.inoksan_h3 || row.category || ""}`;
  return true;
}

function saveDepts(byFile) {
  for (const [file, rows] of Object.entries(byFile)) {
    const full = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    const map = new Map(rows.map((r) => [r.sku, r]));
    const out = full.map((r) => (map.has(r.sku) ? map.get(r.sku) : r));
    fs.writeFileSync(path.join(DEPT_DIR, file), JSON.stringify(out), "utf8");
  }
}

async function main() {
  const rows = loadInoksanRows();
  if (!rows.length) {
    console.log("[inoksan-web] Katalogda İnoksan satırı yok — önce sync-inoksan-fiyat-2026.py");
    process.exit(1);
  }
  const index = await buildWebIndex();
  let matched = 0;
  let imged = 0;
  const byFile = {};
  for (const row of rows) {
    const web = matchProduct(row.sku, row.aciklama || row.name, index.products);
    if (enrichRow(row, web)) {
      matched++;
      if (row.images?.length) imged++;
    }
    const dept = row.dept || "pisirme";
    const file = `${dept}.json`;
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(row);
  }
  console.log(`[inoksan-web] eşleşme: ${matched}/${rows.length} | görsel: ${imged}`);
  if (!dryRun) {
    saveDepts(byFile);
    spawnSync("node", ["scripts/rebuild-ekipmanlar-from-dept.mjs"], { cwd: ROOT, stdio: "inherit" });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
