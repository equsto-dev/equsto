/**
 * Samixir PDF fiyatları — liste × 65% (40% iskonto + 15% kar)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OZTI_KDV_ORAN, oztiFmtTry, oztiPriceLabelTl } from "./ozti-enrich.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PDF_JSON = path.join(__dirname, "../data/samixir/samixir-pdf-catalog.json");

export const SAMIXIR_ISKONTO = 0.4;
export const SAMIXIR_KAR_ORAN = 0.15;
export const SAMIXIR_SATIS_ORAN = 0.65;
export const SAMIXIR_KAYNAK = "samixir-katalog-2026";

/** PDF parser'ın kaçırdığı kodlar — katalog 2026 manuel tamamlama */
export const SAMIXIR_MANUAL_LISTE_EUR = {
  "SLUSH12.IA": 1860,
  "SLUSH12.I": 1670,
  "M22.DI": 975,
  "S22.DI": 975,
  "KAM22.DI": 1460,
  "KAM40.DI": 1570,
  "20.MI": 760,
  "40.SSI": 1095,
  "40.MMI": 1095,
  "SC06.AG": 950,
};

export function loadSamixirPdfCatalog() {
  if (!fs.existsSync(PDF_JSON)) return null;
  const cat = JSON.parse(fs.readFileSync(PDF_JSON, "utf8"));
  cat.by_code = { ...SAMIXIR_MANUAL_LISTE_EUR, ...(cat.by_code || {}) };
  for (const [slug, code] of Object.entries(cat.slug_map || {})) {
    const liste = cat.by_code[code];
    if (liste > 0) cat.slug_prices[slug] = { pdf_code: code, liste_eur: liste };
  }
  return cat;
}

export function pdfCodeForSlug(slug, catalog) {
  const cat = catalog || loadSamixirPdfCatalog();
  return cat?.slug_map?.[slug] || null;
}

export function listeEurForSlug(slug, catalog) {
  const cat = catalog || loadSamixirPdfCatalog();
  const hit = cat?.slug_prices?.[slug];
  if (hit?.liste_eur > 0) return hit;
  const code = pdfCodeForSlug(slug, cat);
  if (code && cat?.by_code?.[code] > 0) {
    return { pdf_code: code, liste_eur: cat.by_code[code] };
  }
  return null;
}

export function samixirPricingFields(listeEur, kurTry) {
  const liste = Number(listeEur) || 0;
  if (!(liste > 0)) return null;
  const satis_eur = Math.round(liste * SAMIXIR_SATIS_ORAN * 100) / 100;
  const kur = Number(kurTry);
  if (!(kur > 0)) return null;
  const fiyat_tl_net = Math.round(satis_eur * kur);
  const fiyat_tl = Math.round(fiyat_tl_net * (1 + OZTI_KDV_ORAN / 100));
  return {
    liste_fiyati_eur: liste,
    bayi_iskonto: SAMIXIR_ISKONTO,
    satis_eur_indirimli: satis_eur,
    satis_fiyati_eur: satis_eur,
    fiyat_tl_net,
    fiyat_tl,
    price: oztiPriceLabelTl({ fiyat_tl }),
    kur_eur_try: kur,
    iskonto_oran: SAMIXIR_ISKONTO,
    equsto_kar_oran: SAMIXIR_KAR_ORAN,
    samixir_liste_eur: liste,
    kaynak_fiyat_listesi: SAMIXIR_KAYNAK,
    fiyat_kaynagi: SAMIXIR_KAYNAK,
  };
}

export function samixirStockCode(slug, pdfCode) {
  return pdfCode || slug.toUpperCase().replace(/-/g, "");
}

export function samixirPricingLines(slug, px, pdfCode) {
  if (!px) return [];
  return [
    `Stok kodu: ${samixirStockCode(slug, pdfCode)}`,
    `Liste fiyatı (EUR, Samixir 2026): ${px.liste_fiyati_eur} EUR`,
    `Bayi iskonto: %${Math.round(SAMIXIR_ISKONTO * 100)}`,
    `Equsto satış: liste × ${Math.round(SAMIXIR_SATIS_ORAN * 100)}% = ${px.satis_fiyati_eur} EUR`,
    `Equsto satış (TL, KDV dahil): ${oztiFmtTry(px.fiyat_tl)}`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${OZTI_KDV_ORAN})`,
  ];
}
