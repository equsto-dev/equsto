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

/** PDF sayfa OCR / yanlış fiyat eşlemesi — doğrulanmış Şenox liste EUR (SENOX 2026-2-1) */
export const SENOX_LISTE_OVERRIDES = new Map([
  // s.38 — YSO (GD dilimleyici 700/750/1200 ile karışmasın)
  ["YSO100", 230],
  ["YSO200", 280],
  // s.39 — Livagaz duş spreyi (24 EUR filtre / hortum fiyatı ile karışmasın)
  ["TM02", 240],
  ["TM01", 220],
  ["DM02", 240],
  ["DM01", 220],
  ["T02", 240],
  ["118T02", 240],
  // s.39 — Livagaz toplama hortumları 12/15 m (10 m listede yok; önceki liste)
  ["HT10", 1000],
  ["HT12", 1100],
  ["HT15", 1250],
  // s.41 — Isıtıcı lambalar (SNX-8060 1500/1600 ile karışmasın)
  ["SNX17B", 360],
  ["SNX17C", 360],
  ["SNX17G", 360],
  ["SNX17S", 360],
  // SNX-25-G yanlışlıkla SNX-8060 ile eşleşmesin
  ["SNX25G", 330],
  // s.21 — Dondurma reyonları
  ["DT6", 6000],
  ["DT8", 7000],
  ["DT9", 12500],
  ["DT12", 17000],
  ["DT13", 16000],
  ["DT18", 21000],
  ["DT24", 25000],
  ["DT100", 1800],
  ["DT200", 2000],
  ["DT600", 12000],
  // s.12 — Şarap dolabı WN 250/350
  ["WN250", 1600],
  ["WN350", 1750],
  // s.37 — Vakum (Robotcoupe blender EUR ile karışmış)
  ["VM01", 500],
  ["WM2", 2000],
  ["WM2TEKENEVAKUMMAKNES", 2000],
  ["DZ280", 2000],
  ["VM3", 2600],
  ["VM3FTENEVAKUMMAKNES", 2600],
  ["DZ4002F", 2600],
  // Salad bar (önceki doğrulama; 2026-2-1’de aynı blok)
  ["SLD03", 1800],
  ["SLD04", 2000],
  // s.10 — SDS 1510 DC 3 YF
  ["SDS1510", 3300],
  ["SDS1510DC3YF", 3300],
  // s.35 — El blender BL40 L60 / L60-C (desc OCR düşük EUR)
  ["BL40L60", 450],
  ["BL40L60C", 600],
  // s.48 — Buz makineleri (BZ12 300 EUR; FR/SB tablo sırası doğrulandı)
  ["BZ12", 300],
  ["SB200", 1900],
  ["SB400", 2100],
  ["FR25", 1500],
  ["FR35", 1600],
  ["FR50", 1800],
  ["FR70", 1900],
  ["FR90", 2175],
  ["FR250", 2375],
  ["FR500", 2775],
  ["FR30", 3100],
  ["FR40", 5350],
  ["FR60", 6500],
  // s.43 — Ventus KKM 01 (süt soğutucu 400 EUR ile karışmasın)
  ["KKM01", 2000],
  ["VENTUSKKM01KAHVEKAVURMAMAKINESI", 2000],
]);

/** Equsto satış — sabit KDV dahil TRY (kur değişse de fiyat sabit kalır) */
export const SENOX_KDV_DAHIL_TL_OVERRIDES = new Map([
  ["SBCS250", 46985],
]);

