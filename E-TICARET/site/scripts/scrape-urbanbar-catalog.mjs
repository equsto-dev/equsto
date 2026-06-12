#!/usr/bin/env node
/**
 * urbanbar.com (Shopify) → scripts/data/urbanbar/urbanbar-web-catalog.json
 *
 *   node scripts/scrape-urbanbar-catalog.mjs
 *   node scripts/scrape-urbanbar-catalog.mjs --limit 10
 *   node scripts/scrape-urbanbar-catalog.mjs --no-media
 *   node scripts/scrape-urbanbar-catalog.mjs --skip-collections
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "scripts/data/urbanbar");
const OUT_JSON = path.join(OUT_DIR, "urbanbar-web-catalog.json");
const OUT_RAPOR = path.join(OUT_DIR, "urbanbar-web-rapor.md");
const OUT_MEDIA = path.join(OUT_DIR, "images");

const BASE = "https://www.urbanbar.com";
const UA = "EqustoImport/1.0 (+https://equsto.com; urbanbar-catalog)";

const args = process.argv.slice(2);
const skipMedia = args.includes("--no-media");
const skipCollections = args.includes("--skip-collections");
const limitArg = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : 0;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
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

async function fetchAllPaginated(pathname, key) {
  const all = [];
  let page = 1;
  while (true) {
    const url = `${BASE}${pathname}${pathname.includes("?") ? "&" : "?"}limit=250&page=${page}`;
    const data = await fetchJson(url);
    const chunk = data[key] || [];
    all.push(...chunk);
    process.stdout.write(`  ${pathname} p${page}: +${chunk.length} (toplam ${all.length})\n`);
    if (chunk.length < 250) break;
    page++;
    await sleep(350);
  }
  return all;
}

function catTagsFrom(tags) {
  return (tags || [])
    .filter((t) => String(t).toLowerCase().startsWith("cat:"))
    .map((t) => String(t).slice(4).trim())
    .filter(Boolean);
}

function normalizeCollection(c) {
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: stripTags(c.body_html || c.description || "").slice(0, 4000),
    productsCount: c.products_count ?? null,
    image: c.image?.src || null,
    url: `${BASE}/collections/${c.handle}`,
  };
}

function normalizeVariant(v) {
  return {
    id: v.id,
    title: v.title,
    sku: v.sku || "",
    priceGbp: Number(v.price) || 0,
    compareAtGbp: v.compare_at_price ? Number(v.compare_at_price) : null,
    available: Boolean(v.available),
    grams: v.grams ?? null,
    option1: v.option1,
    option2: v.option2,
    option3: v.option3,
    featuredImage: v.featured_image?.src || null,
  };
}

function normalizeProduct(p, collectionMap) {
  const images = (p.images || []).map((im) => im.src).filter(Boolean);
  const catTags = catTagsFrom(p.tags);
  const collections = collectionMap.get(p.id) || [];
  const variants = (p.variants || []).map(normalizeVariant);

  return {
    productId: p.id,
    handle: p.handle,
    title: p.title,
    vendor: p.vendor || "Urban Bar",
    productType: p.product_type || "",
    url: `${BASE}/products/${p.handle}`,
    description: stripTags(p.body_html).slice(0, 12000),
    descriptionHtml: String(p.body_html || "").slice(0, 20000),
    tags: p.tags || [],
    catTags,
    collections,
    collectionPath: collections.map((c) => c.title).join(" > "),
    images,
    variants,
    publishedAt: p.published_at,
    updatedAt: p.updated_at,
  };
}

async function buildCollectionMap(collections) {
  const map = new Map();
  for (let i = 0; i < collections.length; i++) {
    const col = collections[i];
    process.stdout.write(`[kol ${i + 1}/${collections.length}] ${col.handle}… `);
    let page = 1;
    let count = 0;
    try {
      while (true) {
        const url = `${BASE}/collections/${col.handle}/products.json?limit=250&page=${page}`;
        const data = await fetchJson(url);
        const products = data.products || [];
        for (const p of products) {
          const entry = { handle: col.handle, title: col.title };
          const list = map.get(p.id) || [];
          if (!list.some((x) => x.handle === col.handle)) list.push(entry);
          map.set(p.id, list);
          count++;
        }
        if (products.length < 250) break;
        page++;
        await sleep(250);
      }
      console.log(count);
    } catch (e) {
      console.log(`HATA: ${e.message}`);
    }
    await sleep(300);
  }
  return map;
}

async function downloadImage(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    await fsp.writeFile(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function imageExt(url) {
  let ext = path.extname(new URL(url).pathname).split("?")[0] || ".jpg";
  if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
  return ext;
}

async function downloadProductImages(products) {
  console.log("\nGörseller indiriliyor…");
  let ok = 0;
  let skip = 0;
  let miss = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const localImages = [];
    const urls = p.images?.length ? p.images : [];
    for (let j = 0; j < urls.length; j++) {
      const url = urls[j];
      const ext = imageExt(url);
      const safe = `${p.handle}-${j + 1}${ext}`.replace(/[^\w.-]+/g, "-");
      const dest = path.join(OUT_MEDIA, safe);
      const rel = path.relative(OUT_DIR, dest).replace(/\\/g, "/");
      if (fs.existsSync(dest)) {
        localImages.push(rel);
        skip++;
        continue;
      }
      if (await downloadImage(url, dest)) {
        localImages.push(rel);
        ok++;
      } else {
        miss++;
      }
      await sleep(80);
    }
    p.localImages = localImages;
    if ((i + 1) % 50 === 0) process.stdout.write(`  ${i + 1}/${products.length}\n`);
  }
  console.log(`  yeni: ${ok}, mevcut: ${skip}, başarısız: ${miss}`);
}

async function main() {
  await fsp.mkdir(OUT_DIR, { recursive: true });
  await fsp.mkdir(OUT_MEDIA, { recursive: true });

  console.log("Koleksiyonlar çekiliyor…");
  const rawCollections = await fetchAllPaginated("/collections.json", "collections");
  const collections = rawCollections.map(normalizeCollection);

  console.log("Ürünler çekiliyor…");
  let rawProducts = await fetchAllPaginated("/products.json", "products");
  if (limitArg > 0) rawProducts = rawProducts.slice(0, limitArg);

  const collectionMap = skipCollections ? new Map() : await buildCollectionMap(collections);
  const products = rawProducts.map((p) => normalizeProduct(p, collectionMap));

  const partial = {
    source: BASE,
    platform: "shopify",
    scrapedAt: new Date().toISOString(),
    collectionCount: collections.length,
    productCount: products.length,
    collections,
    products,
  };
  await fsp.writeFile(OUT_JSON, JSON.stringify(partial, null, 2), "utf8");
  console.log(`Ara kayıt: ${OUT_JSON}`);

  if (!skipMedia) await downloadProductImages(products);

  const variantCount = products.reduce((n, p) => n + (p.variants?.length || 0), 0);
  const catalog = {
    source: BASE,
    platform: "shopify",
    scrapedAt: new Date().toISOString(),
    collectionCount: collections.length,
    productCount: products.length,
    variantCount,
    collections,
    products,
  };

  await fsp.writeFile(OUT_JSON, JSON.stringify(catalog, null, 2), "utf8");

  const withSku = products.filter((p) => p.variants?.some((v) => v.sku)).length;
  const withImg = products.filter((p) => p.images?.length).length;
  const withCat = products.filter((p) => p.catTags?.length).length;
  const withCol = products.filter((p) => p.collections?.length).length;

  const rapor = [
    "# Urban Bar web katalog raporu",
    "",
    `Kaynak: [urbanbar.com](${BASE})`,
    `Tarih: ${catalog.scrapedAt}`,
    "",
    `- Koleksiyon: **${collections.length}**`,
    `- Ürün: **${products.length}**`,
    `- Varyant: **${variantCount}**`,
    "",
    `- SKU: ${withSku}/${products.length}`,
    `- Görsel: ${withImg}/${products.length}`,
    `- cat: etiketi: ${withCat}/${products.length}`,
    `- Koleksiyon eşleşmesi: ${withCol}/${products.length}`,
    "",
    "## Koleksiyonlar",
    "",
    ...collections
      .sort((a, b) => (b.productsCount || 0) - (a.productsCount || 0))
      .slice(0, 40)
      .map((c) => `- **${c.title}** (\`${c.handle}\`) — ${c.productsCount ?? "?"} ürün`),
    "",
    products.length > 40 ? `_…ve ${collections.length - 40} koleksiyon daha_` : "",
  ]
    .filter(Boolean)
    .join("\n");

  await fsp.writeFile(OUT_RAPOR, rapor, "utf8");
  console.log(`\nYazıldı: ${OUT_JSON}`);
  console.log(`Rapor: ${OUT_RAPOR}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
