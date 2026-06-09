/**
 * Vosco PDF katalog → stok kodu → EUR liste (PDF EUR veya USD→EUR)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  VOSCO_CODE_ALIASES,
  VOSCO_DIRECT_LISTE_USD,
} from "./vosco-code-aliases.mjs";

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

function parsePriceSpecs(p) {
  const usd = Number(p?.specs?.liste_usd);
  const eur = Number(p?.specs?.liste_eur);
  return {
    listeUsd: usd > 0 ? usd : 0,
    listeEur: eur > 0 ? eur : 0,
  };
}

export function buildVoscoPdfPriceIndex(products) {
  const byKey = new Map();
  for (const p of products || []) {
    const prices = parsePriceSpecs(p);
    if (!(prices.listeUsd > 0) && !(prices.listeEur > 0)) continue;
    for (const code of [p.model, p.modelNorm]) {
      const k = normVoscoKey(code);
      if (k && !byKey.has(k)) byKey.set(k, prices);
    }
  }
  return byKey;
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

const COLOR_SUFFIXES = [
  "HK", "HS", "HB", "CG", "CS", "CK", "LB", "LS", "LYP", "SR",
  "EK", "ES", "EG", "EM", "EB", "CDG", "DG", "YP",
];

export function candidateKeys(p) {
  const keys = new Set();
  const add = (s) => {
    const k = normVoscoKey(s);
    if (k) keys.add(k);
  };

  const code = String(p.stockCode || p.model || "").trim().toUpperCase();
  add(code);
  add(code.replace(/\//g, "-"));

  if (/^FT-/.test(code)) {
    add("V" + code);
    add("V" + code.replace(/LB$|LS$/i, "L"));
  }
  add(code.replace(/LYP$/i, "L").replace(/YP$/i, "L"));

  let base = code;
  for (const suf of COLOR_SUFFIXES) {
    if (base.endsWith(suf) && base.length > suf.length + 3) {
      add(base.slice(0, -suf.length));
      base = base.slice(0, -suf.length);
    }
  }
  if (/^[A-Z0-9-]{5,}[KSGBMRW]$/.test(code)) add(code.slice(0, -1));

  for (const k of [...keys]) {
    if (VOSCO_CODE_ALIASES[k]) add(VOSCO_CODE_ALIASES[k]);
  }
  if (VOSCO_DIRECT_LISTE_USD[normVoscoKey(code)]) add(normVoscoKey(code));

  return [...keys];
}

function pricesForKey(k, index, products) {
  if (index.has(k)) return { ...index.get(k), matchKey: k };

  for (const pp of products) {
    const pk = normVoscoKey(pp.model);
    if (pk !== k) continue;
    const prices = parsePriceSpecs(pp);
    if (prices.listeUsd > 0 || prices.listeEur > 0) {
      return { ...prices, matchKey: pk };
    }
  }
  return null;
}

export function findPdfListPrice(p, index, products = []) {
  const keys = candidateKeys(p);

  for (const k of keys) {
    const hit = pricesForKey(k, index, products);
    if (hit) return { ...hit, fuzzy: false };
  }

  for (const k of keys) {
    const direct = VOSCO_DIRECT_LISTE_USD[k];
    if (direct > 0) {
      return { listeUsd: direct, listeEur: 0, matchKey: k, direct: true };
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

export function resolveListeEur(match, usdTry, eurTry) {
  if (!match) return 0;
  if (match.listeEur > 0) return match.listeEur;
  if (match.listeUsd > 0) return usdToEur(match.listeUsd, usdTry, eurTry);
  return 0;
}

export function pricingFromVoscoListeEur(listeEur, eurTry, kdv = 20, satisOran = 0.55, meta = {}) {
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
    liste_fiyati_usd_pdf: meta.listeUsd || undefined,
    liste_fiyati_eur_pdf: meta.listeEur || undefined,
    liste_fiyati_eur: listeEur,
    satis_fiyati_eur: satisEur,
    satis_eur_indirimli: satisEur,
    satis_oran: satisOran,
    kur_eur_try: eurTry,
    kur_usd_try: meta.usdTry,
    kur_usd_eur: meta.kurUsdEur,
    fiyat_tl: Math.round(kdvDahil),
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_bekleniyor: false,
  };
}

/** @deprecated use pricingFromVoscoListeEur via resolveListeEur */
export function pricingFromVoscoPdfListe(listeUsd, eurTry, usdTry, kdv = 20, satisOran = 0.55) {
  const listeEur = usdToEur(listeUsd, usdTry, eurTry);
  return pricingFromVoscoListeEur(listeEur, eurTry, kdv, satisOran, {
    listeUsd,
    usdTry,
    kurUsdEur: usdToEurRate(usdTry, eurTry),
  });
}
