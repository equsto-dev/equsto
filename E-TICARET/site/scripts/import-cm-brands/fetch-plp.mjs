#!/usr/bin/env node
/**
 * Marka PLP → scripts/data/cm-import/{slug}-plp.json
 *
 *   node scripts/import-cm-brands/fetch-plp.mjs --brand Rational
 */
import { fetchBrandPage } from "../lib/cafemarkt-fetch.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  DELAY_PAGE_MS,
  brandSlug,
  plpCachePath,
  sleep,
  writeJson,
} from "./shared.mjs";

function arg(name, fallback = "") {
  const i = process.argv.indexOf(name);
  if (i < 0) return fallback;
  return process.argv[i + 1] || fallback;
}

async function fetchPageSafe(slug, pg, attempt = 1) {
  try {
    return await fetchBrandPage(slug, pg);
  } catch (err) {
    const msg = String(err?.message || err);
    const retryable = /HTTP 429|HTTP 403|HTTP 503|fetch/i.test(msg);
    if (retryable && attempt < 4) {
      const wait = attempt * 20000;
      console.warn(`[cm-plp] ${msg} — ${wait / 1000}s bekleniyor (deneme ${attempt})`);
      await sleep(wait);
      return fetchPageSafe(slug, pg, attempt + 1);
    }
    throw err;
  }
}

export async function fetchBrandPlp(brand, opts = {}) {
  const slug = opts.slug || brandSlug(brand);
  const fromPage = Number(opts.fromPage || 1) || 1;
  const outPath = plpCachePath(slug);

  console.log(`[cm-plp] ${brand} slug=${slug} from=${fromPage} delay=${DELAY_PAGE_MS}ms`);
  const first = await fetchPageSafe(slug, fromPage);
  const lastPg = first.lastPg || fromPage;
  console.log(`[cm-plp] toplam ~${first.total} ürün, ${lastPg} sayfa`);

  const map = new Map();
  const ingest = (items) => {
    for (const row of items) {
      const key = row.cafemarkt_id || row.code || row.url;
      if (key) map.set(key, row);
    }
  };
  ingest(first.items);

  for (let pg = fromPage + 1; pg <= lastPg; pg++) {
    await sleep(DELAY_PAGE_MS);
    const page = await fetchPageSafe(slug, pg);
    ingest(page.items);
    console.log(`[cm-plp] sayfa ${pg}/${lastPg} +${page.items.length} (birikim ${map.size})`);
  }

  const items = [...map.values()];
  writeJson(outPath, {
    brand,
    slug,
    fetchedAt: new Date().toISOString(),
    reportedTotal: first.total,
    pages: lastPg,
    count: items.length,
    items,
  });
  console.log(`[cm-plp] yazıldı ${items.length} → ${outPath}`);
  return { brand, slug, count: items.length, pages: lastPg, reportedTotal: first.total, outPath };
}

async function main() {
  const brand = arg("--brand") || process.argv[2];
  if (!brand) {
    console.error("Kullanım: node scripts/import-cm-brands/fetch-plp.mjs --brand Rational");
    process.exit(1);
  }
  await fetchBrandPlp(brand, {
    slug: arg("--slug") || brandSlug(brand),
    fromPage: arg("--from-page", "1"),
  });
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (isCli) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
