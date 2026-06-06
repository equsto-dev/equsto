/**
 * prosogutma.com ↔ Excel Display Cabinets 2025 → Equsto katalog eşleştirme
 *
 *   node scripts/sync-proso-prosogutma-excel.mjs
 *   node scripts/sync-proso-prosogutma-excel.mjs --dry-run
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  PROSO_XLSX_DEFAULT,
  buildProsoPriceFields,
  loadProsoPriceIndex,
  lookupProsoListPrice,
} from "./lib/proso-display-price-list.mjs";
import { extractProsoVariants } from "./lib/proso-variants.mjs";
import { resolveSlugMap, slugFromCatalogRow } from "./lib/proso-prosogutma-slug-map.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PROSO_JSON = join(root, "../veri/prosogutma/products-tr.json");
const MARKET_REYON = join(root, "public/data/dept/market-reyon.json");
const EKIPMANLAR = join(root, "public/data/ekipmanlar.json");
const OUT_DIR = join(root, "scripts/out");
const OUT_REPORT = join(OUT_DIR, "proso-prosogutma-excel-match.json");

const dryRun = process.argv.includes("--dry-run");
const xlsxPath = process.env.PROSO_PRICE_XLSX?.trim() || PROSO_XLSX_DEFAULT;

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(data));
  try {
    if (existsSync(filePath)) unlinkSync(filePath);
  } catch (_) {}
  renameSync(tmp, filePath);
}

function loadProsogutma() {
  if (!existsSync(PROSO_JSON)) return [];
  return JSON.parse(readFileSync(PROSO_JSON, "utf8"));
}

function variantKey(v) {
  return [v.modelKod, v.genislik_mm, v.derinlik_mm, v.yukseklik_mm].join("|");
}

/** prosogutma ürün sayfasından varyant listesi */
function variantsFromProsogutma(product) {
  const urun = {
    ...product,
    baslik: product.title || product.baslik,
    teknik: product.teknik,
    pdfText: product.teknik?.pdfText || product.pdfText,
  };
  return extractProsoVariants(urun);
}

function patchRowFromProsogutma(row, prosogutmaBySlug, stats) {
  const slug = slugFromCatalogRow(row);
  if (!slug) return row;

  const product = prosogutmaBySlug.get(slug);
  let next = { ...row, prosoModelSlug: slug };

  if (!next.prosoModelKod && product) {
    const vars = variantsFromProsogutma(product);
    const w = next.olculer?.genislik_mm || 0;
    const h = next.olculer?.yukseklik_mm || 0;
    const d = next.olculer?.derinlik_mm || 0;
    const hit =
      vars.find((v) => v.genislik_mm === w && v.yukseklik_mm === h && v.derinlik_mm === d) ||
      vars.find((v) => v.genislik_mm === w) ||
      vars[0];
    if (hit?.modelKod) {
      next.prosoModelKod = hit.modelKod;
      stats.kodFromSite++;
    }
  }

  const map = resolveSlugMap(slug);
  if (map) {
    if (!next.prosoModelKod && map.modelKod) {
      next.prosoModelKod = map.modelKod;
      stats.kodFromMap++;
    }
    if (map.excelFam?.length) next.prosoExcelFam = map.excelFam;
    if (map.defaultWidth && !next.olculer?.genislik_mm) {
      next.olculer = { ...(next.olculer || {}), genislik_mm: map.defaultWidth };
      next.prosoDefaultWidth = map.defaultWidth;
      stats.widthAdded++;
    }
    if (map.note) next.prosoMatchNote = map.note;
  }

  if (product?.url && !next.linkKaynak) next.linkKaynak = product.url;
  return next;
}

