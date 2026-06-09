#!/usr/bin/env node
/**
 * Samixir web + PDF → Equsto vitrin (icecek dept)
 *
 *   node scripts/import-samixir-to-equsto.mjs
 *   node scripts/import-samixir-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";
import {
  listeEurForSlug,
  loadSamixirPdfCatalog,
  pdfCodeForSlug,
  samixirPricingFields,
  samixirPricingLines,
  samixirStockCode,
  SAMIXIR_KAYNAK,
  SAMIXIR_SATIS_ORAN,
} from "./lib/samixir-pdf-prices.mjs";
import {
  cafeImageExt,
  downloadCafeImage,
  ensureCafeCache,
  IMAGE_FILE_SUFFIX,
  resolveSamixirImage,
} from "./lib/samixir-cafemarkt-images.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/samixir/samixir-web-catalog.json");
const DEPT_FILE = path.join(ROOT, "public/data/dept/icecek.json");
const OUT_IMG = path.join(ROOT, "public/images/catalog/samixir");

const BRAND = "Samixir";
const BRAND_ID = "samixir";
const KAYNAK = "samixir-web";
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");
const skipCafeFetch = process.argv.includes("--skip-cafe-fetch");
const useSamixirImages = process.argv.includes("--samixir-images");

const CAT_MAP = {
  "Slush/Milkshake": { dept: "icecek", category: "granita-slush" },
  "Sıcak İçecek": { dept: "icecek", category: "cay-makinasi" },
  "Köpüklü Ayran": { dept: "icecek", category: "ayran-makinesi" },
  Panoramik: { dept: "icecek", category: "meyve-suyu-sogutuculari" },
  Klasik: { dept: "icecek", category: "meyve-suyu-sogutuculari" },
  Samixir: { dept: "icecek", category: "meyve-suyu-sogutuculari" },
};

function mapDeptCategory(p) {
  return CAT_MAP[p.category] || CAT_MAP.Samixir;
}

function samixirSlug(p) {
  return `${BRAND_ID}-${p.slug}`;
}

function formatSpecs(p, px, pdfHit) {
  const teknik = Object.entries(p.teknik_ozellikler || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const lines = [
    p.title,
    "",
    p.description || "",
    teknik ? `\nTeknik özellikler\n${teknik}` : "",
    "",
    `Ürün kodu: ${samixirStockCode(p.slug, pdfHit?.pdf_code)}`,
    `Kategori: ${p.category}`,
  ];
  if (p.olculer?.raw) lines.push(`Ölçü (makine): ${p.olculer.raw}`);
  if (px) {
    lines.push("", ...samixirPricingLines(p.slug, px, pdfHit?.pdf_code));
  } else {
    lines.push("", "Fiyat: PDF eşleşmesi bulunamadı — teklif için iletişim");
  }
  lines.push("", `Kaynak ürün: samixir.com — ${p.url}`, `Marka: ${BRAND}`);
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

const UA = "EqustoImport/1.0 (+https://equsto.com; samixir-catalog)";

function imageBasename(slug, ext) {
  return `${slug}${IMAGE_FILE_SUFFIX}${ext}`;
}

async function copyImage(p, pdfCatalog, cafeItems) {
  if (!useSamixirImages) {
    const pdfCode = pdfCodeForSlug(p.slug, pdfCatalog);
    const hit = resolveSamixirImage(p.slug, pdfCode, cafeItems);
    if (hit?.url) {
      const ext = cafeImageExt(hit.url);
      const safe = imageBasename(p.slug, ext);
      const dest = path.join(OUT_IMG, safe);
      if (!dryRun && (await downloadCafeImage(hit.url, dest))) {
        return {
          images: [`images/catalog/samixir/${safe}`],
          source: hit.source,
          cafe_code: hit.cafe_code || undefined,
        };
      }
      if (dryRun) {
        return {
          images: [`images/catalog/samixir/${safe}`],
          source: hit.source,
          cafe_code: hit.cafe_code || undefined,
        };
      }
    }
  }

  if (p.localImage) {
    const src = path.join(ROOT, "scripts/data/samixir", p.localImage);
    if (fs.existsSync(src)) {
      const ext = path.extname(src) || ".jpg";
      const safe = imageBasename(p.slug, ext);
      const dest = path.join(OUT_IMG, safe);
      if (!dryRun) {
        fs.mkdirSync(OUT_IMG, { recursive: true });
        fs.copyFileSync(src, dest);
      }
      return { images: [`images/catalog/samixir/${safe}`], source: "samixir.com" };
    }
  }
  const imgUrl = p.heroImage || p.images?.[0];
  if (!imgUrl) return { images: [], source: null };
  let ext = path.extname(new URL(imgUrl).pathname) || ".jpg";
  if (!/^\.(jpe?g|png|webp|gif)$/i.test(ext)) ext = ".jpg";
  const safe = imageBasename(p.slug, ext);
  const dest = path.join(OUT_IMG, safe);
  if (!dryRun) {
    try {
      const res = await fetch(imgUrl, { headers: { "User-Agent": UA } });
      if (!res.ok) return { images: [], source: null };
      await fsp.mkdir(OUT_IMG, { recursive: true });
      await fsp.writeFile(dest, Buffer.from(await res.arrayBuffer()));
    } catch {
      return { images: [], source: null };
    }
  }
  return { images: [`images/catalog/samixir/${safe}`], source: "samixir.com" };
}

async function toRow(p, eurTry, pdfCatalog, cafeItems) {
  const mapped = mapDeptCategory(p);
  const pdfHit = listeEurForSlug(p.slug, pdfCatalog);
  const px = pdfHit?.liste_eur > 0 ? samixirPricingFields(pdfHit.liste_eur, eurTry) : null;
  const images = await copyImage(p, pdfCatalog, cafeItems);
  const stockCode = samixirStockCode(p.slug, pdfHit?.pdf_code);
  const teknikList = Object.entries(p.teknik_ozellikler || {}).map(([k, v]) => `${k}: ${v}`);

  return {
    id: `${BRAND_ID}__${p.slug}`,
    dept: mapped.dept,
    category: mapped.category,
    brand: BRAND,
    name: p.title,
    price: px?.price || "Teklif için iletişim",
    fiyat_bekleniyor: !px,
    specs: formatSpecs(p, px, pdfHit),
    aciklama: p.description || p.title,
    teknik_ozellikler: teknikList,
    olculer: p.olculer?.genislik_mm
      ? { olcu_etiket: p.olculer.raw, olculer: p.olculer }
      : {},
    keywords: [BRAND, stockCode, mapped.category, p.category, p.slug].filter(Boolean),
    images: images.images.length ? images.images : undefined,
    image_kaynak: images.source || undefined,
    cafe_code: images.cafe_code || undefined,
    sku: stockCode,
    model: stockCode,
    urun_kodu: stockCode,
    samixir_slug: p.slug,
    samixir_pdf_code: pdfHit?.pdf_code,
    kaynak: KAYNAK,
    kaynak_url: p.url,
    ...(px || {}),
    kaynak_fiyat_listesi: px ? SAMIXIR_KAYNAK : undefined,
  };
}

function isSamixirRow(r) {
  return String(r?.kaynak || "") === KAYNAK || String(r?.id || "").startsWith(`${BRAND_ID}__`);
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  if (!fs.existsSync(SRC_JSON)) {
    console.error("Önce: node scripts/scrape-samixir-catalog.mjs");
    process.exit(1);
  }
  const pdfCatalog = loadSamixirPdfCatalog();
  if (!pdfCatalog) {
    console.error("Önce: python scripts/extract-samixir-pdf-catalog.py");
    process.exit(1);
  }

  const { products } = JSON.parse(fs.readFileSync(SRC_JSON, "utf8"));
  const { eurTry } = await fetchTcmbEurUsdRates();
  console.log(`[kur] 1 EUR = ${eurTry} TRY`);

  const cafeItems = useSamixirImages ? [] : await ensureCafeCache({ refresh: !skipCafeFetch });

  const rows = [];
  let priced = 0;
  let cafeImages = 0;
  let samixirImages = 0;
  for (const p of products) {
    const row = await toRow(p, eurTry, pdfCatalog, cafeItems);
    if (!row.fiyat_bekleniyor) priced++;
    if (row.image_kaynak === "cafemarkt") cafeImages++;
    if (row.image_kaynak === "samixir.com") samixirImages++;
    rows.push(row);
  }

  const existing = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  const kept = existing.filter((r) => !isSamixirRow(r));
  const merged = [...kept, ...rows];

  if (!dryRun) {
    writeJsonAtomic(DEPT_FILE, merged);
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log(
    JSON.stringify(
      {
        dry_run: dryRun,
        imported: rows.length,
        priced,
        unpriced: rows.length - priced,
        cafe_images: cafeImages,
        samixir_fallback_images: samixirImages,
        image_source: useSamixirImages ? "samixir.com" : "cafemarkt",
        dept: DEPT_FILE,
        satis_oran: SAMIXIR_SATIS_ORAN,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
