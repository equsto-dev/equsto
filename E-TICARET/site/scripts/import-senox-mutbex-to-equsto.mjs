#!/usr/bin/env node
/**
 * Mutbex Senox kataloğu → public/data/dept + ekipmanlar.json
 *
 *   node scripts/import-senox-mutbex-to-equsto.mjs
 *   node scripts/import-senox-mutbex-to-equsto.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { slugify } from "./lib/ozti-enrich.mjs";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import {
  findPdfListPrice,
  loadSenoxPdfCatalog,
  pricingFromSenoxPdfListe,
} from "./lib/senox-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_JSON = path.join(ROOT, "scripts/data/senox/mutbex/senox-mutbex-catalog.json");
const SRC_IMG = path.join(ROOT, "scripts/data/senox/mutbex/images");
const FALLBACK_IMG = path.join(ROOT, "public/data/senox/mutbex/images");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/senox/mutbex");

const BRAND = "Şenox";
const BRAND_ID = "senox";
const KAYNAK = "senox-mutbex";
const SATIS_ORAN = Number(process.env.EQUSTO_SENOX_SATIS_ORAN || "0.5");
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

/** mutbex.com kategori → dept + mevcut PLP slug */
const MUTBEX_CAT = {
  "Şişe Soğutucular": { dept: "sogutma", category: "bar-tipi-sise-sogutucu" },
  "Soğuk Teşhir Dolapları": { dept: "sogutma", category: "teshir-dolaplari" },
  "Dondurma Dolapları": { dept: "sogutma", category: "teshir-dolaplari" },
  "Su Sebilleri": { dept: "icecek", category: "su-sebilleri" },
  "Isıtıcı Lambalar": { dept: "servis", category: "servis-gerecleri" },
  "El Blenderları": { dept: "hazirlik", category: "robot-coupe-el-mikserleri" },
  "Şarap Dolapları": { dept: "sogutma", category: "sogutma-ekipmanlari" },
  "Yatay Tip Derin Dondurucular": { dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  "Meyve Suyu Soğutucuları": { dept: "icecek", category: "meyve-suyu-sogutuculari" },
  "Dondurma Makineleri": { dept: "hazirlik", category: "dondurma-makineleri" },
  "Duş Spreyleri": { dept: "yikama", category: "bulasik-makineleri-icin-evyeler" },
  "Sıcak Teşhir Dolapları ve Tezgahları": { dept: "sogutma", category: "teshir-dolaplari" },
  "Dik Tip Derin Dondurucular": { dept: "sogutma", category: "buzdolaplari-ve-derin-dondurucular" },
  "Soğutma Ekipmanları": { dept: "sogutma", category: "sogutma-ekipmanlari" },
  "Otel Ekipmanları": { dept: "servis", category: "servis-gerecleri" },
  "Endüstriyel Hamur Yoğurma Makineleri": { dept: "hazirlik", category: "hamur-yogurma-makineleri" },
  "Otomatik Kahve Değirmenleri": { dept: "kahve", category: "kahve-makineleri" },
  "Meyve Sıkma Makineleri": { dept: "icecek", category: "meyve-sikacaklari" },
  "Slush Makineleri": { dept: "icecek", category: "granita-slush" },
  "Su Arıtma Cihazları": { dept: "icecek", category: "su-sebilleri" },
  "Küp Buz Makineleri": { dept: "icecek", category: "buz-makineleri" },
  "Kapılı Tezgah Tip Buzdolapları": { dept: "sogutma", category: "tezgah-tipi-sogutucular" },
  "El Yıkama Evyeleri": { dept: "yikama", category: "el-yikama-evyeleri" },
  "Açık Büfe Servis Hatları": { dept: "servis", category: "self-servis-hatti" },
  "Mikrodalga Fırınlar": { dept: "set-ustu-mutfak", category: "mikrodalga-firin" },
  "Vakum ve Paketleme Makineleri": { dept: "hazirlik", category: "setustu-vakum-paketleme-makineleri" },
  "Bariyer ve Güvenlik Aksesuarları": { dept: "servis", category: "yardimci-ekipmanlar" },
  "Sinek Kovucu Cihazlar": { dept: "servis", category: "yardimci-ekipmanlar" },
  "Plastik Servis Tepsileri": { dept: "servis", category: "servis-gerecleri" },
  "Bıçak Sterilizatör Dolapları": { dept: "hazirlik", category: "bicak-sterilizatorleri" },
  "Buz Kıracakları": { dept: "icecek", category: "buz-makineleri" },
  "Bar Mikserleri": { dept: "kahve", category: "bar-blenderlar" },
  "Filtre Kahve Makineleri": { dept: "kahve", category: "filtre-kahve-makineleri" },
  "Davlumbazlar": { dept: "davlumbaz", category: "davlumbaz" },
  "Et Kemik Bıçakları": { dept: "hazirlik", category: "et-ve-kemik-testeresi" },
  "Sıcak Su Otomatları": { dept: "icecek", category: "su-otomati" },
  "Gıda Dilimleme Makineleri": { dept: "hazirlik", category: "fac-gida-dilimleme-makinesi" },
  "Stand Mikserler": { dept: "hazirlik", category: "mikserler" },
  "Bar Blenderları": { dept: "kahve", category: "bar-blenderlar" },
};

function mapDeptCategory(p) {
  const cat = String(p.category || "").trim();
  if (MUTBEX_CAT[cat]) return MUTBEX_CAT[cat];

  const hay = `${p.categoryPath || ""} ${p.category || ""} ${p.title || ""}`.toLocaleLowerCase("tr");
  if (/soğut|sogut|buzdolab|dondur|teşhir|teshir|şişe|sise/.test(hay)) {
    return { dept: "sogutma", category: "sogutma-ekipmanlari" };
  }
  if (/kahve|espresso|değirmen|degirmen/.test(hay)) {
    return { dept: "kahve", category: "kahve-makineleri" };
  }
  if (/içecek|icecek|meyve|slush|buz|su sebil|sebil/.test(hay)) {
    return { dept: "icecek", category: slugify(cat) || "icecek-bardaklari" };
  }
  if (/yıkama|yikama|duş|dus|evye/.test(hay)) {
    return { dept: "yikama", category: slugify(cat) || "evyeler" };
  }
  if (/servis|otel|büfe|bufe|tepsi/.test(hay)) {
    return { dept: "servis", category: slugify(cat) || "servis-gerecleri" };
  }
  if (/davlumbaz/.test(hay)) {
    return { dept: "davlumbaz", category: "davlumbaz" };
  }
  if (/mikrodalga|set.?üstü|set.?ustu/.test(hay)) {
    return { dept: "set-ustu-mutfak", category: slugify(cat) || "set-ustu-mutfak-ekipmanlari" };
  }
  return { dept: "hazirlik", category: slugify(cat) || "senox-diger" };
}

function formatSpecs(p, px, pdfMatch) {
  const lines = [
    p.title,
    "",
    p.description || "",
    "",
    `Ürün kodu: ${p.mutbexCode}`,
    `Model: ${p.model}`,
    `Kategori: ${p.categoryPath || p.category}`,
  ];
  if (p.olculer?.raw) lines.push(`Ölçü: ${p.olculer.raw}`);
  if (p.stockQty != null) lines.push(`Mutbex stok: ${p.stockQty}`);
  if (px) {
    lines.push(
      "",
      `Liste fiyatı (EUR, SENOX PDF): ${px.liste_fiyati_eur}`,
      `Equsto satış: liste × ${Math.round(SATIS_ORAN * 100)}% = ${px.satis_fiyati_eur} EUR`,
      `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    );
    if (pdfMatch?.matchKey) lines.push(`PDF eşleşme: ${pdfMatch.matchKey}${pdfMatch.fuzzy ? " (yakın)" : ""}`);
  }
  lines.push("", `Kaynak fiyat: SENOX 2026-1 PDF`, `Kaynak ürün: Mutbex — ${p.url || ""}`, `Marka: ${BRAND}`);
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

function toRow(p, kur, pdfIndex, pdfProducts) {
  const mapped = mapDeptCategory(p);
  const slug = senoxSlug(p);
  const pdfMatch = findPdfListPrice(p, pdfIndex, pdfProducts);
  const liste = pdfMatch?.listeEur || 0;
  const px = liste > 0 ? pricingFromSenoxPdfListe(liste, kur, KDV, SATIS_ORAN) : null;
  const images = copyImage(p);
  const olcu = p.olculer
    ? {
        olcu_etiket: p.olculer.raw || undefined,
        olculer: {
          genislik_mm: p.olculer.genislik_mm,
          derinlik_mm: p.olculer.derinlik_mm,
          yukseklik_mm: p.olculer.yukseklik_mm,
        },
      }
    : {};

  return {
    id: `${BRAND_ID}__${slug}`,
    dept: mapped.dept,
    category: mapped.category,
    brand: BRAND,
    name: p.title,
    price: px?.price || "Teklif için iletişim",
    fiyat_bekleniyor: !px,
    specs: formatSpecs(p, px, pdfMatch),
    aciklama: p.description || p.title,
    teknik_ozellikler: [
      p.mutbexCode ? `Mutbex kodu: ${p.mutbexCode}` : "",
      p.model ? `Model: ${p.model}` : "",
      p.olculer?.raw ? `Ölçü: ${p.olculer.raw}` : "",
      p.gtin ? `Barkod: ${p.gtin}` : "",
      pdfMatch?.matchKey ? `PDF kod: ${pdfMatch.matchKey}` : "",
    ].filter(Boolean),
    ...olcu,
    keywords: [BRAND, "Senox", p.model, p.mutbexCode, mapped.category, p.category].filter(Boolean),
    images: images.length ? images : undefined,
    sku: p.mutbexCode,
    model: p.model,
    urun_kodu: p.mutbexCode,
    mutbex_id: p.mutbexId,
    mutbex_url: p.url,
    kaynak: KAYNAK,
    kaynak_url: p.url,
    mutbex_stok: p.stockQty,
    senox_pdf_match: pdfMatch?.matchKey,
    senox_pdf_fuzzy: pdfMatch?.fuzzy || false,
    ...(px || {}),
    kaynak_fiyat_listesi: px ? "senox-pdf-2026-1" : undefined,
  };
}

function senoxSlug(p) {
  const base = slugify(p.model || p.mutbexCode || p.title || p.mutbexId);
  return base ? `${BRAND_ID}-${base}` : `${BRAND_ID}-${p.mutbexId}`;
}

function copyImage(p) {
  const id = p.mutbexId;
  if (!id) return [];
  let src = path.join(SRC_IMG, `${id}.jpg`);
  if (!fs.existsSync(src)) {
    const alt = path.join(FALLBACK_IMG, `${id}.jpg`);
    if (fs.existsSync(alt)) src = alt;
    else return [];
  }
  const destDir = OUT_IMG;
  const dest = path.join(destDir, `${id}.jpg`);
  if (!dryRun) {
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);
  }
  return [`images/catalog/senox/mutbex/${id}.jpg`];
}

function isSenoxMutbexRow(r) {
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
    console.error("Önce: npm run catalog:senox:mutbex");
    process.exit(1);
  }

  const raw = JSON.parse(await fsp.readFile(SRC_JSON, "utf8"));
  const products = raw.products || [];
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const pdfCatalog = loadSenoxPdfCatalog();
  const pdfIndex = pdfCatalog.index;
  console.log(`[senox-mutbex-import] PDF: ${pdfCatalog.liste} (${pdfCatalog.products.length} ürün, ${pdfIndex.size} kod)`);

  const rows = products.map((p) => toRow(p, kur, pdfIndex, pdfCatalog.products));
  const unmatched = products.filter((p) => !findPdfListPrice(p, pdfIndex, pdfCatalog.products));
  const byDept = rows.reduce((acc, r) => {
    (acc[r.dept] ||= []).push(r);
    return acc;
  }, {});

  const deptTotals = {};
  for (const dept of new Set([...Object.keys(byDept), "sogutma", "hazirlik", "icecek", "kahve"])) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) {
      kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isSenoxMutbexRow(r));
    }
    const add = byDept[dept] || [];
    const merged = [...kept, ...add];
    deptTotals[dept] = merged.length;
    if (!dryRun && add.length) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      writeJsonAtomic(file, merged);
    }
  }

  const priced = rows.filter((r) => !r.fiyat_bekleniyor).length;
  const imgOk = rows.filter((r) => r.images?.length).length;

  console.log(`[senox-mutbex-import] ${dryRun ? "DRY-RUN" : "OK"} ${rows.length} ürün`);
  console.log(`  fiyatlı: ${priced} | PDF eşleşmeyen: ${unmatched.length} | görselli: ${imgOk}`);
  console.log(`  satış formülü: PDF liste EUR × ${SATIS_ORAN} → TL + KDV %${KDV}`);
  if (unmatched.length) {
    console.log("  PDF eşleşmeyen örnek:", unmatched.slice(0, 8).map((p) => p.mutbexCode).join(", "));
  }
  for (const [d, list] of Object.entries(byDept)) {
    console.log(`  ${d}: +${list.length} (toplam ${deptTotals[d] ?? "—"})`);
  }

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("\nYerel vitrin:");
    console.log("  http://localhost:3099/shop/marka/senox");
    console.log("  http://localhost:3099/shop/sogutma?marka=Senox");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
