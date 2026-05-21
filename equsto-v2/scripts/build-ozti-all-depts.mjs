/**
 * Tüm Öztiryakiler fiyat+katalog (4754) → public/data/dept/*.json
 * Mevcut Atalay satırları korunur; eski Öztiryakiler satırları değiştirilir.
 *
 *   node scripts/build-ozti-all-depts.mjs
 * Önce (önerilen): npm run catalog:ozti:images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  OZTI_BRAND,
  OZTI_BRAND_ID,
  buildSpecs,
  isOztiBrand,
  loadPdfByKod,
  mapOztiDept,
  mapOztiIcecekCategory,
  mapOztiYikamaCategory,
  normKod,
  oztiCatalogImageHref,
  oztiPricingFields,
  oztiPricingLines,
  pdfYikamaProductName,
  slugify,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const PDF_ONLY = path.join(ROOT, "scripts/data/ozti-eslesme-pdf-only.json");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");

function loadImageManifest() {
  const p = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");
  if (!fs.existsSync(p)) return new Map();
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  return new Map(Object.entries(raw).map(([k, v]) => [normKod(k), v]));
}

function rowToVitrin(row, dept, category, pdfByKod, manifest) {
  const kod = row.urun_kodu;
  const pdfEntry = pdfByKod.get(normKod(kod));
  let cat = category || slugify(row.kategori) || "diger";
  if (dept === "yikama") {
    cat = mapOztiYikamaCategory(row.urun_tanimi || row.name, kod, row.kategori);
  }
  const enriched = buildSpecs(row, pdfEntry, cat, oztiPricingLines(row));
  const imgHref = oztiCatalogImageHref(kod, manifest.get(normKod(kod)));
  const pricing = oztiPricingFields(row);

  return {
    category: cat,
    brand: OZTI_BRAND,
    name: row.urun_tanimi || kod,
    price: "",
    specs: enriched.specs,
    aciklama: enriched.aciklama,
    teknik_ozellikler: enriched.teknik_ozellikler,
    olculer: enriched.olculer,
    keywords: enriched.keywords,
    images: imgHref ? [imgHref] : [],
    sku: kod,
    model: kod,
    ...pricing,
    kaynak: "ozti-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "ozti-fiyat-listesi-2025",
    dept,
    vitrin_arka_plan: dept === "set-ustu-mutfak",
    id: `${OZTI_BRAND_ID}__${slugify(kod)}`,
    urun_kodu: kod,
    barkod: row.barkod || null,
    pdf_eslesme: !!row.pdf_eslesme,
    pdf_sayfalar: row.pdf?.sayfalar,
  };
}

const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));
const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));
const pdfByKod = loadPdfByKod();
const manifest = loadImageManifest();

const byDept = new Map();
for (const row of rows) {
  const dept = mapOztiDept(row, allow);
  const kod = row.urun_kodu;
  const cat =
    dept === "icecek"
      ? mapOztiIcecekCategory(row.urun_tanimi, kod)
      : slugify(row.kategori) || "diger";
  if (!byDept.has(dept)) byDept.set(dept, []);
  byDept.get(dept).push(rowToVitrin(row, dept, cat, pdfByKod, manifest));
}

/** Fiyatta yok, PDF katalogda olan 9710.* bulaşık makineleri */
if (fs.existsSync(PDF_ONLY)) {
  const pdfOnly = JSON.parse(fs.readFileSync(PDF_ONLY, "utf8"));
  const existingKod = new Set(rows.map((r) => normKod(r.urun_kodu)));
  if (!byDept.has("yikama")) byDept.set("yikama", []);
  for (const p of pdfOnly) {
    const kod = p.urun_kodu_norm || p.urun_kodu;
    if (!kod || !/^9710\./i.test(kod) || existingKod.has(normKod(kod))) continue;
    const pdfEntry = pdfByKod.get(normKod(kod));
    const name = pdfYikamaProductName(kod, pdfEntry);
    const synthetic = {
      urun_kodu: kod,
      urun_tanimi: name,
      kategori: "BULAŞIK YIKAMA MAKİNELERİ",
      kategori_yolu: ["YIKAMA EKİPMANLARI", "BULAŞIK YIKAMA MAKİNELERİ"],
      liste_fiyati_eur: null,
      bayi_iskonto: null,
      pdf_eslesme: true,
    };
    const cat = mapOztiYikamaCategory(name, kod, synthetic.kategori);
    byDept
      .get("yikama")
      .push(rowToVitrin(synthetic, "yikama", cat, pdfByKod, manifest));
  }
}

const stats = {};
for (const [dept, oztiRows] of byDept) {
  const file = path.join(DEPT_DIR, `${dept}.json`);
  let kept = [];
  if (fs.existsSync(file)) {
    const existing = JSON.parse(fs.readFileSync(file, "utf8"));
    kept = existing.filter((r) => !isOztiBrand(r));
  }
  const merged = [...kept, ...oztiRows];
  fs.mkdirSync(DEPT_DIR, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(merged), "utf8");
  const imgN = oztiRows.filter((r) => r.images?.length).length;
  stats[dept] = { ozti: oztiRows.length, kept: kept.length, img: imgN };
}

console.log("[ozti-all-depts] toplam kaynak:", rows.length);
for (const [d, s] of Object.entries(stats).sort((a, b) => b[1].ozti - a[1].ozti)) {
  console.log(`  ${d}: +${s.ozti} ozti (${s.img} gorsel), ${s.kept} diger marka korundu`);
}
