#!/usr/bin/env node
/**
 * urbanbar.com ürün sayfalarından Specifications / Product Care / Safety Labels
 *
 *   node scripts/enrich-urbanbar-pdp-details.mjs
 *   node scripts/enrich-urbanbar-pdp-details.mjs --limit 20
 *   node scripts/enrich-urbanbar-pdp-details.mjs --handle ginza-tall-cuts-highball-glass-35cl
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parsePagePdpDetails } from "./lib/parse-urbanbar-pdp-html.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "scripts/data/urbanbar/urbanbar-web-catalog.json");
const OUT = path.join(ROOT, "scripts/data/urbanbar/urbanbar-pdp-details.json");
const BASE = "https://www.urbanbar.com";
const UA = "EqustoImport/1.0 (+https://equsto.com; urbanbar-pdp-enrich)";

const args = process.argv.slice(2);
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 0;
const handleArg = args.includes("--handle") ? args[args.indexOf("--handle") + 1] : "";
const concurrency = args.includes("--concurrency")
  ? Math.max(1, Number(args[args.indexOf("--concurrency") + 1]) || 4)
  : 6;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchPage(handle) {
  const url = `${BASE}/products/${encodeURIComponent(handle)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function enrichOne(handle) {
  const html = await fetchPage(handle);
  const details = parsePagePdpDetails(html);
  return {
    handle,
    url: `${BASE}/products/${handle}`,
    enrichedAt: new Date().toISOString(),
    ...details,
  };
}

async function mapPool(items, fn, n) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try {
        out[idx] = await fn(items[idx]);
      } catch (e) {
        out[idx] = { handle: items[idx], error: e.message || String(e) };
      }
      if (idx % 25 === 0) process.stdout.write(`  ${idx + 1}/${items.length}\n`);
      await sleep(120);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

async function main() {
  const web = JSON.parse(await fsp.readFile(WEB, "utf8"));
  let handles = (web.products || []).map((p) => p.handle).filter(Boolean);
  if (handleArg) handles = [handleArg];
  if (limitArg > 0) handles = handles.slice(0, limitArg);

  let existing = {};
  if (fs.existsSync(OUT)) {
    try {
      existing = JSON.parse(await fsp.readFile(OUT, "utf8")).byHandle || {};
    } catch (_) {}
  }

  const todo = handles.filter((h) => !existing[h]?.specifications?.length && !existing[h]?.productCareHtml);
  console.log(`[urbanbar-pdp-enrich] ${todo.length} ürün (${handles.length} hedef, ${Object.keys(existing).length} önbellek)`);

  const results = await mapPool(todo, enrichOne, concurrency);
  for (const row of results) {
    if (row?.handle) existing[row.handle] = row;
  }

  const payload = {
    source: BASE,
    enrichedAt: new Date().toISOString(),
    productCount: Object.keys(existing).length,
    byHandle: existing,
  };
  await fsp.mkdir(path.dirname(OUT), { recursive: true });
  await fsp.writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");

  const ok = Object.values(existing).filter((r) => r.specifications?.length || r.productCareHtml).length;
  const err = Object.values(existing).filter((r) => r.error).length;
  console.log(`Yazıldı: ${OUT}`);
  console.log(`  zengin: ${ok}, hata: ${err}, toplam: ${Object.keys(existing).length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
