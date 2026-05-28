/**
 * PFOS scrape → Equsto market-reyon kataloğu
 *
 *   node scripts/import-caglayan-market-reyon.mjs
 *   node scripts/import-caglayan-market-reyon.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildCaglayanGalleryLocal } from "./lib/caglayan-gallery.mjs";
import {
  buildCaglayanTeknikAkordeon,
  extractCaglayanCatalogPdf,
  extractCaglayanOzellikler,
} from "./lib/caglayan-catalog-pdf.mjs";
import {
  buildVariantImages,
  eqBrandName,
  eqSku,
  extractCaglayanVariants,
  extractDepthList,
  resolveVariantTeknik,
  sortVariantsByOlculer,
  variantDisplayName,
  variantModelNo,
  variantSlugId,
} from "./lib/caglayan-variants.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(
  ROOT,
  "../../PFOS/veri/proje-veri/caglayan-refrigeration"
);
const OUT_DEPT = path.join(ROOT, "public/data/dept/market-reyon.json");
const OUT_NAV = path.join(ROOT, "public/data/caglayan-market-reyon-catalogue.json");
const OUT_IMG = path.join(ROOT, "public/data/caglayan-market");
const KATALOG = path.join(SRC, "katalog.json");
const URUN_DIR = path.join(SRC, "urun-sayfalari");

const dryRun = process.argv.includes("--dry-run");
const BRAND = "Çağlayan Refrigeration";

/** Nav vitrin serileri (eq-dept-tips ile uyumlu) */
const NAV_SERIES = [
  ["nilufer", "caglayan-nilufer", "Nilüfer"],
  ["lotus", "caglayan-lotus", "Lotus"],
  ["nergis", "caglayan-nergis", "Nergis"],
  ["lale", "caglayan-lale", "Lale"],
  ["inci", "caglayan-inci", "İnci"],
  ["hercai", "caglayan-hercai", "Hercai"],
  ["reyhan", "caglayan-reyhan", "Reyhan"],
  ["sardunya", "caglayan-sardunya", "Sardunya"],
  ["gardenya", "caglayan-gardenya", "Gardenya"],
  ["anemon", "caglayan-anemon", "Anemon"],
  ["akasya", "caglayan-akasya", "Akasya"],
];

const IMG_EXT = /\.(webp|jpe?g|png|gif|pdf)$/i;

function detectSeries(slug, baslik) {
  const s = String(slug || "").toLowerCase();
  const t = String(baslik || "").toLowerCase();
  for (const [key, tileId, label] of NAV_SERIES) {
    if (s === key || s.startsWith(key + "-") || t.includes(key)) {
      return { series: label.toUpperCase(), tileId, category: tileId };
    }
  }
  const root = s.split("-")[0];
  return {
    series: (baslik || slug || "").toUpperCase().slice(0, 40),
    tileId: "",
    category: root ? `caglayan-${root}` : "caglayan",
  };
}

function formatSpecs(urun) {
  const lines = [];
  const oz = (urun.ozellikler || []).filter((o) => o.aciklama);
  if (oz.length) {
    lines.push("Özellikler:");
    for (const o of oz) {
      lines.push(o.baslik ? `• ${o.baslik}: ${o.aciklama}` : `• ${o.aciklama}`);
    }
    lines.push("");
  }
  const tek = urun.teknik || {};
  for (const tab of tek.tablolar || []) {
    if (tab.basliklar?.length) lines.push(tab.basliklar.join(" | "));
    for (const row of tab.satirlar || []) {
      if (row.length) lines.push(row.join(" | "));
    }
    lines.push("");
  }
  for (const sek of tek.sekmeler || []) {
    if (sek.baslik) lines.push(`--- ${sek.baslik} ---`);
    for (const tab of sek.tablolar || []) {
      if (tab.basliklar?.length) lines.push(tab.basliklar.join(" | "));
      for (const row of tab.satirlar || []) {
        if (row.length) lines.push(row.join(" | "));
      }
      lines.push("");
    }
  }
  if (urun.linkKaynak) {
    lines.push(`Kaynak: ${urun.linkKaynak}`);
  }
  return lines.join("\n").trim() || "Teknik detay için teklif isteyin.";
}

function collectImages(urun) {
  const built = buildCaglayanGalleryLocal(urun);
  if (built.length) return built;
  const destDir = path.join(OUT_IMG, urun.slug);
  if (!fs.existsSync(destDir)) return [];
  return fs
    .readdirSync(destDir)
    .filter((f) => IMG_EXT.test(f))
    .sort((a, b) => {
      const score = (fn) =>
        (/kesit/i.test(fn) ? 2 : 0) + (/kapak/i.test(fn) ? 1 : 0) + (/model-\d/i.test(fn) ? 2 : 0);
      return score(a) - score(b);
    })
    .map((f) => `caglayan-market/${urun.slug}/${f}`);
}

function copyImages(slug) {
  const srcDir = path.join(SRC, "gorseller", slug);
  const destDir = path.join(OUT_IMG, slug);
  if (!fs.existsSync(srcDir)) return 0;
  if (!dryRun) fs.mkdirSync(destDir, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(srcDir)) {
    if (!IMG_EXT.test(f)) continue;
    const from = path.join(srcDir, f);
    const to = path.join(destDir, f);
    if (!dryRun) fs.copyFileSync(from, to);
    n++;
  }
  return n;
}

