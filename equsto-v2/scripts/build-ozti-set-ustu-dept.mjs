/**
 * Öztiryakiler SETÜSTÜ MUTFAK EKİPMANLARI → public/data/dept/set-ustu-mutfak.json
 *   node scripts/build-ozti-set-ustu-dept.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");
const OUT = path.join(ROOT, "public/data/dept/set-ustu-mutfak.json");
const BRAND = "Öztiryakiler Endüstriyel Mutfak";
const BRAND_ID = "oztiryakiler-endustriyel-mutfak";

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

/** PDF yaprak + nav → Excel kategori adı → ?tip= slug */
function buildKategoriTipIndex(nav, allow) {
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

  for (const n of navRows) {
    assign(n.labelU, n.tip);
  }

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

function mapTip(kategori, index, nav) {
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

/** Excel bayi_iskonto = indirim oranı (0,65 → %65); satış = liste × (1 − oran). */
function oztiSatisEur(liste, bayiIsk) {
  const L = Number(liste);
  if (!(L > 0)) return null;
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return Math.round(L * 100) / 100;
  return Math.round(L * (1 - isk) * 100) / 100;
}

function oztiIskontoYuzde(bayiIsk) {
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return 0;
  return Math.round(isk * 10000) / 100;
}

function isSetUstu(row, allow) {
  const pathHay = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  if (/SETÜSTÜ\s*MUTFAK|SETUSTU\s*MUTFAK/.test(pathHay)) return true;
  if (allow.includes(kat)) return true;
  for (const a of allow) {
    if (a && kat.indexOf(a) >= 0) return true;
  }
  return false;
}

function rowToVitrin(row, index, nav) {
  const kod = row.urun_kodu;
  const tip = mapTip(row.kategori, index, nav);
  const liste = row.liste_fiyati_eur ?? row.liste_fiyati;
  const iskPct = oztiIskontoYuzde(row.bayi_iskonto);
  const odeme =
    row.odeme_carpani != null
      ? Number(row.odeme_carpani)
      : iskPct > 0
        ? Math.round((1 - Number(row.bayi_iskonto)) * 10000) / 10000
        : 1;
  const satis = oztiSatisEur(liste, row.bayi_iskonto) ?? liste;
  const specs = [
    row.urun_tanimi,
    `Ürün kodu: ${kod}`,
    `Liste (EUR): ${liste}`,
    `Bayi iskonto: %${iskPct || "—"} (ödeme çarpanı ${odeme})`,
    `Satış (EUR): ${satis}`,
    `Kategori: ${row.kategori || ""}`,
    "Kaynak: Öztiryakiler Fiyat Listesi 2025",
  ].join("\n");

  return {
    category: tip,
    brand: BRAND,
    name: row.urun_tanimi || kod,
    price: "",
    specs,
    images: [],
    sku: kod,
    model: kod,
    liste_fiyati_eur: liste,
    satis_fiyati_eur: satis,
    bayi_iskonto: row.bayi_iskonto,
    odeme_carpani: odeme,
    iskonto_yuzde: iskPct,
    iskonto_oran: iskPct,
    para_birimi: row.para_birimi || "EUR",
    kaynak: "ozti-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "ozti-2025-set-ustu-mutfak",
    dept: "set-ustu-mutfak",
    vitrin_arka_plan: true,
    id: slugId(kod),
    urun_kodu: kod,
    pdf_eslesme: !!row.pdf_eslesme,
    pdf_sayfalar: row.pdf?.sayfalar,
  };
}

function slugId(kod) {
  return `${BRAND_ID}__${slugify(kod)}`;
}

const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));
const kategoriTipIndex = buildKategoriTipIndex(cfg.nav, allow);
const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));
const out = rows.filter((r) => isSetUstu(r, allow)).map((r) => rowToVitrin(r, kategoriTipIndex, cfg.nav));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), "utf8");

const counts = {};
for (const r of out) counts[r.category] = (counts[r.category] || 0) + 1;
const navTips = new Set(cfg.nav.map((n) => n.tip));
const orphan = Object.keys(counts).filter((c) => !navTips.has(c));
console.log("[ozti-set-ustu] yazıldı:", out.length, "ürün →", path.relative(ROOT, OUT));
console.log("[ozti-set-ustu] servis-gerecleri:", counts["servis-gerecleri"] || 0);
if (orphan.length) console.warn("[ozti-set-ustu] nav dışı category:", orphan.join(", "));
