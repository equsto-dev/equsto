/**
 * Set üstü mutfak — Excel kategori → mağaza ?tip= eşlemesi.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");

function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

function slugify(s) {
  return foldTr(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function trRegexTest(pattern, hayUpper) {
  const p = foldTr(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!p) return false;
  return new RegExp(p, "i").test(foldTr(hayUpper));
}

export function buildKategoriTipIndex(nav, allow) {
  const idx = {};
  const navRows = nav.map((n) => ({
    tip: n.tip,
    labelU: String(n.label || "")
      .toLocaleUpperCase("tr")
      .trim(),
    keys: String(n.search || n.label)
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean),
  }));

  function assign(key, tip) {
    const ku = String(key || "")
      .toLocaleUpperCase("tr")
      .trim();
    if (!ku || !tip) return;
    if (!idx[ku]) idx[ku] = tip;
  }

  for (const n of navRows) assign(n.labelU, n.tip);

  const overrides = {
    AKSESUARLAR: "mutfak-aksesuar",
    "BAR AKSESUARLARI": "mutfak-aksesuar",
    ARABALAR: "tasima-ekipman",
    "BANKET ARABALAR": "tasima-ekipman",
    "TAŞIMA EKİPMANLARI": "tasima-ekipman",
    "ÇOK AMAÇLI ARABALAR": "tasima-ekipman",
    "GN SERVİS TEPSİLERİ": "gastronorm-kuvet",
    "DELİKLİ GASTRONOM KÜVETLER": "gastronorm-kuvet",
    "GURMEAID PROFESYONEL BIÇAKLAR": "gurmeaid-bicak",
    "KOMBİ KONVEKSİYONLU FIRIN AKSESUARLAR": "mutfak-aksesuar",
    "STANDART GASTRONORM KÜVETLER": "gastronorm-kuvet",
    "KÖŞE DESENLİ GASTRONORM KÜVETLER": "gastronorm-kuvet",
    "GN KÜVETLER YAPIŞMAZ KAPLAMALI": "gastronorm-kuvet",
    "SAPLI GASTRONORM KÜVETLER": "gastronorm-kuvet",
    "GASTRONORM KAPAKLAR": "gastronorm-kuvet",
    "POLİPROPİLEN GASTRONORM KÜVETLER": "pp-pc-gn",
    "POLİKARBONAT GASTRONORM KÜVETLER": "pp-pc-gn",
    "BAIN MARIE ÇELİK SAKLAMA KAPLARI": "bain-marie-kap",
    "KARIŞTIRMA KAPLARI VE SÜZGEÇLER": "karistirma-suzgec",
    "EKMEK KIZARTMA MAKİNELERİ": "masaustu-ekipman",
    "WAFFLE MAKİNELERİ": "masaustu-ekipman",
    "KREP MAKİNELERİ": "masaustu-ekipman",
    "ÇÖP KOVALARI": "mutfak-aksesuar",
    "ÇÖP KONTEYNERLERİ": "mutfak-aksesuar",
    "TERAZİLER": "mutfak-aksesuar",
    "PRES BASKI TEPSİLER": "pres-baski-tepsi",
    "POLİETİLEN KESME TAHTALARI": "kesme-tahtasi",
    "TABAK DİSPENSERLERİ": "servis-gerecleri",
    "ÇÖP ÖĞÜTME MAKİNELERİ": "mutfak-aksesuar",
    "GEMİ MUTFAĞI": "masaustu-ekipman",
  };
  for (const [key, tip] of Object.entries(overrides)) assign(key, tip);

  for (const leaf of allow) {
    const lu = String(leaf).toLocaleUpperCase("tr").trim();
    let tip = null;
    for (const n of navRows) {
      if (lu === n.labelU) {
        tip = n.tip;
        break;
      }
    }
    if (!tip) {
      let bestLen = 0;
      for (const n of navRows) {
        if (!n.labelU) continue;
        if (lu.indexOf(n.labelU) >= 0 && n.labelU.length > bestLen) {
          tip = n.tip;
          bestLen = n.labelU.length;
        }
      }
    }
    if (!tip) {
      for (const n of navRows) {
        for (const key of n.keys) {
          if (trRegexTest(key, lu)) {
            tip = n.tip;
            break;
          }
        }
        if (tip) break;
      }
    }
    if (tip) assign(lu, tip);
  }
  return idx;
}

export function mapSetUstuTip(kategori, index, nav) {
  const ku = String(kategori || "")
    .toLocaleUpperCase("tr")
    .trim();
  if (!ku) return "diger";
  if (index[ku]) return index[ku];
  let best = null;
  let bestLen = 0;
  for (const [key, tip] of Object.entries(index)) {
    if (ku.indexOf(key) >= 0 && key.length > bestLen) {
      best = tip;
      bestLen = key.length;
    }
  }
  if (best) return best;
  for (const n of nav) {
    const labelU = String(n.label || "")
      .toLocaleUpperCase("tr")
      .trim();
    if (labelU && (ku === labelU || ku.indexOf(labelU) >= 0)) return n.tip;
    const keys = String(n.search || n.label)
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);
    for (const key of keys) {
      if (trRegexTest(key, ku)) return n.tip;
    }
  }
  return slugify(kategori) || "diger";
}

let _cached = null;

/** Lazy singleton — ozti-set-ustu-kategoriler.json */
export function getSetUstuTipContext() {
  if (_cached) return _cached;
  const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
  const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));
  _cached = {
    nav: cfg.nav,
    allow,
    index: buildKategoriTipIndex(cfg.nav, allow),
  };
  return _cached;
}
