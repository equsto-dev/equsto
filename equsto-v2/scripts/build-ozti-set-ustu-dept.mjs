/**
 * Öztiryakiler SETÜSTÜ MUTFAK → public/data/dept/set-ustu-mutfak.json
 *   node scripts/build-ozti-set-ustu-dept.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OZTI_BRAND,
  OZTI_BRAND_ID,
  buildSpecs,
  foldTr,
  loadPdfByKod,
  mapOztiDept,
  normKod,
  oztiPricingFields,
  oztiPricingLines,
  slugify,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");
const OUT = path.join(ROOT, "public/data/dept/set-ustu-mutfak.json");

function trRegexTest(pattern, hayUpper) {
  const p = foldTr(pattern).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!p) return false;
  return new RegExp(p, "i").test(foldTr(hayUpper));
}

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

function isSetUstu(row, allow) {
  return mapOztiDept(row, allow) === "set-ustu-mutfak";
}

function rowToVitrin(row, index, nav, pdfByKod, manifest) {
  const kod = row.urun_kodu;
  const tip = mapTip(row.kategori, index, nav);
  const pdfEntry = pdfByKod.get(normKod(kod));
  const enriched = buildSpecs(row, pdfEntry, tip, oztiPricingLines(row));
  const imgPath = manifest?.get(normKod(kod));
  const pricing = oztiPricingFields(row);

  return {
    category: tip,
    brand: OZTI_BRAND,
    name: row.urun_tanimi || kod,
    price: "",
    specs: enriched.specs,
    aciklama: enriched.aciklama,
    teknik_ozellikler: enriched.teknik_ozellikler,
    olculer: enriched.olculer,
    keywords: enriched.keywords,
    images: imgPath ? [imgPath] : [],
    sku: kod,
    model: kod,
    ...pricing,
    kaynak: "ozti-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "ozti-fiyat-listesi-2025",
    dept: "set-ustu-mutfak",
    vitrin_arka_plan: true,
    id: `${OZTI_BRAND_ID}__${slugify(kod)}`,
    urun_kodu: kod,
    barkod: row.barkod || null,
    pdf_eslesme: !!row.pdf_eslesme,
    pdf_sayfalar: row.pdf?.sayfalar,
  };
}

function loadImageManifest() {
  const p = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return new Map(Object.entries(raw).map(([k, v]) => [normKod(k), v]));
}

const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));
const kategoriTipIndex = buildKategoriTipIndex(cfg.nav, allow);
const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));
const pdfByKod = loadPdfByKod();
const manifest = loadImageManifest();
const out = rows
  .filter((r) => isSetUstu(r, allow))
  .map((r) => rowToVitrin(r, kategoriTipIndex, cfg.nav, pdfByKod, manifest));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), "utf8");

const counts = {};
let withImg = 0;
for (const r of out) {
  counts[r.category] = (counts[r.category] || 0) + 1;
  if (r.images?.length) withImg++;
}
console.log("[ozti-set-ustu] yazıldı:", out.length, "ürün,", withImg, "görselli →", path.relative(ROOT, OUT));
console.log("[ozti-set-ustu] servis-gerecleri:", counts["servis-gerecleri"] || 0);
