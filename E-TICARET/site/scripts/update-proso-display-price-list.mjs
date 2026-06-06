/**
 * Proso Display Cabinets 2025 xlsx → market-reyon + ekipmanlar (%45 iskonto)
 *
 *   node scripts/update-proso-display-price-list.mjs
 *   node scripts/update-proso-display-price-list.mjs --dry-run
 *
 * Env: PROSO_PRICE_XLSX=...  (varsayılan: FİYAT LİSTELERİ klasörü)
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync, unlinkSync, renameSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  PROSO_XLSX_DEFAULT,
  buildProsoPriceFields,
  loadProsoPriceIndex,
  lookupProsoListPrice,
} from "./lib/proso-display-price-list.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const EKIPMANLAR = join(root, "public", "data", "ekipmanlar.json");
const MARKET_REYON = join(root, "public", "data", "dept", "market-reyon.json");
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

function patchProsoRows(rows, index, eurTry, stats) {
  return rows.map((row) => {
    if (row.kaynak !== "prosogutma") return row;
    const hit = lookupProsoListPrice(index, row);
    if (!hit) {
      stats.missed++;
      return row;
    }
    stats.updated++;
    const patch = buildProsoPriceFields(row, hit.listEur, eurTry);
    const next = { ...row, ...patch };
    delete next.fiyat_bekleniyor;
    return next;
  });
}

async function main() {
  if (!existsSync(xlsxPath)) {
    console.error("[proso-price] xlsx bulunamadi:", xlsxPath);
    process.exit(1);
  }

  const kur = await fetchTcmbEurRate();
  const eurTry = kur.rate;
  console.log(`[proso-price] EUR/TRY=${eurTry}${kur.fallback ? " (fallback)" : ""}`);
  console.log("[proso-price] xlsx:", xlsxPath);

  const index = await loadProsoPriceIndex(xlsxPath);
  console.log("[proso-price] Excel fiyat satiri:", index.size);

  const stats = { updated: 0, missed: 0 };
  const market = JSON.parse(readFileSync(MARKET_REYON, "utf8"));
  const catalog = JSON.parse(readFileSync(EKIPMANLAR, "utf8"));

  const marketNext = patchProsoRows(market, index, eurTry, stats);
  const marketById = new Map(marketNext.filter((r) => r.id).map((r) => [r.id, r]));

  const catalogNext = catalog.map((row) => {
    if (row.kaynak !== "prosogutma") return row;
    const hit = marketById.get(row.id);
    return hit || row;
  });

  console.log("[proso-price] Guncellenen:", stats.updated);
  console.log("[proso-price] Eslesmeyen:", stats.missed);

  if (dryRun) {
    const sample = marketNext.filter((r) => r.kaynak_fiyat_listesi?.includes("proso-display")).slice(0, 5);
    sample.forEach((r) => console.log(" ", r.sku, r.price, "| liste EUR", r.liste_fiyati_eur));
    console.log("(dry-run — dosya yazilmadi)");
    return;
  }

  const ts = Date.now();
  copyFileSync(MARKET_REYON, join(root, "public", "data", `market-reyon.backup-proso-price-${ts}.json`));
  copyFileSync(EKIPMANLAR, join(root, "public", "data", `ekipmanlar.backup-proso-price-${ts}.json`));

  writeJsonAtomic(MARKET_REYON, marketNext);
  writeJsonAtomic(EKIPMANLAR, catalogNext);
  console.log("[proso-price] Yedek: *backup-proso-price-" + ts + ".json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
