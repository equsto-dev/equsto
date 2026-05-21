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
  normKod,
  oztiPricingFields,
  oztiPricingLines,
  slugify,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
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
  const cat = category || slugify(row.kategori) || "diger";
  const enriched = buildSpecs(row, pdfEntry, cat, oztiPricingLines(row));
  const imgPath = manifest.get(normKod(kod));
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
    images: imgPath ? [imgPath] : [],
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
  const cat = slugify(row.kategori) || "diger";
  if (!byDept.has(dept)) byDept.set(dept, []);
  byDept.get(dept).push(rowToVitrin(row, dept, cat, pdfByKod, manifest));
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
