/**
 * Çağlayan varyant satırları — PLP’de kesit yerine ürün/kapak görseli.
 *   node scripts/patch-caglayan-variant-images.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaglayanGalleryRemote } from "./lib/caglayan-gallery.mjs";
import {
  buildVariantImages,
  extractDepthList,
  resolveVariantTeknik,
} from "./lib/caglayan-variants.mjs";
import { pickCatalogHeroImage, sortCatalogImages } from "./lib/catalog-hero-image.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const SRC = path.resolve(
  ROOT,
  "../../PFOS/veri/proje-veri/caglayan-refrigeration/urun-sayfalari"
);

const urunCache = new Map();

function loadUrun(slug) {
  if (urunCache.has(slug)) return urunCache.get(slug);
  const p = path.join(SRC, `${slug}.json`);
  if (!fs.existsSync(p)) {
    urunCache.set(slug, null);
    return null;
  }
  const u = JSON.parse(fs.readFileSync(p, "utf8"));
  urunCache.set(slug, u);
  return u;
}

function variantFromRow(row) {
  const o = row.olculer || {};
  return {
    modelKod: row.caglayanModelKod || "",
    genislik_mm: Number(o.genislik_mm) || 0,
    derinlik_mm: Number(o.derinlik_mm) || 0,
    yukseklik_mm: Number(o.yukseklik_mm) || 0,
  };
}

function needsFix(row) {
  const first = String(row.images?.[0] || "");
  if (!first) return true;
  return /kesit/i.test(path.basename(first));
}

const rows = JSON.parse(fs.readFileSync(DEPT, "utf8"));
let fixed = 0;

for (const row of rows) {
  if (row.kaynak !== "caglayan-refrigeration") continue;
  if (!needsFix(row)) continue;

  const modelSlug = row.caglayanModelSlug || row.slug;
  const urun = loadUrun(modelSlug);
  if (!urun) continue;

  const gallery = buildCaglayanGalleryRemote(urun);
  if (!gallery.length) continue;

  const v = variantFromRow(row);
  const depths = extractDepthList(urun);
  let images;

  if (row.olculer && (v.genislik_mm || v.yukseklik_mm)) {
    images = buildVariantImages(urun, gallery, v, depths);
    const teknik = resolveVariantTeknik(gallery, v, depths);
    if (teknik.kesit || teknik.modelCizim) {
      row.caglayanTeknik = teknik;
    }
  } else {
    images = sortCatalogImages(gallery);
  }

  if (!images.length) continue;
  const hero = pickCatalogHeroImage(images);
  if (!hero || /kesit/i.test(path.basename(hero))) {
    const fallback = pickCatalogHeroImage(gallery);
    if (fallback && !/kesit/i.test(path.basename(fallback))) {
      images = [fallback, ...images.filter((x) => x !== fallback)];
    }
  }

  row.images = images;
  row.imagesRemote = true;
  fixed++;
}

fs.writeFileSync(DEPT, JSON.stringify(rows), "utf8");
console.log("[patch-caglayan-variant-images]", fixed, "satır güncellendi");
