/**
 * Vosco PDF katalog → stok kodu → USD liste (kaynak) → EUR vitrin fiyatı
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const VOSCO_PDF_CATALOG = path.join(
  ROOT,
  "scripts/data/vosco/vosco-pdf-catalog.json",
);

export function normVoscoKey(s) {
  return String(s || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/[^A-Z0-9]/g, "");
}

export function buildVoscoPdfPriceIndex(products) {
  const map = new Map();
  for (const p of products || []) {
    const price = Number(p.specs?.liste_usd);
    if (!(price > 0)) continue;
    for (const code of [p.model, p.modelNorm]) {
      const k = normVoscoKey(code);
      if (k && !map.has(k)) map.set(k, price);
    }
  }
  return map;
}

export function loadVoscoPdfCatalog(catalogPath = VOSCO_PDF_CATALOG) {
  if (!fs.existsSync(catalogPath)) {
    return { products: [], index: new Map(), liste: "", source: "" };
  }
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const products = raw.products || [];
  return {
    products,
    index: buildVoscoPdfPriceIndex(products),
    liste: raw.liste || "Vosco PDF",
    source: raw.source || "",
  };
}

export function candidateKeys(p) {
  const keys = new Set();
  const add = (s) => {
    const k = normVoscoKey(s);
    if (k) keys.add(k);
  };
  add(p.stockCode);
  add(p.model);
  add(String(p.stockCode || "").replace(/\//g, "-"));
  return [...keys];
}

export function findPdfListPrice(p, index, products = []) {
  const keys = candidateKeys(p);
  for (const k of keys) {
    if (index.has(k)) return { listeUsd: index.get(k), matchKey: k };
  }
  for (const pp of products) {
    const price = Number(pp.specs?.liste_usd);
    if (!(price > 0)) continue;
    const pk = normVoscoKey(pp.model);
    for (const k of keys) {
      if (pk && k && pk === k) return { listeUsd: price, matchKey: pk };
    }
  }
  for (const k of keys) {
    if (k.length < 4) continue;
    for (const pp of products) {
      const price = Number(pp.specs?.liste_usd);
      if (!(price > 0)) continue;
      const pk = normVoscoKey(pp.model);
      if (pk.length < 4) continue;
      if (pk.startsWith(k) || k.startsWith(pk)) {
        return { listeUsd: price, matchKey: pk, fuzzy: true };
      }
    }
  }
  return null;
}

/** TCMB: 1 USD = usdTry/eurTry EUR */
export function usdToEurRate(usdTry, eurTry) {
  if (!(usdTry > 0) || !(eurTry > 0)) return 0;
  return usdTry / eurTry;
}

export function usdToEur(listeUsd, usdTry, eurTry) {
  const rate = usdToEurRate(usdTry, eurTry);
  if (!(rate > 0) || !(listeUsd > 0)) return 0;
  return Math.round(listeUsd * rate * 100) / 100;
}

export function pricingFromVoscoPdfListe(listeUsd, eurTry, usdTry, kdv = 20, satisOran = 0.55) {
  const kurUsdEur = usdToEurRate(usdTry, eurTry);
  const listeEur = usdToEur(listeUsd, usdTry, eurTry);
  const satisEur = Math.round(listeEur * satisOran * 100) / 100;
  const netTry = satisEur * eurTry;
  const kdvDahil = netTry * (1 + kdv / 100);
  const fmtTry = (n) => {
    const v = Math.round(Number(n));
    const parts = v.toFixed(2).split(".");
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${int},${parts[1]}`;
  };
  return {
    liste_fiyati_usd_pdf: listeUsd,
    liste_fiyati_eur: listeEur,
    satis_fiyati_eur: satisEur,
    satis_eur_indirimli: satisEur,
    satis_oran: satisOran,
    kur_eur_try: eurTry,
    kur_usd_try: usdTry,
    kur_usd_eur: Math.round(kurUsdEur * 10000) / 10000,
    fiyat_tl: Math.round(kdvDahil),
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_bekleniyor: false,
  };
}
