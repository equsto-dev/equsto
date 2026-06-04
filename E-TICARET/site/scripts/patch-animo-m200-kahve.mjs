/**
 * Animo M200 filtre kahve — kahve dept + manifest
 * node scripts/patch-animo-m200-kahve.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const kahvePath = path.join(ROOT, "public/data/dept/kahve.json");
const manifestPath = path.join(ROOT, "public/images/catalog/ozti/_manifest.json");

const kur = 53.2979;
const liste = 650;
const alis = Math.round(liste * 0.42 * 100) / 100;
const satis = Math.round(alis * 1.08 * 100) / 100;
const fiyat_tl_net = Math.round(satis * kur);
const fiyat_tl = Math.round(fiyat_tl_net * 1.2);

const row = {
  category: "filtre-kahve-makineleri",
  brand: "Öztiryakiler Endüstriyel Mutfak",
  name: "FILTRE KAHVE MAKINESI ANIMO M200 Cam Sürahi",
  price: `₺${fiyat_tl.toLocaleString("tr-TR")},00 KDV dahil`,
  specs: [
    "FILTRE KAHVE MAKINESI ANIMO M200 Cam Sürahi",
    "",
    "Ürün kodu: 9574.M200.00",
    `Liste fiyatı (EUR): ${liste}`,
    "Bayi iskonto: %58 (kalan oran 0.42)",
    `Bayi net alış (EUR): ${alis}`,
    `Equsto satış (EUR): ${satis} (+%8 kar)`,
    `Equsto satış (TL, KDV dahil): ₺${fiyat_tl.toLocaleString("tr-TR")},00`,
    `Kur: 1 EUR = ${kur} TRY (KDV %20)`,
    "Kategori: FİLTRE KAHVE MAKİNELERİ",
    "Kaynak: Animo M-Line (Öztiryakiler distribütör)",
    "",
    "Teknik Özellikler",
    "Marka: Animo",
    "Model: M200",
    "Güç: 2,25 kW",
    "Kapasite: ~112 fincan/saat",
  ].join("\n"),
  aciklama:
    "FILTRE KAHVE MAKINESI ANIMO M200 — cam sürahi, profesyonel filtre kahve",
  teknik_ozellikler: ["Marka: Animo", "Model: M200", "Güç: 2,25 kW"],
  olculer: { genislik_mm: 420, derinlik_mm: 380, yukseklik_mm: 625 },
  keywords: [
    "Animo",
    "M200",
    "9574.M200.00",
    "filtre kahve",
    "filtre-kahve-makineleri",
    "FILTRE KAHVE MAKINESI ANIMO M200",
  ],
  images: ["images/catalog/ozti/web/ozti-9574-m200-00.jpg"],
  sku: "9574.M200.00",
  model: "M200",
  liste_fiyati: liste,
  liste_fiyati_eur: liste,
  alis_fiyati: alis,
  alis_fiyati_eur: alis,
  satis_fiyati_eur: satis,
  satis_eur_indirimli: satis,
  iskontolu_fiyat: satis,
  equsto_kar_oran: 0.08,
  bayi_iskonto: 0.58,
  odeme_carpani: 0.42,
  iskonto_oran: 58,
  para_birimi: "EUR",
  fiyat_kaynagi: "animo-m200-oem",
  fiyat_tl_net,
  fiyat_tl,
  kdv_oran: 20,
  kaynak: "animo-m200-oem",
  kaynak_fiyat_listesi: "animo-m200-oem",
  dept: "kahve",
  id: "oztiryakiler-endustriyel-mutfak__9574-m200-00",
};

const k = JSON.parse(fs.readFileSync(kahvePath, "utf8"));
const idx = k.findIndex((x) => x.sku === "9574.M200.00");
if (idx >= 0) k[idx] = row;
else k.push(row);
fs.writeFileSync(kahvePath, JSON.stringify(k));

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest["9574.M200.00"] = "images/catalog/ozti/web/ozti-9574-m200-00.jpg";
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

console.log("[patch-animo-m200] sku=9574.M200.00 fiyat_tl=", fiyat_tl);
