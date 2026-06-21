#!/usr/bin/env node
/**
 * sparo.com.tr WooCommerce Store API → scripts/data/sparo/sparo-web-catalog.json
 *
 *   node scripts/scrape-sparo-catalog.mjs
 *   node scripts/scrape-sparo-catalog.mjs --no-media
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseFeatureList,
  parseTableVariants,
  stripTags,
} from "./lib/sparo-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/sparo");
const OUT_JSON = path.join(OUT_DIR, "sparo-web-catalog.json");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const API = "https://sparo.com.tr/wp-json/wc/store/products";
const UA = "EqustoImport/1.0 (+https://equsto.com; sparo-catalog)";

const skipMedia = process.argv.includes("--no-media");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const total = Number(res.headers.get("x-wp-total") || 0);
  const pages = Number(res.headers.get("x-wp-totalpages") || 1);
  return { data: await res.json(), total, pages };
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const url = `${API}?per_page=100&page=${page}`;
    const { data, pages } = await fetchJson(url);
    all.push(...data);
    totalPages = pages;
    page++;
    if (page <= totalPages) await sleep(300);
  } while (page <= totalPages);
  return all.filter((p) => !String(p.permalink || "").includes("/en/"));
}

function extFromUrl(url) {
  try {
    const ext = path.extname(new URL(url).pathname);
    if (/^\.(jpe?g|png|webp|gif)$/i.test(ext)) return ext.toLowerCase();
  } catch (_) {}
  return ".jpg";
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch {
    return false;
  }
}

async function saveProductImages(product) {
  const saved = [];
  const imgs = product.images || [];
  for (let i = 0; i < imgs.length; i++) {
    const src = imgs[i]?.src || imgs[i];
    if (!src || !/^https?:\/\//i.test(src)) continue;
    const ext = extFromUrl(src);
    const fname = `sparo-${product.id}-${i}${ext}`;
    const dest = path.join(OUT_MEDIA, fname);
    if (!skipMedia) {
      const ok = await downloadImage(src, dest);
      if (!ok) continue;
      await sleep(150);
    }
    saved.push({
      src,
      local: `scripts/data/sparo/images/${fname}`,
      publicPath: `images/catalog/sparo/${fname}`,
    });
  }
  return saved;
}

function normalizeProduct(raw, images) {
  const desc = raw.description || "";
  const variants = parseTableVariants(desc);
  const features = parseFeatureList(desc);
  const intro = stripTags(desc.split(/<table/i)[0] || "").slice(0, 500);
  return {
    wc_id: raw.id,
    name: raw.name,
    slug: raw.slug,
    url: raw.permalink,
    categories: (raw.categories || []).map((c) => ({ slug: c.slug, name: c.name })),
    short_description: stripTags(raw.short_description || ""),
    intro,
    features,
    variants,
    images,
    prices: raw.prices,
    scraped_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("[sparo-scrape] WooCommerce Store API…");
  const rawProducts = await fetchAllProducts();
  console.log(`[sparo-scrape] ${rawProducts.length} TR ürün`);

  const products = [];
  for (const raw of rawProducts) {
    const images = skipMedia ? [] : await saveProductImages(raw);
    products.push(normalizeProduct(raw, images));
    process.stdout.write(`\r  ${products.length}/${rawProducts.length}`);
  }
  console.log("");

  const variantRows = products.reduce((n, p) => n + (p.variants.length || 1), 0);
  const report = [
    "# Sparo web katalog",
    "",
    `- Kaynak: ${API}`,
    `- Ürün sayfası: ${products.length}`,
    `- Varyant satırı (tablo): ${variantRows}`,
    `- Görseller: ${skipMedia ? "atlandı" : "indirildi"}`,
    `- Tarih: ${new Date().toISOString()}`,
    "",
    "## Ürünler",
    ...products.map(
      (p) =>
        `- ${p.name} (${p.variants.length || 1} model) — ${p.url}`,
    ),
  ].join("\n");

  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.writeFile(
    OUT_JSON,
    JSON.stringify(
      {
        source: "sparo.com.tr",
        api: API,
        scraped_at: new Date().toISOString(),
        product_count: products.length,
        variant_count: variantRows,
        products,
      },
      null,
      2,
    ),
    "utf8",
  );
  await fsp.writeFile(path.join(OUT_DIR, "sparo-web-rapor.md"), report, "utf8");

  console.log(`[sparo-scrape] OK → ${OUT_JSON}`);
  console.log(`  ${products.length} ürün, ~${variantRows} vitrin satırı`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
