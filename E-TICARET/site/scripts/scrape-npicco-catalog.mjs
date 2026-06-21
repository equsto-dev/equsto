#!/usr/bin/env node
/**
 * npicco.com WooCommerce Store API → scripts/data/npicco/npicco-web-catalog.json
 *
 *   node scripts/scrape-npicco-catalog.mjs
 */
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  npiccoCategoryLabel,
  parseFeatureList,
  parseTableVariants,
  stripTags,
} from "./lib/npicco-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/npicco");
const OUT_JSON = path.join(OUT_DIR, "npicco-web-catalog.json");

const API = "https://npicco.com/wp-json/wc/store/products";
const UA = "EqustoImport/1.0 (+https://equsto.com; npicco-catalog)";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return {
    data: await res.json(),
    pages: Number(res.headers.get("x-wp-totalpages") || 1),
    total: Number(res.headers.get("x-wp-total") || 0),
  };
}

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { data, pages } = await fetchJson(`${API}?per_page=100&page=${page}`);
    all.push(...data);
    totalPages = pages;
    page++;
    if (page <= totalPages) await sleep(250);
  } while (page <= totalPages);
  return all.filter((p) => !String(p.permalink || "").includes("/en/"));
}

function normalizeProduct(raw) {
  const html = raw.short_description || raw.description || "";
  const variants = parseTableVariants(html);
  const features = parseFeatureList(html);
  const intro = stripTags(html.split(/<table/i)[0] || "").slice(0, 500);
  return {
    wc_id: raw.id,
    name: raw.name,
    slug: raw.slug,
    url: raw.permalink,
    npicco_category: npiccoCategoryLabel(raw.categories),
    categories: (raw.categories || []).map((c) => ({ slug: c.slug, name: c.name })),
    intro,
    features,
    variants,
    images: (raw.images || []).map((img, i) => ({
      src: img.src || img,
      index: i,
    })),
    prices: raw.prices,
    scraped_at: new Date().toISOString(),
  };
}

async function main() {
  console.log("[npicco-scrape] WooCommerce Store API…");
  const rawProducts = await fetchAllProducts();
  const products = rawProducts.map(normalizeProduct);
  const variantRows = products.reduce((n, p) => n + (p.variants.length || 1), 0);

  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.writeFile(
    OUT_JSON,
    JSON.stringify(
      {
        source: "npicco.com",
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

  const report = [
    "# Npicco web katalog",
    "",
    `- Ürün: ${products.length}`,
    `- Varyant satırı: ${variantRows}`,
    "",
    ...products.map((p) => `- ${p.name} (${p.variants.length || 1} model) — ${p.url}`),
  ].join("\n");
  await fsp.writeFile(path.join(OUT_DIR, "npicco-web-rapor.md"), report, "utf8");

  console.log(`[npicco-scrape] OK → ${OUT_JSON}`);
  console.log(`  ${products.length} ürün, ~${variantRows} vitrin satırı`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