async function main() {
  if (!existsSync(xlsxPath)) {
    console.error("[proso-sync] xlsx yok:", xlsxPath);
    process.exit(1);
  }

  const prosogutma = loadProsogutma();
  const prosogutmaBySlug = new Map(prosogutma.map((p) => [p.slug, p]));

  const kur = await fetchTcmbEurRate();
  const eurTry = kur.rate;
  const index = await loadProsoPriceIndex(xlsxPath);

  const market = JSON.parse(readFileSync(MARKET_REYON, "utf8"));
  const stats = {
    kodFromSite: 0,
    kodFromMap: 0,
    widthAdded: 0,
    priced: 0,
    stillPending: 0,
    prosogutmaPages: prosogutma.length,
    excelRows: index.size,
  };

  const siteMatch = [];
  const unmatchedSite = [];

  const marketNext = market.map((row) => {
    if (row.kaynak !== "prosogutma") return row;
    let next = patchRowFromProsogutma(row, prosogutmaBySlug, stats);
    const hit = lookupProsoListPrice(index, next);
    if (hit) {
      stats.priced++;
      const patch = buildProsoPriceFields(next, hit.listEur, eurTry);
      next = { ...next, ...patch };
      delete next.fiyat_bekleniyor;
      siteMatch.push({
        sku: next.sku,
        slug: slugFromCatalogRow(next),
        prosoModelKod: next.prosoModelKod,
        width: next.olculer?.genislik_mm || next.prosoDefaultWidth,
        listEur: hit.listEur,
        sheet: hit.sheet,
        prosogutmaUrl: next.linkKaynak,
      });
    } else {
      stats.stillPending++;
      if (!next.prosoModelKod || !next.kaynak_fiyat_listesi) {
        unmatchedSite.push({
          sku: next.sku,
          slug: slugFromCatalogRow(next),
          prosoModelKod: next.prosoModelKod || null,
          note: next.prosoMatchNote || null,
          prosogutmaUrl: next.linkKaynak,
        });
      }
    }
    return next;
  });

  const marketById = new Map(marketNext.filter((r) => r.id).map((r) => [r.id, r]));
  const catalogNext = JSON.parse(readFileSync(EKIPMANLAR, "utf8")).map((row) => {
    if (row.kaynak !== "prosogutma") return row;
    return marketById.get(row.id) || row;
  });

  const prosogutmaReport = prosogutma.map((p) => {
    const vars = variantsFromProsogutma(p);
    const map = resolveSlugMap(p.slug);
    const catalogRows = marketNext.filter((r) => slugFromCatalogRow(r) === p.slug);
    const priced = catalogRows.filter((r) => r.kaynak_fiyat_listesi?.includes("proso-display")).length;
    return {
      slug: p.slug,
      title: p.title || p.baslik,
      url: p.url,
      variantsOnSite: vars.length,
      modelKodSample: vars[0]?.modelKod || map?.modelKod || null,
      catalogRows: catalogRows.length,
      pricedRows: priced,
      excelFam: map?.excelFam || null,
      note: map?.note || null,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    prosogutmaUrl: "https://prosogutma.com",
    xlsx: xlsxPath,
    eurTry,
    summary: {
      prosogutmaParentProducts: prosogutma.length,
      equstoProsoRows: marketNext.filter((r) => r.kaynak === "prosogutma").length,
      excelPriceIndex: index.size,
      kodFromProsogutmaSite: stats.kodFromSite,
      kodFromSlugMap: stats.kodFromMap,
      defaultWidthAdded: stats.widthAdded,
      pricedAfterSync: stats.priced,
      stillPending: stats.stillPending,
    },
    prosogutmaPages: prosogutmaReport,
    matchedSamples: siteMatch.slice(0, 40),
    unmatchedSite: unmatchedSite,
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

  console.log("\n=== PROSOGUTMA ↔ EXCEL EŞLEŞTİRME ===\n");
  console.log("prosogutma.com ürün sayfası:", prosogutma.length);
  console.log("Equsto Proso satır:", report.summary.equstoProsoRows);
  console.log("Excel fiyat indeksi:", index.size);
  console.log("Model kod (siteden):", stats.kodFromSite);
  console.log("Model kod (slug map):", stats.kodFromMap);
  console.log("Varsayılan genişlik eklendi:", stats.widthAdded);
  console.log("Fiyatlı (sync sonrası):", stats.priced);
  console.log("Hâlâ bekleyen:", stats.stillPending);
  console.log("\nRapor:", OUT_REPORT);

  if (unmatchedSite.length) {
    console.log("\n--- Eşleşmeyen örnekler ---");
    unmatchedSite.slice(0, 12).forEach((u) => {
      console.log(`  ${u.slug} | ${u.prosoModelKod || "—"} | ${u.note || ""}`);
    });
  }

  if (dryRun) {
    console.log("\n(dry-run — katalog yazılmadı)");
    return;
  }

  const ts = Date.now();
  copyFileSync(MARKET_REYON, join(root, "public/data", `market-reyon.backup-proso-sync-${ts}.json`));
  copyFileSync(EKIPMANLAR, join(root, "public/data", `ekipmanlar.backup-proso-sync-${ts}.json`));
  writeJsonAtomic(MARKET_REYON, marketNext);
  writeJsonAtomic(EKIPMANLAR, catalogNext);
  console.log("\nKatalog güncellendi.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
