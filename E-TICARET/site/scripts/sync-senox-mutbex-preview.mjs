#!/usr/bin/env node
/**
 * Mutbex Senox çıktısı → public/ (yerel önizleme)
 *
 *   node scripts/sync-senox-mutbex-preview.mjs
 *   → http://localhost:3099/senox-mutbex-preview.html
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "scripts/data/senox/mutbex");
const OUT_DATA = path.join(ROOT, "public/data/fiyat-listeleri/senox/mutbex");
const OUT_IMG = path.join(ROOT, "public/data/senox/mutbex/images");

async function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  await fsp.mkdir(dest, { recursive: true });
  let n = 0;
  for (const ent of await fsp.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) {
      n += await copyDir(s, d);
    } else if (/\.(jpe?g|png|webp)$/i.test(ent.name)) {
      await fsp.copyFile(s, d);
      n++;
    }
  }
  return n;
}

async function main() {
  const catalogSrc = path.join(SRC, "senox-mutbex-catalog.json");
  if (!fs.existsSync(catalogSrc)) {
    console.error("Önce: npm run catalog:senox:mutbex");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(catalogSrc, "utf8"));
  const products = (raw.products || []).map((p) => ({
    mutbexId: p.mutbexId,
    model: p.model,
    mutbexCode: p.mutbexCode,
    title: p.title,
    url: p.url,
    categoryGroup: p.categoryGroup,
    category: p.category,
    categoryPath: p.categoryPath,
    priceEur: p.priceEur,
    priceTry: p.priceTry,
    priceTryList: p.priceTryList,
    stockQty: p.stockQty,
    description: p.description,
    olculer: p.olculer,
    image: p.localImage
      ? `/data/senox/mutbex/images/${path.basename(p.localImage)}`
      : p.images?.[0] || null,
    imageCount: p.images?.length || 0,
  }));

  await fsp.mkdir(OUT_DATA, { recursive: true });
  const outJson = {
    liste: "Senox — Mutbex",
    source: raw.source,
    scrapedAt: raw.scrapedAt,
    productCount: products.length,
    withImage: products.filter((p) => p.image).length,
    withDims: products.filter((p) => p.olculer).length,
    withPrice: products.filter((p) => p.priceEur != null).length,
    withDesc: products.filter((p) => p.description).length,
    products,
  };

  await fsp.writeFile(path.join(OUT_DATA, "catalog.json"), JSON.stringify(outJson, null, 2), "utf8");

  const imgCount = await copyDir(path.join(SRC, "images"), OUT_IMG);

  console.log(`[mutbex-preview] ${products.length} ürün → public/data/fiyat-listeleri/senox/mutbex/catalog.json`);
  console.log(`[mutbex-preview] ${imgCount} görsel → public/data/senox/mutbex/images/`);
  console.log(`[mutbex-preview] http://localhost:3099/senox-mutbex-preview.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
