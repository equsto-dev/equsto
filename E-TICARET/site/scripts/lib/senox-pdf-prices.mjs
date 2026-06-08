/**
 * SENOX PDF katalog → model kodu → liste EUR
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const SENOX_PDF_CATALOG = path.join(
  ROOT,
  "scripts/data/senox/senox-pdf-catalog.json",
);

export function normSenoxKey(s) {
  return String(s || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/^118\./, "")
    .replace(/^286\./, "")
    .replace(/[^A-Z0-9]/g, "");
}

function parseEurNum(raw) {
  const n = Number(String(raw || "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function addPrice(map, code, price) {
  const k = normSenoxKey(code);
  if (!k || !(price > 0)) return;
  if (!map.has(k)) map.set(k, price);
}

function looksLikeCode(line) {
  const s = String(line || "").trim();
  if (!s || s.length > 40) return false;
  if (/^(Fiyat|Voltaj|Ağırlık|Ebatlar|Ürün|Model|www\.|kg|220\s*V)/i.test(s)) return false;
  if (/^\d+(?:\.\d+)?\s*EUR$/i.test(s)) return false;
  if (/^\d+\s*x\s*\d+/i.test(s)) return false;
  return /^[A-Z][A-Z0-9][A-Z0-9\s.\-/]{0,28}$/i.test(s);
}

function parseDescriptionPrices(text) {
  const out = new Map();
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const priceM = lines[i].match(/^(\d+(?:\.\d+)?)\s*EUR$/i);
    if (!priceM) continue;
    const price = Number(priceM[1]);
    for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
      if (looksLikeCode(lines[j])) addPrice(out, lines[j], price);
    }
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      if (looksLikeCode(lines[j])) addPrice(out, lines[j], price);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const prev = lines[i - 1].match(/^(\d+(?:\.\d+)?)\s*EUR$/i);
    if (prev && looksLikeCode(lines[i])) addPrice(out, lines[i], Number(prev[1]));
  }

  return out;
}

export function buildSenoxPdfPriceIndex(products) {
  const map = new Map();

  for (const p of products || []) {
    const main = parseEurNum(p.specs?.fiyat_eur);
    if (main > 0) {
      addPrice(map, p.model, main);
      addPrice(map, p.title, main);
    }

    for (const [k, v] of parseDescriptionPrices(p.description)) {
      if (!map.has(k)) map.set(k, v);
    }

    for (const m of String(p.title || "").matchAll(/\b([A-Z]{2,}\s?\d[\w\s\-./]{0,20})\b/g)) {
      if (main > 0) addPrice(map, m[1], main);
    }
  }

  return map;
}

export function loadSenoxPdfPriceIndex(catalogPath = SENOX_PDF_CATALOG) {
  const data = loadSenoxPdfCatalog(catalogPath);
  return data.index;
}

export function loadSenoxPdfCatalog(catalogPath = SENOX_PDF_CATALOG) {
  if (!fs.existsSync(catalogPath)) {
    return { products: [], index: new Map(), liste: "", source: "" };
  }
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const products = raw.products || [];
  return {
    products,
    index: buildSenoxPdfPriceIndex(products),
    liste: raw.liste || "SENOX PDF",
    source: raw.source || "",
  };
}

function priceFromProduct(pp) {
  const main = parseEurNum(pp.specs?.fiyat_eur);
  if (main > 0) return main;
  for (const [, v] of parseDescriptionPrices(pp.description)) {
    if (v > 0) return v;
  }
  return 0;
}

export function findPdfListPrice(p, index, products = []) {
  const keys = candidateKeys(p);
  for (const k of keys) {
    if (index.has(k)) return { listeEur: index.get(k), matchKey: k };
  }

  for (const pp of products) {
    const price = priceFromProduct(pp);
    if (!(price > 0)) continue;
    const pk = normSenoxKey(pp.model);
    for (const k of keys) {
      if (pk && k && pk === k) return { listeEur: price, matchKey: pk };
    }
  }

  for (const k of keys) {
    if (k.length < 4) continue;
    for (const pp of products) {
      const price = priceFromProduct(pp);
      if (!(price > 0)) continue;
      const pk = normSenoxKey(pp.model);
      if (pk.length < 4) continue;
      if (pk.startsWith(k) || k.startsWith(pk)) {
        return { listeEur: price, matchKey: pk, fuzzy: true };
      }
    }
  }

  let best = null;
  for (const k of keys) {
    if (k.length < 5) continue;
    for (const [ik, price] of index) {
      if (ik.length < 5) continue;
      if (ik.includes(k) || k.includes(ik)) {
        const score = Math.min(k.length, ik.length);
        if (!best || score > best.score) best = { listeEur: price, matchKey: ik, fuzzy: true, score };
      }
    }
  }
  return best;
}

export function candidateKeys(p) {
  const keys = new Set();
  const add = (s) => {
    const k = normSenoxKey(s);
    if (k) keys.add(k);
  };
  add(p.model);
  add(p.mutbexCode);
  add(String(p.mutbexCode || "").replace(/^118\./, ""));
  add(String(p.mutbexCode || "").replace(/^118\./, "").replace(/\./g, "-"));
  return [...keys];
}

export function pricingFromSenoxPdfListe(listeEur, kur, kdv = 20, satisOran = 0.5) {
  const satis = Math.round(listeEur * satisOran * 100) / 100;
  const netTry = satis * kur;
  const kdvDahil = netTry * (1 + kdv / 100);
  const fmtTry = (n) => {
    const v = Math.round(Number(n));
    const parts = v.toFixed(2).split(".");
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${int},${parts[1]}`;
  };
  return {
    liste_fiyati_eur: listeEur,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    satis_oran: satisOran,
    equsto_kar_oran: 0,
    kur_eur_try: kur,
    fiyat_tl: Math.round(kdvDahil),
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_bekleniyor: false,
  };
}
