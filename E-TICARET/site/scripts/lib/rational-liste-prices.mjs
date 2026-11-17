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
export const RATIONAL_IVARIO_ISKONTO = Number(
  RATIONAL_LISTE.ivario_iskonto_oran ?? 0.3,
);
export const RATIONAL_KAR_ORAN = Number(RATIONAL_LISTE.equsto_kar_oran ?? 0.1);
export const RATIONAL_KAYNAK = "rational-liste-2026";

/** 9890.IC* kombi fırın SKU */
export function isRationalCombiSku(sku) {
  return /^9890\.IC(PRO|CLS)/i.test(String(sku || ""));
}

/** 9890.IVARIO* */
export function isRationalIvarioSku(sku) {
  return /^9890\.IVARIO/i.test(String(sku || ""));
}

export function isRationalPricedSku(sku) {
  return isRationalCombiSku(sku) || isRationalIvarioSku(sku);
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

export function parseIvarioSku(sku) {
  const s = String(sku || "").toUpperCase();
  const map = [
    ["IVARIOXLP", "XLP"],
    ["IVARIOXL", "XL"],
    ["IVARIOLP", "LP"],
    ["IVARIOL", "L"],
    ["IVARIO2SP", "2SP"],
    ["IVARIO2S", "2S"],
    ["IVARIO2XS", "2XS"],
  ];
  for (const [code, key] of map) {
    if (s.includes(code)) return { seri: "ivario", key };
  }
  return null;
}

export function rationalListEur(sku) {
  if (isRationalIvarioSku(sku)) {
    const p = parseIvarioSku(sku);
    if (!p) return null;
    return RATIONAL_LISTE.ivario?.[p.key] ?? null;
  }
  const p = parseRationalSku(sku);
  if (!p) return null;
  const table = RATIONAL_LISTE[p.seri];
  return table?.[`${p.cfg}|${p.fuel}`] ?? null;
}

export function rationalIskontoForSku(sku) {
  return isRationalIvarioSku(sku) ? RATIONAL_IVARIO_ISKONTO : RATIONAL_ISKONTO;
}

export function rationalPricingFields(sku, kurTry) {
  const liste = rationalListEur(sku);
  if (!(liste > 0)) return null;
  const iskonto = rationalIskontoForSku(sku);
  const px = oztiPricingFields(
    {
      urun_kodu: sku,
      liste_fiyati_eur: liste,
      bayi_iskonto: iskonto,
    },
    kurTry,
    { equstoKarOran: RATIONAL_KAR_ORAN },
  );
  const ivario = parseIvarioSku(sku);
  const combi = parseRationalSku(sku);
  return {
    ...px,
    rational_liste_eur: liste,
    rational_seri: ivario ? "ivario" : combi?.seri,
    rational_iskonto: iskonto,
    kaynak_fiyat_listesi: RATIONAL_KAYNAK,
    fiyat_kaynagi: RATIONAL_KAYNAK,
  };
}

function seriLabel(sku) {
  if (isRationalIvarioSku(sku)) return "iVario";
  return parseRationalSku(sku)?.seri === "pro" ? "iCombi Pro" : "Combi Classic";
}

export function rationalPricingLines(sku, kurTry, kategori) {
  const px = rationalPricingFields(sku, kurTry);
  if (!px) return null;
  const iskonto = px.rational_iskonto;
  const iskPct = Math.round(iskonto * 10000) / 100;
  const karPct = Math.round(RATIONAL_KAR_ORAN * 10000) / 100;
  const kalan = Math.round((1 - iskonto) * 10000) / 10000;
  return [
    `Ürün kodu: ${sku}`,
    `Rational liste (${seriLabel(sku)}, EUR): ${px.rational_liste_eur}`,
    `Equsto iskonto: %${iskPct} (kalan oran ${kalan})`,
    `Equsto net alış (EUR): ${px.alis_fiyati_eur}`,
    `Equsto satış (EUR): ${px.satis_fiyati_eur} (+%${karPct} kar)`,
    `Hesap: Rational liste × (1 − %${iskPct}) × (1 + %${karPct})`,
    `Equsto satış (TL, KDV dahil): ${oztiFmtTry(px.fiyat_tl)}`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${OZTI_KDV_ORAN})`,
    kategori ? `Kategori: ${kategori}` : "",
    "Kaynak: Rational liste fiyatı (iCombi / iVario, 2026)",
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
  // iVario eski format: "Liste fiyatı (EUR):" / "Equsto fiyatı"
  const listeIdx = s.search(/\nListe fiyatı \(EUR\):/i);
  if (listeIdx >= 0) {
    const head = s.slice(0, listeIdx).trimEnd();
    return `${head}\n\n${pricingBlock}`;
  }
  return `${s.trimEnd()}\n\n${pricingBlock}`;
}

export function applyRationalPricing(row, kurTry) {
  const sku = row.sku || row.urun_kodu;
  const px = rationalPricingFields(sku, kurTry);
  if (!px) return null;
  const iskonto = px.rational_iskonto;
  const kategori =
    row.specs?.match(/Kategori: ([^\n]+)/)?.[1]?.trim() ||
    row.category ||
    "";
  row.liste_fiyati_eur = px.rational_liste_eur;
  row.rational_liste_eur = px.rational_liste_eur;
  row.alis_fiyati_eur = px.alis_fiyati_eur;
  row.satis_fiyati_eur = px.satis_fiyati_eur;
  row.satis_eur_indirimli = px.satis_eur_indirimli;
  row.bayi_iskonto = iskonto;
  row.iskonto_oran = Math.round(iskonto * 100);
  row.iskonto_yuzde = Math.round(iskonto * 10000) / 100;
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