/** Mutbex / Equsto model → PDF kod eşlemesi */
export const SENOX_CODE_ALIASES = new Map([
  ["T02", "TM02"],
  ["118T02", "TM02"],
  ["DY01", "DY01TEKHAZNELIDONDURMAYAPICI"],
  ["DY02", "DY02IFTHAZNELIDONDURMAYAPICI"],
  ["DY04", "DY04DRTHAZNELIDONDURMAYAPICI"],
  ["PDY01", "PDY01PROFESYONELDONDURMAYAPICISI"],
  ["GGM-M-20", "PLM20"],
  ["GGMM20", "PLM20"],
  ["GGM-M-30", "PLM30"],
  ["GGMM30", "PLM30"],
  ["GGM", "GGM"],
  ["EMH15", "EMH15"],
  ["AAMH300", "AAMH300"],
  ["SEMG16K", "SEMG16K"],
  ["STRC", "STRC"],
  ["40LB", "40LB"],
  ["BZ12", "BZ12"],
  ["BZ20", "BZ20"],
  ["CKA", "CKA"],
  ["KMP01", "KMP01"],
  ["KRS105", "KRS105"],
  ["PS01", "PS01"],
  ["LT12", "LT12"],
  ["LT16", "LT16"],
  ["LT8", "LT8"],
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
  const s = String(raw || "").trim();
  if (!s) return 0;
  // 14.000 / 18.000 — binlik nokta (PDF OCR)
  if (/^\d{1,3}(?:\.\d{3})+$/.test(s)) {
    const n = Number(s.replace(/\./g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }
  const n = Number(s.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseEurFromLine(line) {
  const m = String(line || "").trim().match(/^([\d.,]+)\s*EUR$/i);
  return m ? parseEurNum(m[1]) : 0;
}

function addPrice(map, code, price, force = false) {
  const k = normSenoxKey(code);
  if (!k || !(price > 0)) return;
  if (force || !map.has(k)) map.set(k, price);
}

function looksLikeCode(line) {
  const s = String(line || "").trim();
  if (!s || s.length > 40) return false;
  if (/^(Fiyat|Voltaj|Ağırlık|Ebatlar|Ürün|Model|www\.|kg|220\s*V)/i.test(s)) return false;
  if (/^\d+(?:\.\d+)?\s*EUR$/i.test(s)) return false;
  if (/^\d+\s*x\s*\d+/i.test(s)) return false;
  if (/^R\d{3,4}[A-Z]?$/i.test(s.replace(/\s/g, ""))) return false;
  if (/^[+-]?\d+\s*[-–]\s*[+-]?\d+/i.test(s)) return false;
  return /^[A-Z][A-Z0-9][A-Z0-9\s.\-/]{0,28}$/i.test(s);
}

/** PDF description içinde ürün kodu satırına yakın EUR + ebat çifti */
function extractPriceDimPairs(description) {
  const lines = String(description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const pairs = [];
  for (let i = 0; i < lines.length; i++) {
    const price = parseEurFromLine(lines[i]);
    if (!(price > 0)) continue;
    let dim = "";
    for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 3); j++) {
      const dm = lines[j].match(/(\d{3,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{3,4})/i);
      if (dm) dim = `${dm[1]}x${dm[2]}x${dm[3]}`;
    }
    pairs.push({ price, dim, line: i });
  }
  return pairs;
}

function productAnchorPatterns(model, title) {
  const patterns = [];
  const add = (s) => {
    const t = String(s || "").trim();
    if (t.length < 4) return;
    patterns.push(
      new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i"),
    );
  };
  add(model);
  add(title);
  const m = String(title || "").match(
    /\b(SDS\s*\d+\s*DC\s*\d+\s*[A-Z]{2,4}|SDS[-\s]?\d+[A-Z0-9\-/]*|SNX[-\s]?\d+[A-Z0-9\-]*)\b/i,
  );
  if (m) add(m[1]);
  return patterns;
}

export function extractAnchoredPriceFromDescription(description, model, title, hintDims = "") {
  const lines = String(description || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const patterns = productAnchorPatterns(model, title);
  const pairs = extractPriceDimPairs(description);
  if (!pairs.length) return 0;

  const hintW = String(hintDims || title || "")
    .match(/(\d{2,4})\s*[x×]\s*(\d{2,4})/i)
    ?.slice(1)
    .map((n) => String(Number(n) >= 100 ? n : Number(n) * 10));

  for (let i = 0; i < lines.length; i++) {
    if (!patterns.some((p) => p.test(lines[i]))) continue;

    if (hintW?.length === 2) {
      for (const pair of pairs) {
        if (pair.line < i || pair.line - i > 18) continue;
        const d = pair.dim.replace(/\s/g, "");
        if (d.includes(hintW[0]) && d.includes(hintW[1])) return pair.price;
      }
    }

    let best = null;
    for (const pair of pairs) {
      if (pair.line < i) continue;
      const dist = pair.line - i;
      if (dist > 18) break;
      if (!best || dist < best.dist || (dist === best.dist && pair.price > best.price)) {
        best = { ...pair, dist };
      }
    }
    if (best?.price > 0) return best.price;
  }

  const eurInDesc = pairs.map((p) => p.price);
  if (eurInDesc.length === 1) return eurInDesc[0];
  return 0;
}

function parseDescriptionPrices(text) {
  const out = new Map();
  const lines = String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const price = parseEurFromLine(lines[i]);
    if (!(price > 0)) continue;
    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
      if (looksLikeCode(lines[j])) addPrice(out, lines[j], price);
    }
    for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
      if (looksLikeCode(lines[j])) addPrice(out, lines[j], price);
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const prev = parseEurFromLine(lines[i - 1]);
    if (prev > 0 && looksLikeCode(lines[i])) addPrice(out, lines[i], prev);
  }

  return out;
}

function expandPdfShortKeys(model) {
  const out = new Set();
  const raw = String(model || "");
  const prefixNum = raw.match(
    /^(DY|PDY|PDM|PLM|BLK|SNX|SYD|SDS|BBC|SBCS?|SMR|WN|WF|BZ|MS|KRS|CF|SYS|BN|BGN|UGN|CKT|DS|SFT|SLS|SRB|KM|IC|SMF|ADA|MT|KOE?|SET|WD|VN|CMVA|KKM|SLD|BS|DBE|DVF|HT|TM|DM)[-\s]+(\d+[A-Z0-9]*)/i,
  );
  if (prefixNum) {
    out.add(prefixNum[1].toUpperCase() + prefixNum[2].toUpperCase().replace(/[^A-Z0-9]/g, ""));
  }
  const lk = raw.match(/^(\d{2,4})LK(?:[-\s/]?([A-Z]{1,4}))?$/i);
  if (lk) out.add(`${lk[1]}LK${lk[2] ? lk[2].toUpperCase() : ""}`);
  return [...out];
}

export function buildSenoxPdfPriceIndex(products) {
  const descMap = new Map();
  for (const p of products || []) {
    for (const [k, v] of parseDescriptionPrices(p.description)) {
      addPrice(descMap, k, v);
    }
  }

  const map = new Map();

  for (const p of products || []) {
    const modelKey = normSenoxKey(p.model);
    const overrideKey = normSenoxKey(
      String(p.title || "").match(/\b(YSO-\d+)\b/i)?.[1] ?? "",
    );
    const fromOverride =
      (overrideKey && SENOX_LISTE_OVERRIDES.has(overrideKey)
        ? SENOX_LISTE_OVERRIDES.get(overrideKey)
        : 0) ||
      (modelKey && SENOX_LISTE_OVERRIDES.has(modelKey)
        ? SENOX_LISTE_OVERRIDES.get(modelKey)
        : 0);
    const fromDesc =
      (modelKey && descMap.get(modelKey)) ||
      (normSenoxKey(p.title) && descMap.get(normSenoxKey(p.title))) ||
      0;
    const fromAnchored = extractAnchoredPriceFromDescription(
      p.description,
      p.model,
      p.title,
    );
    const fromSpecs = parseEurNum(p.specs?.fiyat_eur);
    const fromText = fromAnchored || fromDesc || 0;
    // Tablo specs, OCR description'dan ~1.5×+ yüksekse tabloyu tercih et
    // (BL40L60: desc 225 vs specs 450).
    let main = fromOverride;
    if (!main) {
      if (fromSpecs > 0 && fromText > 0 && fromSpecs >= fromText * 1.5) {
        main = fromSpecs;
      } else {
        main = fromText || fromSpecs;
      }
    }

    if (main > 0) {
      addPrice(map, p.model, main, true);
      addPrice(map, p.title, main, true);
      const short = String(p.title || "").match(/\b([A-Z]{2,5}-\d+[A-Z0-9-]*)\b/gi);
      if (short) {
        for (const s of short) addPrice(map, s, main, true);
      }
      for (const sk of expandPdfShortKeys(p.model)) {
        addPrice(map, sk, main, true);
      }
      for (const sk of expandPdfShortKeys(p.title)) {
        addPrice(map, sk, main, true);
      }
    }
  }

  // Çoklu varyant tabloları (SBC/SBCS, SLD-03/04, ADA 150T/180T …)
  for (const [k, v] of descMap) {
    map.set(k, v);
  }

  for (const [k, v] of SENOX_LISTE_OVERRIDES) {
    map.set(k, v);
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
  const modelKey = normSenoxKey(pp.model);
  if (modelKey && SENOX_LISTE_OVERRIDES.has(modelKey)) {
    return SENOX_LISTE_OVERRIDES.get(modelKey);
  }
  const overrideKey = normSenoxKey(
    String(pp.title || "").match(/\b(YSO-\d+)\b/i)?.[1] ?? "",
  );
  if (overrideKey && SENOX_LISTE_OVERRIDES.has(overrideKey)) {
    return SENOX_LISTE_OVERRIDES.get(overrideKey);
  }
  for (const [k, v] of parseDescriptionPrices(pp.description)) {
    if (k === modelKey) {
      const fromSpecs = parseEurNum(pp.specs?.fiyat_eur);
      if (fromSpecs > 0 && fromSpecs >= v * 1.5) return fromSpecs;
      return v;
    }
  }
  const anchored = extractAnchoredPriceFromDescription(
    pp.description,
    pp.model,
    pp.title,
  );
  if (anchored > 0) {
    const fromSpecs = parseEurNum(pp.specs?.fiyat_eur);
    if (fromSpecs > 0 && fromSpecs >= anchored * 1.5) return fromSpecs;
    return anchored;
  }
  return parseEurNum(pp.specs?.fiyat_eur);
}

export function resolveSenoxListPrice(p, pdfIndex, pdfProducts, mutbexIndex, ocrRatio = 2.5) {
  const pdfMatch = findPdfListPrice(p, pdfIndex, pdfProducts);
  const mutbexMatch = findMutbexListPrice(p, mutbexIndex);
  if (pdfMatch?.listeEur > 0 && mutbexMatch?.listeEur > 0) {
    if (pdfMatch.listeEur > mutbexMatch.listeEur * ocrRatio) {
      return {
        listeEur: mutbexMatch.listeEur,
        matchKey: mutbexMatch.matchKey,
        source: "mutbex",
        mutbexCode: mutbexMatch.mutbexCode,
        satisEur: mutbexMatch.satisEur,
        rejectedPdf: pdfMatch,
      };
    }
  }
  if (pdfMatch?.listeEur > 0) {
    return { ...pdfMatch, source: pdfMatch.source || "pdf" };
  }
  if (mutbexMatch?.listeEur > 0) {
    return { ...mutbexMatch, source: "mutbex" };
  }
  return null;
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

  return null;
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

export function findManualSenoxKdvDahil(p) {
  for (const k of candidateKeys(p)) {
    if (SENOX_KDV_DAHIL_TL_OVERRIDES.has(k)) {
      return { kdvDahil: SENOX_KDV_DAHIL_TL_OVERRIDES.get(k), matchKey: k };
    }
  }
  return null;
}

export function pricingFromSenoxManualKdvDahil(kdvDahil, kur, kdv = 20, satisOran = 0.5) {
  const fmtTry = (n) => {
    const v = Math.round(Number(n));
    const parts = v.toFixed(2).split(".");
    const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${int},${parts[1]}`;
  };
  const kdvDahilRounded = Math.round(Number(kdvDahil));
  const netTry = kdvDahilRounded / (1 + kdv / 100);
  const satis = netTry / kur;
  const liste = satis / satisOran;
  return {
    liste_fiyati_eur: Math.round(liste * 100) / 100,
    satis_fiyati_eur: Math.round(satis * 100) / 100,
    satis_eur_indirimli: Math.round(satis * 100) / 100,
    satis_oran: satisOran,
    equsto_kar_oran: 0,
    kur_eur_try: kur,
    fiyat_tl: kdvDahilRounded,
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahilRounded)}`,
    fiyat_bekleniyor: false,
  };
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
