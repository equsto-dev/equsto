#!/usr/bin/env node
/**
 * Senox PDF çıktısı → public/ (yerel önizleme)
 *
 *   node scripts/sync-senox-preview.mjs
 *   → http://localhost:3099/senox-preview.html
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "scripts/data/senox");
const OUT_DATA = path.join(ROOT, "public/data/fiyat-listeleri/senox/2026-1");
const OUT_IMG = path.join(ROOT, "public/data/senox/images");

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
  const catalogSrc = path.join(SRC, "senox-pdf-catalog.json");
  if (!fs.existsSync(catalogSrc)) {
    console.error("Önce: python scripts/extract-senox-pdf-catalog.py");
    console.error("      python scripts/extract-senox-pdf-images.py");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(catalogSrc, "utf8"));
  const products = (raw.products || []).map((p) => ({
    model: p.model,
    title: p.title,
    page: p.page,
    categoryGroup: p.categoryGroup,
    categoryGroup: p.categoryGroup,
    category: p.category,
    specs: p.specs || {},
    image: p.localImage ? `/data/senox/images/${path.basename(p.localImage)}` : null,
    imageMethod: p.imageMethod || null,
  }));

  await fsp.mkdir(OUT_DATA, { recursive: true });
  const outJson = {
    liste: raw.liste || "SENOX 2026-1",
    source: raw.source,
    scrapedAt: raw.scrapedAt,
    productCount: products.length,
    withImage: products.filter((p) => p.image).length,
    withDims: products.filter((p) => p.specs?.ebat_mm).length,
    withPrice: products.filter((p) => p.specs?.fiyat_eur).length,
    products,
  };

  await fsp.writeFile(path.join(OUT_DATA, "catalog.json"), JSON.stringify(outJson, null, 2), "utf8");

  const imgCount = await copyDir(path.join(SRC, "images"), OUT_IMG);

  console.log(`[senox-preview] ${products.length} ürün → public/data/fiyat-listeleri/senox/2026-1/catalog.json`);
  console.log(`[senox-preview] ${imgCount} görsel → public/data/senox/images/`);
  console.log(`[senox-preview] http://localhost:3099/senox-preview.html`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
