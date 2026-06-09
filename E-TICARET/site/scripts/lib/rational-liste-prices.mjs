import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OZTI_KDV_ORAN,
  oztiFmtTry,
  oztiPriceLabelTl,
  oztiPricingFields,
} from "./ozti-enrich.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LISTE_JSON = path.join(__dirname, "../data/rational-liste-2026.json");

export const RATIONAL_LISTE = JSON.parse(fs.readFileSync(LISTE_JSON, "utf8"));
export const RATIONAL_ISKONTO = Number(RATIONAL_LISTE.iskonto_oran ?? 0.41);
export const RATIONAL_KAR_ORAN = Number(RATIONAL_LISTE.equsto_kar_oran ?? 0.1);
export const RATIONAL_KAYNAK = "rational-liste-2026";

/** 9890.IC* kombi fırın SKU */
export function isRationalCombiSku(sku) {
  return /^9890\.IC(PRO|CLS)/i.test(String(sku || ""));
}

export function parseRationalSku(sku) {
  const s = String(sku || "").toUpperCase();
  if (s.includes("ICPROXS")) return { seri: "pro", cfg: "6/2/3", fuel: "E" };
  const tail = s.split(".").pop();
  const fuel = tail.includes("G") ? "G" : "E";
  const map = [
    ["ICPRO61", "pro", "6/1/1"],
    ["ICPRO62", "pro", "6/2/1"],
    ["ICPRO10.1", "pro", "10/1/1"],
    ["ICPRO10.2", "pro", "10/2/1"],
    ["ICPRO20.1", "pro", "20/1/1"],
    ["ICPRO20.2", "pro", "20/2/1"],
    ["ICCLS61", "classic", "6/1/1"],
    ["ICCLS62", "classic", "6/2/1"],
    ["ICCLS10.1", "classic", "10/1/1"],
    ["ICCLS10.2", "classic", "10/2/1"],
    ["ICCLS20.1", "classic", "20/1/1"],
    ["ICCLS20.2", "classic", "20/2/1"],
  ];
  for (const [code, seri, cfg] of map) {
    if (s.includes(code)) return { seri, cfg, fuel };
  }
  return null;
}

export function rationalListEur(sku) {
  const p = parseRationalSku(sku);
  if (!p) return null;
  const table = RATIONAL_LISTE[p.seri];
  return table?.[`${p.cfg}|${p.fuel}`] ?? null;
}

export function rationalPricingFields(sku, kurTry) {
  const liste = rationalListEur(sku);
  if (!(liste > 0)) return null;
  const px = oztiPricingFields(
    {
      urun_kodu: sku,
      liste_fiyati_eur: liste,
      bayi_iskonto: RATIONAL_ISKONTO,
    },
    kurTry,
    { equstoKarOran: RATIONAL_KAR_ORAN },
  );
  return {
    ...px,
    rational_liste_eur: liste,
    rational_seri: parseRationalSku(sku)?.seri,
    kaynak_fiyat_listesi: RATIONAL_KAYNAK,
    fiyat_kaynagi: RATIONAL_KAYNAK,
  };
}

export function rationalPricingLines(sku, kurTry, kategori) {
  const px = rationalPricingFields(sku, kurTry);
  if (!px) return null;
  const iskPct = Math.round(RATIONAL_ISKONTO * 10000) / 100;
  const karPct = Math.round(RATIONAL_KAR_ORAN * 10000) / 100;
  const kalan = Math.round((1 - RATIONAL_ISKONTO) * 10000) / 10000;
  const seri =
    parseRationalSku(sku)?.seri === "pro" ? "iCombi Pro" : "Combi Classic";
  return [
    `Ürün kodu: ${sku}`,
    `Rational liste (${seri}, EUR): ${px.rational_liste_eur}`,
    `Equsto iskonto: %${iskPct} (kalan oran ${kalan})`,
    `Equsto net alış (EUR): ${px.alis_fiyati_eur}`,
    `Equsto satış (EUR): ${px.satis_fiyati_eur} (+%${karPct} kar)`,
    `Hesap: Rational liste × (1 − %${iskPct}) × (1 + %${karPct})`,
    `Equsto satış (TL, KDV dahil): ${oztiFmtTry(px.fiyat_tl)}`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${OZTI_KDV_ORAN})`,
    kategori ? `Kategori: ${kategori}` : "",
    "Kaynak: Rational liste fiyatı (Combi Classic / iCombi Pro, 2026)",
  ].filter(Boolean);
}

/** specs içindeki eski fiyat bloğunu yenisiyle değiştir */
export function patchRationalSpecs(specs, sku, kurTry, kategori) {
  const lines = rationalPricingLines(sku, kurTry, kategori);
  if (!lines) return specs;
  const s = String(specs || "");
  const pricingBlock = lines.join("\n");
  const teknikIdx = s.search(/\nTeknik Özellikler\n/i);
  const urunIdx = s.search(/\nÜrün kodu:/i);
  if (urunIdx >= 0) {
    const head = s.slice(0, urunIdx).trimEnd();
    const tail = teknikIdx > urunIdx ? s.slice(teknikIdx) : "";
    return `${head}\n\n${pricingBlock}${tail ? `\n\n${tail.trimStart()}` : ""}`;
  }
  return `${s.trimEnd()}\n\n${pricingBlock}`;
}

export function applyRationalPricing(row, kurTry) {
  const sku = row.sku || row.urun_kodu;
  const px = rationalPricingFields(sku, kurTry);
  if (!px) return null;
  const kategori =
    row.specs?.match(/Kategori: ([^\n]+)/)?.[1]?.trim() ||
    row.category ||
    "";
  row.liste_fiyati_eur = px.rational_liste_eur;
  row.rational_liste_eur = px.rational_liste_eur;
  row.alis_fiyati_eur = px.alis_fiyati_eur;
  row.satis_fiyati_eur = px.satis_fiyati_eur;
  row.satis_eur_indirimli = px.satis_eur_indirimli;
  row.bayi_iskonto = RATIONAL_ISKONTO;
  row.iskonto_oran = Math.round(RATIONAL_ISKONTO * 100);
  row.iskonto_yuzde = Math.round(RATIONAL_ISKONTO * 10000) / 100;
  row.equsto_kar_oran = RATIONAL_KAR_ORAN;
  row.kur_eur_try = px.kur_eur_try;
  row.fiyat_tl_net = px.fiyat_tl_net;
  row.fiyat_tl = px.fiyat_tl;
  row.price = oztiPriceLabelTl(px);
  row.fiyat_bekleniyor = false;
  row.kaynak_fiyat_listesi = RATIONAL_KAYNAK;
  row.fiyat_kaynagi = RATIONAL_KAYNAK;
  row.specs = patchRationalSpecs(row.specs, sku, kurTry, kategori);
  return row;
}
