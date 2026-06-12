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
export const SENOX_MUTBEX_CATALOG = path.join(
  ROOT,
  "scripts/data/senox/mutbex/senox-mutbex-catalog.json",
);

/** PDF sayfa OCR / yanlış fiyat eşlemesi — doğrulanmış Şenox liste EUR */
export const SENOX_LISTE_OVERRIDES = new Map([
  ["YSO100", 200],
  ["YSO200", 250],
  // SENOX 2026-1 s.39–71 (Livagaz duş spreyi tablosu — 20 EUR filtre fiyatı ile karışmasın)
  ["TM02", 200],
  ["TM01", 180],
  ["DM02", 200],
  ["DM01", 180],
  ["T02", 200],
  ["118T02", 200],
  // Geri toplanabilir ön yıkama duşu (HT 10/12/15 m)
  ["HT10", 1000],
  ["HT12", 1100],
  ["HT15", 1200],
  // SENOX 2026-1 s.41 — Isıtıcı lambalar (OCR fiyatı specs'e düşmemiş)
  ["SNX17B", 300],
  ["SNX17C", 300],
  ["SNX17G", 300],
  ["SNX17S", 300],
  // SNX-25-G yanlışlıkla SNX-8060 1500 EUR ile eşleşmiş; SNX-25-C ile aynı liste
  ["SNX25G", 330],
  // SENOX 2026-1 s.67 — Vakum makineleri (OCR komşu ürün fiyatı ile karışmış)
  ["VM01", 300],
  ["WM2", 1800],
  ["WM2TEKENEVAKUMMAKNES", 1800],
  ["DZ280", 1800],
  ["VM3", 2400],
  ["VM3FTENEVAKUMMAKNES", 2400],
  ["DZ4002F", 2400],
]);

/** Mutbex / Equsto model → PDF kod eşlemesi */
export const SENOX_CODE_ALIASES = new Map([
  ["T02", "TM02"],
  ["118T02", "TM02"],
  ["GGMM20", "PLM20"],
  ["GGMM30", "PLM30"],
]);

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
    const overrideKey = normSenoxKey(
      String(p.title || "").match(/\b(YSO-\d+)\b/i)?.[1] ?? "",
    );
    const main =
      (overrideKey && SENOX_LISTE_OVERRIDES.has(overrideKey)
        ? SENOX_LISTE_OVERRIDES.get(overrideKey)
        : 0) || parseEurNum(p.specs?.fiyat_eur);

    if (main > 0) {
      addPrice(map, p.model, main);
      addPrice(map, p.title, main);
      const short = String(p.title || "").match(/\b([A-Z]{2,4}-\d+[A-Z]?)\b/i);
      if (short) addPrice(map, short[1], main);
    }

    for (const [k, v] of parseDescriptionPrices(p.description)) {
      if (!map.has(k)) map.set(k, v);
    }

    for (const m of String(p.title || "").matchAll(/\b([A-Z]{2,}\s?\d[\w\s\-./]{0,20})\b/g)) {
      if (main > 0) addPrice(map, m[1], main);
    }
  }

  for (const [k, v] of SENOX_LISTE_OVERRIDES) {
    if (!map.has(k)) map.set(k, v);
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
    if (SENOX_LISTE_OVERRIDES.has(k)) {
      return {
        listeEur: SENOX_LISTE_OVERRIDES.get(k),
        matchKey: k,
        source: "override",
      };
    }
  }
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
  add(p.sku);
  add(p.urun_kodu);
  add(String(p.mutbexCode || p.sku || "").replace(/^118\./, ""));
  add(String(p.mutbexCode || p.sku || "").replace(/^118\./, "").replace(/\./g, "-"));
  const expanded = [...keys];
  for (const k of expanded) {
    const alias = SENOX_CODE_ALIASES.get(k);
    if (alias) keys.add(alias);
  }
  return [...keys];
}

/** Mutbex priceEur = Equsto satış EUR (liste × %50); liste = priceEur × 2 */
export function mutbexListeFromSatis(priceEur) {
  const satis = Number(priceEur);
  if (!(satis > 0)) return 0;
  return Math.round(satis * 2 * 100) / 100;
}

export function buildMutbexPriceIndex(products) {
  const map = new Map();
  for (const p of products || []) {
    const liste = mutbexListeFromSatis(p.priceEur);
    if (!(liste > 0)) continue;
    const entry = {
      listeEur: liste,
      mutbexCode: p.mutbexCode,
      model: p.model,
      satisEur: p.priceEur,
    };
    const keys = new Set([
      normSenoxKey(p.model),
      normSenoxKey(p.mutbexCode),
      normSenoxKey(String(p.mutbexCode || "").replace(/\./g, "")),
    ]);
    for (const k of keys) {
      if (k && !map.has(k)) map.set(k, entry);
    }
  }
  return map;
}

export function loadMutbexCatalog(catalogPath = SENOX_MUTBEX_CATALOG) {
  if (!fs.existsSync(catalogPath)) {
    return { products: [], index: new Map(), source: "" };
  }
  const raw = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
  const products = raw.products || [];
  return {
    products,
    index: buildMutbexPriceIndex(products),
    source: raw.source || "mutbex.com",
    scrapedAt: raw.scrapedAt || "",
  };
}

export function findMutbexListPrice(p, index) {
  for (const k of candidateKeys(p)) {
    const hit = index.get(k);
    if (hit?.listeEur > 0) {
      return {
        listeEur: hit.listeEur,
        matchKey: k,
        mutbexCode: hit.mutbexCode,
        model: hit.model,
        satisEur: hit.satisEur,
        source: "mutbex",
      };
    }
  }
  return null;
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
