/**
 * SPARO 2026 PDF — liste USD × 70% (30% iskonto) → TL satış (KDV dahil)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeSprKod } from "./sparo-parse.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SPARO_PDF_PRICES = path.join(ROOT, "scripts/data/sparo/sparo-pdf-prices.json");

export const SPARO_ISKONTO_ORAN = 0.3;
export const SPARO_SATIS_ORAN = 0.7;
export const SPARO_KAYNAK = "sparo-2026-fiyat-listesi";
export const SPARO_KDV_ORAN = 20;

export function loadSparoPdfPrices(filePath = SPARO_PDF_PRICES) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fmtTry(n) {
  const v = Math.round(Number(n));
  return `₺${v.toLocaleString("tr-TR")},00`;
}

export function pricingFromSparoPdf(listeUsd, usdTry, eurTry, kdv = SPARO_KDV_ORAN) {
  const liste = Math.round(Number(listeUsd) * 100) / 100;
  if (!(liste > 0)) return null;

  const satisUsd = Math.round(liste * SPARO_SATIS_ORAN * 100) / 100;
  const netTl = Math.round(satisUsd * usdTry);
  const kdvDahil = Math.round(netTl * (1 + kdv / 100));

  const listeEur =
    eurTry > 0 ? Math.round((liste * usdTry) / eurTry * 100) / 100 : undefined;
  const satisEur =
    eurTry > 0 ? Math.round((satisUsd * usdTry) / eurTry * 100) / 100 : undefined;

  return {
    liste_fiyati_usd: liste,
    satis_usd_indirimli: satisUsd,
    liste_fiyati_eur: listeEur,
    satis_eur_indirimli: satisEur,
    iskonto_oran: Math.round(SPARO_ISKONTO_ORAN * 100),
    satis_oran: SPARO_SATIS_ORAN,
    bayi_iskonto: SPARO_ISKONTO_ORAN,
    para_birimi: "USD",
    kur_usd_try: usdTry,
    kur_eur_try: eurTry,
    fiyat_tl_net: netTl,
    fiyat_tl: kdvDahil,
    kdv_oran: kdv,
    price: `${fmtTry(kdvDahil)} KDV dahil`,
    fiyat_bekleniyor: false,
    fiyat_kaynagi: SPARO_KAYNAK,
    kaynak_fiyat_listesi: SPARO_KAYNAK,
  };
}

export function sparoPricingBlock(row, px) {
  const title = String(row.name || row.sku || "").trim();
  return [
    title,
    "",
    `Model: ${row.sku || row.model || ""}`,
    `Liste fiyatı (USD): ${px.liste_fiyati_usd}`,
    `Equsto iskonto: %${px.iskonto_oran} (ödeme oranı ${SPARO_SATIS_ORAN})`,
    `Equsto satış (USD): ${px.satis_usd_indirimli}`,
    `Hesap: liste × ${SPARO_SATIS_ORAN}`,
    `Equsto satış (TL, KDV dahil): ${fmtTry(px.fiyat_tl)}`,
    `Kur: 1 USD = ${px.kur_usd_try} TRY (KDV %${px.kdv_oran})`,
    `Kaynak: SPARO 2026 Katalog Fiyat Listesi`,
  ].join("\n");
}

export function mergeSparoSpecs(row, pricingBlock) {
  const old = String(row.specs || "");
  const keepIdx = old.search(/\n\n(?:Ölçüler|Ürün özellikleri)/i);
  const suffix = keepIdx >= 0 ? old.slice(keepIdx) : "";
  return pricingBlock + suffix;
}

export function applySparoPricing(row, priceMap, usdTry, eurTry) {
  const kod = normalizeSprKod(row.sku || row.model || row.urun_kodu || "");
  const entry = priceMap[kod];
  if (!entry) return false;

  const px = pricingFromSparoPdf(entry.listeUsd ?? entry.liste_usd, usdTry, eurTry);
  if (!px) return false;

  row.price = px.price;
  row.specs = mergeSparoSpecs(row, sparoPricingBlock(row, px));
  Object.assign(row, px);
  return true;
}

export function isSparoRow(row) {
  return (
    String(row?.kaynak || "") === "sparo-web" ||
    String(row?.id || "").startsWith("sparo__") ||
    row?.brand === "Sparo"
  );
}