function baseFields(urun, { series, tileId, category }) {
  const imgCount = copyImages(urun.slug);
  const gallery = collectImages(urun);
  const pdf = extractCaglayanCatalogPdf(urun, SRC);
  const ozellikler = extractCaglayanOzellikler(urun);
  const teknikAkordeon = buildCaglayanTeknikAkordeon(urun);
  return {
    dept: "market-reyon",
    brand: BRAND,
    category,
    series,
    tileId: tileId || undefined,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    specs: formatSpecs(urun),
    kaynak: "caglayan-refrigeration",
    linkKaynak: urun.linkKaynak || "",
    caglayanTip: urun.tip,
    caglayanModelSlug: urun.slug,
    caglayanOzellikler: ozellikler.length ? ozellikler : undefined,
    caglayanTeknikAkordeon: teknikAkordeon.length ? teknikAkordeon : undefined,
    caglayanKatalogPdf: pdf?.rel || undefined,
    caglayanKatalogUrl: pdf?.url || undefined,
    caglayanKatalogAdi: pdf?.fileName || undefined,
    _importImgCount: imgCount,
    _gallery: gallery,
  };
}

function buildRows(urun) {
  const { series, tileId, category } = detectSeries(urun.slug, urun.baslik);
  const common = baseFields(urun, { series, tileId, category });
  const gallery = common._gallery;
  const variants = extractCaglayanVariants(urun);
  const depths = extractDepthList(urun);
  delete common._gallery;

  const makeRow = (id, name, model, images, olculer, extra = {}) => {
    const { sku: skuOverride, ...rest } = extra;
    return {
      ...common,
      id,
      slug: id,
      name,
      model,
      images: images?.length ? images : undefined,
      olculer,
      sku: skuOverride || `CAG-${id}`.toUpperCase().slice(0, 56),
      equstoPage: `/shop/market-reyonlari/${id}`,
      ...rest,
    };
  };

  if (!variants.length) {
    const brand = eqBrandName(urun.baslik || urun.slug);
    return [
      makeRow(urun.slug, brand, `${brand} EQ1`, gallery, undefined, {
        caglayanModelSlug: undefined,
        caglayanEqModel: brand,
        caglayanEqNo: 1,
        sku: eqSku(urun.baslik || urun.slug, 1),
      }),
    ];
  }

  const brand = eqBrandName(urun.baslik);
  const sorted = sortVariantsByOlculer(variants);

  return sorted.map((v, index) => {
    const eqNo = index + 1;
    const id = variantSlugId(urun.slug, v);
    const images = buildVariantImages(urun, gallery, v, depths);
    const teknik = resolveVariantTeknik(gallery, v, depths);
    const olculer = {
      genislik_mm: v.genislik_mm,
      derinlik_mm: v.derinlik_mm || undefined,
      yukseklik_mm: v.yukseklik_mm,
    };
    if (!olculer.derinlik_mm) delete olculer.derinlik_mm;
    const extra = {
      caglayanModelKod: v.modelKod || undefined,
      caglayanEqModel: brand,
      caglayanEqNo: eqNo,
      sku: eqSku(urun.baslik, eqNo),
    };
    if (teknik.kesit || teknik.modelCizim) extra.caglayanTeknik = teknik;
    return makeRow(
      id,
      variantDisplayName(urun.baslik, v, eqNo),
      variantModelNo(urun.baslik, v, eqNo),
      images,
      olculer,
      extra
    );
  });
}

function main() {
  if (!fs.existsSync(KATALOG)) {
    console.error("Katalog yok:", KATALOG);
    process.exit(1);
  }
  const katalog = JSON.parse(fs.readFileSync(KATALOG, "utf8"));
  const files = fs.readdirSync(URUN_DIR).filter((f) => f.endsWith(".json"));
  const rows = [];
  let skippedSeri = 0;

  for (const file of files) {
    const urun = JSON.parse(fs.readFileSync(path.join(URUN_DIR, file), "utf8"));
    if (!urun.slug) continue;
    if (urun.tip === "seri") {
      skippedSeri++;
      continue;
    }
    if (urun.tip !== "model" && urun.tip !== "urun") continue;
    rows.push(...buildRows(urun));
  }

  rows.sort((a, b) =>
    (a.caglayanModelSlug || a.id).localeCompare(b.caglayanModelSlug || b.id, "tr") ||
    a.name.localeCompare(b.name, "tr")
  );

  let existing = [];
  if (fs.existsSync(OUT_DEPT)) {
    existing = JSON.parse(fs.readFileSync(OUT_DEPT, "utf8"));
    existing = existing.filter((r) => r.kaynak !== "caglayan-refrigeration");
  }
  const merged = [...existing, ...rows];

  const navSubs = NAV_SERIES.map(([, tip, label]) => ({
    label: label.toUpperCase(),
    tip,
  }));
  navSubs.push({ label: "Tüm Çağlayan kataloğu", tip: "" });

  if (!dryRun) {
    fs.mkdirSync(path.dirname(OUT_DEPT), { recursive: true });
    fs.mkdirSync(OUT_IMG, { recursive: true });
    fs.writeFileSync(OUT_DEPT, JSON.stringify(merged, null, 0), "utf8");
    fs.writeFileSync(
      OUT_NAV,
      JSON.stringify(
        {
          generated: new Date().toISOString(),
          subs: navSubs,
          productCount: rows.length,
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const imgs = rows.reduce((s, r) => s + (r._importImgCount || 0), 0);
  console.log(
    dryRun ? "[dry-run]" : "[ok]",
    "satır:",
    rows.length,
    "| birlesik:",
    merged.length,
    "| atlanan seri:",
    skippedSeri,
    "| görsel dosyası:",
    imgs
  );
  console.log("→", OUT_DEPT);
}

main();
