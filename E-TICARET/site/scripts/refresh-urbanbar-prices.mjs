#!/usr/bin/env node
/**
 * urbanbar.com /products.json → mevcut katalogda GBP fiyat güncelle, Besos TL yeniden hesapla.
 * Koleksiyon, görsel ve açıklamalara dokunmaz.
 *
 *   node scripts/refresh-urbanbar-prices.mjs
 *   node scripts/refresh-urbanbar-prices.mjs --no-build
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_JSON = path.join(ROOT, "scripts/data/urbanbar/urbanbar-web-catalog.json");
const BASE = "https://www.urbanbar.com";
const UA = "EqustoImport/1.0 (+https://equsto.com; urbanbar-prices)";
const noBuild = process.argv.includes("--no-build");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url, retries = 4) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(800 * (i + 1));
    }
  }
  throw new Error("fetchJson failed");
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${BASE}/products.json?limit=250&page=${page}`;
    const data = await fetchJson(url);
    const chunk = data.products || [];
    all.push(...chunk);
    process.stdout.write(`  products.json p${page}: +${chunk.length} (toplam ${all.length})\n`);
    if (chunk.length < 250) break;
    page++;
    await sleep(350);
  }
  return all;
}

function variantPriceMap(shopifyProduct) {
  const byId = new Map();
  const bySku = new Map();
  for (const v of shopifyProduct.variants || []) {
    const row = {
      priceGbp: Number(v.price) || 0,
      compareAtGbp: v.compare_at_price ? Number(v.compare_at_price) : null,
      available: Boolean(v.available),
    };
    if (v.id != null) byId.set(Number(v.id), row);
    const sku = String(v.sku || "").trim();
    if (sku) bySku.set(sku.toUpperCase(), row);
  }
  return { byId, bySku };
}

function applyPrices(catalog, shopifyProducts) {
  const byId = new Map();
  const byHandle = new Map();
  for (const p of shopifyProducts) {
    if (p.id != null) byId.set(Number(p.id), p);
    if (p.handle) byHandle.set(String(p.handle), p);
  }

  let matched = 0;
  let changed = 0;
  let missing = 0;
  const samples = [];

  for (const p of catalog.products || []) {
    const shop = (p.productId != null ? byId.get(Number(p.productId)) : null) || byHandle.get(p.handle);
    if (!shop) {
      missing++;
      continue;
    }
    matched++;
    const maps = variantPriceMap(shop);
    for (const v of p.variants || []) {
      const live =
        (v.id != null ? maps.byId.get(Number(v.id)) : null) ||
        maps.bySku.get(String(v.sku || "").trim().toUpperCase()) ||
        (p.variants.length === 1 && shop.variants?.length === 1
          ? {
              priceGbp: Number(shop.variants[0].price) || 0,
              compareAtGbp: shop.variants[0].compare_at_price
                ? Number(shop.variants[0].compare_at_price)
                : null,
              available: Boolean(shop.variants[0].available),
            }
          : null);
      if (!live) continue;
      const prev = Number(v.priceGbp) || 0;
      if (prev !== live.priceGbp || v.compareAtGbp !== live.compareAtGbp || v.available !== live.available) {
        if (samples.length < 12) {
          samples.push({
            handle: p.handle,
            sku: v.sku,
            from: prev,
            to: live.priceGbp,
          });
        }
        changed++;
      }
      v.priceGbp = live.priceGbp;
      v.compareAtGbp = live.compareAtGbp;
      v.available = live.available;
    }
    p.updatedAt = shop.updated_at || p.updatedAt;
  }

  return { matched, changed, missing, samples, shopifyCount: shopifyProducts.length };
}

async function main() {
  if (!fs.existsSync(OUT_JSON)) {
    throw new Error(`Katalog yok — önce scrape: ${OUT_JSON}`);
  }

  const catalog = JSON.parse(await fsp.readFile(OUT_JSON, "utf8"));
  console.log(`[urbanbar-prices] mevcut: ${catalog.products?.length || 0} ürün (${catalog.scrapedAt || "?"})`);
  console.log("Shopify ürünleri çekiliyor…");
  const shopifyProducts = await fetchAllProducts();
  const stats = applyPrices(catalog, shopifyProducts);

  catalog.scrapedAt = new Date().toISOString();
  catalog.pricesRefreshedAt = catalog.scrapedAt;
  catalog.productCount = catalog.products?.length || 0;
  catalog.variantCount = (catalog.products || []).reduce((n, p) => n + (p.variants?.length || 0), 0);

  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");
  console.log(`[urbanbar-prices] eşleşen ${stats.matched}, GBP değişen varyant ${stats.changed}, sitede yok ${stats.missing}`);
  for (const s of stats.samples) {
    console.log(`  ${s.handle} ${s.sku || ""}: £${s.from} → £${s.to}`);
  }
  if (stats.changed > stats.samples.length) {
    console.log(`  …ve ${stats.changed - stats.samples.length} varyant daha`);
  }

  if (noBuild) return;

  console.log("\nBesos TL fiyatları yeniden hesaplanıyor (TCMB GBP)…");
  execFileSync(process.execPath, ["scripts/build-urbanbar-besos-catalog.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
