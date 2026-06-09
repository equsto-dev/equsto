#!/usr/bin/env node
/**
 * Vosco web + PDF → Equsto vitrin
 *
 *   node scripts/import-vosco-to-equsto.mjs
 *   node scripts/import-vosco-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurUsdRates } from "./fetch-tcmb-kur.mjs";
import {
  findPdfListPrice,
  loadVoscoPdfCatalog,
  pricingFromVoscoPdfListe,
} from "./lib/vosco-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/vosco/vosco-web-catalog.json");
const SRC_IMG = path.join(ROOT, "scripts/data/vosco/images");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/vosco");

const BRAND = "Vosco";
const BRAND_ID = "vosco";
const KAYNAK = "vosco-web";
const SATIS_ORAN = Number(process.env.EQUSTO_VOSCO_SATIS_ORAN || "0.55");
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

const VOSCO_CAT = {
  "Buz Makineleri": { dept: "icecek", category: "buz-makineleri" },
  "Teşhir Dolapları": { dept: "sogutma", category: "teshir-dolaplari" },
  "Soğutucu Dolaplar": { dept: "sogutma", category: "sogutma-ekipmanlari" },
  "Dondurma Makineleri": { dept: "hazirlik", category: "dondurma-makineleri" },
  "Kahve Değirmenleri": { dept: "kahve", category: "kahve-makineleri" },
  "Kahve Makineleri": { dept: "kahve", category: "kahve-makineleri" },
  "Kahve Ekipmanları": { dept: "kahve", category: "kahve-makineleri" },
  "Bar Blenderları": { dept: "kahve", category: "bar-blenderlar" },
  "Mikserler": { dept: "hazirlik", category: "mikserler" },
  "Meyve Sıkacağı": { dept: "icecek", category: "meyve-sikacaklari" },
  "Meyve Suyu Dispanserleri": { dept: "icecek", category: "meyve-suyu-sogutuculari" },
  "İndüksiyonlu Fritözler": { dept: "set-ustu-mutfak", category: "endustriyel-ocaklar" },
  "Fritözler": { dept: "set-ustu-mutfak", category: "endustriyel-ocaklar" },
  "Waffle Makineleri": { dept: "set-ustu-mutfak", category: "waffle-makineleri" },
  "Krep Makineleri": { dept: "set-ustu-mutfak", category: "krep-makineleri" },
  "Tost Makinesi": { dept: "set-ustu-mutfak", category: "tost-makineleri" },
  "Ekmek Kızartma Makinesi": { dept: "set-ustu-mutfak", category: "ekmek-kizartma-makineleri" },
  "Et Dilimleme Makineleri": { dept: "hazirlik", category: "fac-gida-dilimleme-makinesi" },
  "Sebze ve Et Doğrayıcılar": { dept: "hazirlik", category: "sebze-dograma-makineleri" },
  "Konveksiyonlu Fırınlar": { dept: "set-ustu-mutfak", category: "konveksiyonel-firinlar" },
  "Pizza Fırınları": { dept: "set-ustu-mutfak", category: "pizza-firinlari" },
  "Piliç Çevirme Fırınları": { dept: "set-ustu-mutfak", category: "tavuk-pisirme-makineleri" },
  "Pamuk Şeker Makineleri": { dept: "hazirlik", category: "pamuk-seker-makineleri" },
  "Patlamış Mısır": { dept: "hazirlik", category: "patlamis-misir-makineleri" },
  "Buzlaş": { dept: "icecek", category: "granita-slush" },
};

function mapDeptCategory(p) {
  const cat = String(p.category || "").trim();
  if (VOSCO_CAT[cat]) return VOSCO_CAT[cat];
  const hay = `${p.categoryPath || ""} ${p.category || ""} ${p.title || ""}`.toLocaleLowerCase("tr");
  if (/buz\s*mak|buzla|slush|granita/.test(hay)) return { dept: "icecek", category: "buz-makineleri" };
  if (/teşhir|teshir|soğut|sogut|dolap/.test(hay)) return { dept: "sogutma", category: "teshir-dolaplari" };
  if (/kahve|espresso|değirmen|degirmen/.test(hay)) return { dept: "kahve", category: "kahve-makineleri" };
  if (/dondurma/.test(hay)) return { dept: "hazirlik", category: "dondurma-makineleri" };
  if (/fritöz|fritoz|indüksiyon|induksiyon|ocak|firin|fırın/.test(hay)) {
    return { dept: "set-ustu-mutfak", category: slugify(cat) || "set-ustu-mutfak-ekipmanlari" };
  }
  if (/meyve|juice|sıkac|sikac|dispanser/.test(hay)) return { dept: "icecek", category: "meyve-sikacaklari" };
  if (/blender|mikser|kokteyl/.test(hay)) return { dept: "kahve", category: "bar-blenderlar" };
  if (/dilim|doğra|dogra|kıyma|kiyma/.test(hay)) return { dept: "hazirlik", category: "fac-gida-dilimleme-makinesi" };
  return { dept: "hazirlik", category: slugify(cat) || "vosco-diger" };
}

function voscoSlug(p) {
  const base = slugify(p.stockCode || p.title || String(p.productId));
  return base ? `${BRAND_ID}-${base}` : `${BRAND_ID}-${p.productId}`;
}

function formatSpecs(p, px, pdfMatch) {
  const teknik = Object.entries(p.teknik_ozellikler || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const lines = [p.title, "", p.description || "", teknik ? `\n${teknik}` : "", "", `Stok kodu: ${p.stockCode}`, `Kategori: ${p.categoryPath || p.category}`];
  if (p.olculer?.raw) lines.push(`Ölçü: ${p.olculer.raw}`);
  if (px) {
    lines.push(
      "",
      `PDF kaynak (USD): $${px.liste_fiyati_usd_pdf}`,
      `Liste fiyatı (EUR): ${px.liste_fiyati_eur} EUR (USD→EUR kur: ${px.kur_usd_eur})`,
      `Equsto satış: liste × ${Math.round(SATIS_ORAN * 100)}% = ${px.satis_fiyati_eur} EUR`,
      `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    );
    if (pdfMatch?.matchKey) lines.push(`PDF eşleşme: ${pdfMatch.matchKey}${pdfMatch.fuzzy ? " (yakın)" : ""}`);
  }
  lines.push("", `Kaynak fiyat: Vosco Katalog 2026 PDF`, `Kaynak ürün: vosco.com.tr — ${p.url}`, `Marka: ${BRAND}`);
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

function copyImage(p) {
  if (!p.localImage) return [];
  const src = path.join(ROOT, "scripts/data/vosco", p.localImage);
  if (!fs.existsSync(src)) return [];
  const fname = path.basename(src);
  const dest = path.join(OUT_IMG, fname);
  if (!dryRun) {
    fs.mkdirSync(OUT_IMG, { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return [`images/catalog/vosco/${fname}`];
}

function toRow(p, eurTry, usdTry, pdfIndex, pdfProducts) {
  const mapped = mapDeptCategory(p);
  const pdfMatch = findPdfListPrice(p, pdfIndex, pdfProducts);
  const listeUsd = pdfMatch?.listeUsd || 0;
  const px = listeUsd > 0 ? pricingFromVoscoPdfListe(listeUsd, eurTry, usdTry, KDV, SATIS_ORAN) : null;
  const images = copyImage(p);
  const teknikList = Object.entries(p.teknik_ozellikler || {}).map(([k, v]) => `${k}: ${v}`);
  return {
    id: `${BRAND_ID}__${voscoSlug(p)}`,
    dept: mapped.dept,
    category: mapped.category,
    brand: BRAND,
    name: p.title,
    price: px?.price || "Teklif için iletişim",
    fiyat_bekleniyor: !px,
    specs: formatSpecs(p, px, pdfMatch),
    aciklama: p.description || p.title,
    teknik_ozellikler: teknikList,
    olculer: p.olculer?.genislik_cm
      ? {
          olcu_etiket: p.olculer.raw,
          olculer: {
            genislik_mm: Math.round(p.olculer.genislik_cm * 10),
            derinlik_mm: Math.round(p.olculer.derinlik_cm * 10),
            yukseklik_mm: Math.round(p.olculer.yukseklik_cm * 10),
          },
        }
      : p.olculer?.genislik_mm
        ? { olcu_etiket: p.olculer.raw, olculer: p.olculer }
        : {},
    keywords: [BRAND, p.stockCode, mapped.category, p.category].filter(Boolean),
    images: images.length ? images : undefined,
    sku: p.stockCode,
    model: p.stockCode,
    urun_kodu: p.stockCode,
    vosco_product_id: p.productId,
    kaynak: KAYNAK,
    kaynak_url: p.url,
    vosco_pdf_match: pdfMatch?.matchKey,
    vosco_pdf_fuzzy: pdfMatch?.fuzzy || false,
    ...(px || {}),
    kaynak_fiyat_listesi: px ? "vosco-pdf-2026" : undefined,
  };
}

function isVoscoRow(r) {
  return String(r?.kaynak || "") === KAYNAK || String(r?.id || "").startsWith(`${BRAND_ID}__`);
}

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function main() {
  if (!fs.existsSync(SRC_JSON)) {
    console.error("Önce: npm run catalog:vosco:scrape");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(SRC_JSON, "utf8"));
  const products = raw.products || [];
  const tcmb = await fetchTcmbEurUsdRates();
  const eurTry =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.eurTry;
  const usdTry =
    Number(process.env.EQUSTO_USD_TRY) > 0 ? Number(process.env.EQUSTO_USD_TRY) : tcmb.usdTry;
  const usdEur = usdTry / eurTry;

  const pdfCatalog = loadVoscoPdfCatalog();
  console.log(`[vosco-import] PDF: ${pdfCatalog.products.length} ürün, ${pdfCatalog.index.size} kod`);
  console.log(`[vosco-import] kur: 1 EUR = ${eurTry} TRY, 1 USD = ${usdTry} TRY, 1 USD = ${usdEur.toFixed(4)} EUR`);

  const rows = products.map((p) => toRow(p, eurTry, usdTry, pdfCatalog.index, pdfCatalog.products));
  const unmatched = products.filter((p) => !findPdfListPrice(p, pdfCatalog.index, pdfCatalog.products));

  const byDept = rows.reduce((acc, r) => {
    (acc[r.dept] ||= []).push(r);
    return acc;
  }, {});

  for (const [dept, add] of Object.entries(byDept)) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isVoscoRow(r));
    const merged = [...kept, ...add];
    if (!dryRun && add.length) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      writeJsonAtomic(file, merged);
    }
    console.log(`  ${dept}: +${add.length} (toplam ${merged.length})`);
  }

  const priced = rows.filter((r) => !r.fiyat_bekleniyor).length;
  console.log(`[vosco-import] ${dryRun ? "DRY-RUN" : "OK"} ${rows.length} ürün`);
  console.log(`  fiyatlı: ${priced} | PDF eşleşmeyen: ${unmatched.length}`);
  console.log(`  satış: PDF USD → EUR liste, × ${SATIS_ORAN} → TL + KDV %${KDV}`);

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("\nYerel vitrin: http://localhost:3099/shop/marka/vosco");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
