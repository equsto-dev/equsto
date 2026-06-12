#!/usr/bin/env node
/**
 * Şenox vakum makineleri — VM-01 fiyat düzeltmesi + WM-2 / VM-3 siteye ekleme
 * Kaynak: SENOX 2026-1 PDF s.67
 *
 *   node scripts/patch-senox-vakum-catalog.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";
import { pricingFromSenoxPdfListe } from "./lib/senox-pdf-prices.mjs";
import { MASTER_JSON_PATH } from "./catalog-master-paths.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const HAZIRLIK = path.join(ROOT, "public/data/dept/hazirlik.json");
const SATIS_ORAN = 0.5;
const KDV = 20;

const VAKUM = {
  "VM-01": {
    listeEur: 300,
    patchOnly: true,
  },
  "WM-2": {
    listeEur: 1800,
    id: "senox__senox-wm-2",
    slug: "senox-wm-2",
    model: "WM-2",
    markaUrunKodu: "WM-2",
    equstoKod: "EQ-ŞENOX.WM-2",
    name: "Senox WM-2 Tek Çene Vakum Makinesi",
    image: "data/senox/images/senox-wm-2-tek-enevakum-mak-nes_1.jpg",
    pdfMatch: "WM2",
    aciklama:
      "Senox WM-2 Tek Çene Vakum Makinesi. Marka: Seles, model Dz 280. Vakumlama ölçüleri: 280×385×110 mm. Vakum pompa kapasitesi: 10 m³/h. Vakumlama süresi: 1–2 dk. Yapıştırma: tek çene. Besleme: 220 V / 50 Hz. Ebatlar: 480×330×320 mm. Güç: 370 W. Ağırlık: 36 kg.",
    teknik: [
      "Marka: Seles",
      "Model: Dz 280",
      "Vakumlama ölçüleri (mm): 280 × 385 × 110",
      "Vakum pompa kapasitesi: 10 m³/h",
      "Yapıştırma: tek çene",
      "Güç: 370 W",
      "Ağırlık: 36 kg",
      "Ambalaj ölçüleri (mm): 560 × 430 × 425",
      "PDF kod: WM2",
      "Katalog sayfası: 67",
    ],
    olculer: { genislik_mm: 480, derinlik_mm: 330, yukseklik_mm: 320 },
    olcuEtiket: "480×330×320 mm",
  },
  "VM-3": {
    listeEur: 2400,
    id: "senox__senox-vm-3",
    slug: "senox-vm-3",
    model: "VM-3",
    markaUrunKodu: "VM-3",
    equstoKod: "EQ-ŞENOX.VM-3",
    name: "Senox VM 3 Çift Çene Vakum Makinesi",
    image: "data/senox/images/senox-vm-3-ft-ene-vakum-mak-nes_1.jpg",
    pdfMatch: "VM3",
    aciklama:
      "Senox VM 3 Çift Çene Vakum Makinesi. Marka: Seles, model DZ-400 2F. Vakumlama ölçüleri: 440×420×125 mm. Vakum pompa kapasitesi: 20 m³/h. Vakumlama süresi: 1–2 dk. Yapıştırma: çift çene. Besleme: 220 V / 50 Hz. Ebatlar: 555×475×450 mm. Güç: 900 W. Ağırlık: 76 kg.",
    teknik: [
      "Marka: Seles",
      "Model: DZ-400 2F",
      "Vakumlama ölçüleri (mm): 440 × 420 × 125",
      "Vakum pompa kapasitesi: 20 m³/h",
      "Yapıştırma: çift çene",
      "Güç: 900 W",
      "Ağırlık: 76 kg",
      "Ambalaj ölçüleri (mm): 610 × 430 × 480",
      "PDF kod: VM3",
      "Katalog sayfası: 67",
    ],
    olculer: { genislik_mm: 555, derinlik_mm: 475, yukseklik_mm: 450 },
    olcuEtiket: "555×475×450 mm",
  },
};

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function patchSpecsListPrice(specs, liste, satis, kur) {
  return String(specs || "")
    .replace(/Liste fiyatı \(EUR, SENOX PDF\): \d+(?:\.\d+)?/g, `Liste fiyatı (EUR, SENOX PDF): ${liste}`)
    .replace(/Equsto satış: liste × 50% = \d+(?:\.\d+)? EUR/g, `Equsto satış: liste × 50% = ${satis} EUR`)
    .replace(/Kur: 1 EUR = [\d.]+ TRY/g, `Kur: 1 EUR = ${kur} TRY`);
}

function formatSpecs(def, px) {
  return [
    def.name,
    "",
    def.aciklama,
    "",
    `Model: ${def.model}`,
    `Kategori: Vakum ve Paketleme Makineleri`,
    `Ölçü: ${def.olcuEtiket}`,
    "",
    `Liste fiyatı (EUR, SENOX PDF): ${px.liste_fiyati_eur}`,
    `Equsto satış: liste × 50% = ${px.satis_fiyati_eur} EUR`,
    `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${KDV})`,
    `PDF eşleşme: ${def.pdfMatch}`,
    "",
    "Kaynak fiyat: SENOX 2026-1 PDF",
    "Marka: Şenox",
  ].join("\n");
}

function buildRow(def, kur) {
  const px = pricingFromSenoxPdfListe(def.listeEur, kur, KDV, SATIS_ORAN);
  return {
    id: def.id,
    dept: "hazirlik",
    category: "setustu-vakum-paketleme-makineleri",
    brand: "Şenox",
    name: def.name,
    price: px.price,
    fiyat_bekleniyor: false,
    specs: formatSpecs(def, px),
    aciklama: def.aciklama,
    teknik_ozellikler: def.teknik,
    olcu_etiket: def.olcuEtiket,
    olculer: def.olculer,
    keywords: [
      "Şenox",
      "Senox",
      def.model,
      "setustu-vakum-paketleme-makineleri",
      "Vakum ve Paketleme Makineleri",
      "vakum makinesi",
    ],
    images: [def.image],
    image_kaynak: "senox-pdf-2026-1",
    sku: def.model,
    model: def.model,
    urun_kodu: def.model,
    kaynak: "senox-pdf",
    kaynak_fiyat_listesi: "senox-pdf-2026-1",
    senox_pdf_match: def.pdfMatch,
    senox_pdf_fuzzy: false,
    equsto_kod: def.equstoKod,
    marka_kodu: "ŞENOX",
    marka_urun_kodu: def.markaUrunKodu,
    urun_kategori: "Hazırlık",
    urun_alt_kategori: "Setustu Vakum Paketleme Makineleri",
    alt_kategori_1: "Vakum ve Paketleme Makineleri",
    alt_kategori_2: "",
    kategori_yolu: [
      "Hazırlık",
      "Setustu Vakum Paketleme Makineleri",
      "Vakum ve Paketleme Makineleri",
    ],
    iskonto_oran: 50,
    ...px,
  };
}

function masterEntry(row) {
  return {
    equsto_kod: row.equsto_kod,
    marka: row.brand,
    marka_kodu: row.marka_kodu,
    marka_urun_kodu: row.marka_urun_kodu,
    aciklama: row.name,
    teknik_ozellikler: row.specs,
    olculer: row.olcu_etiket || "",
    fiyat_eur: row.liste_fiyati_eur,
    urun_kategori: row.urun_kategori,
    urun_alt_kategori: row.urun_alt_kategori,
    alt_kategori_1: row.alt_kategori_1,
    alt_kategori_2: row.alt_kategori_2,
    dept: row.dept,
    category: row.category,
    id: row.id,
    fiyat_tl: row.fiyat_tl,
    image: row.images?.[0] || "",
  };
}

async function main() {
  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const rows = JSON.parse(fs.readFileSync(HAZIRLIK, "utf8"));
  const vm01Idx = rows.findIndex((r) => r.id === "senox__senox-vm-01");
  if (vm01Idx < 0) {
    console.error("VM-01 bulunamadı");
    process.exit(1);
  }

  const vm01Px = pricingFromSenoxPdfListe(VAKUM["VM-01"].listeEur, kur, KDV, SATIS_ORAN);
  const vm01 = { ...rows[vm01Idx], ...vm01Px, iskonto_oran: 50, kaynak_fiyat_listesi: "senox-pdf-2026-1" };
  vm01.specs = patchSpecsListPrice(
    vm01.specs,
    vm01Px.liste_fiyati_eur,
    vm01Px.satis_fiyati_eur,
    kur,
  );
  rows[vm01Idx] = vm01;

  const added = [];
  for (const key of ["WM-2", "VM-3"]) {
    const def = VAKUM[key];
    if (rows.some((r) => r.id === def.id)) {
      console.log(`[skip] ${def.id} zaten var`);
      continue;
    }
    const row = buildRow(def, kur);
    rows.push(row);
    added.push(row);
  }

  writeJsonAtomic(HAZIRLIK, rows);

  if (fs.existsSync(MASTER_JSON_PATH)) {
    const master = JSON.parse(fs.readFileSync(MASTER_JSON_PATH, "utf8"));
    const products = master.products || [];
    const vmMaster = products.find((p) => p.id === "senox__senox-vm-01");
    if (vmMaster) {
      vmMaster.fiyat_eur = vm01Px.liste_fiyati_eur;
      vmMaster.fiyat_tl = vm01Px.fiyat_tl;
      vmMaster.teknik_ozellikler = vm01.specs;
    }
    for (const row of added) {
      if (!products.some((p) => p.id === row.id)) {
        products.push(masterEntry(row));
        master.count = products.length;
      }
    }
    master.generated = new Date().toISOString();
    writeJsonAtomic(MASTER_JSON_PATH, master);
  }

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  console.log(
    `[senox-vakum] VM-01 liste ${vm01Px.liste_fiyati_eur} EUR → ₺${vm01Px.fiyat_tl} KDV dahil | +${added.length} ürün`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
