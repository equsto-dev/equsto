/**
 * Kahve Durağı Lainox referansları → pfos-referans + manifest
 * - 100–200 m²: 2016-105 Konyaaltı (kompakt)
 * - 150–200 m²: 2016-106 Karabük (standart)
 * Kullanım: node scripts/import-kahve-duragi-konsept.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLainoxProformaWs } from "./lib/lainox-proforma-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "kahve-duragi";

const REFERANSLAR = [
  {
    bantId: "100-200",
    xlsx: "kave-duragi-2016-105.xlsx",
    referansM2: 125,
    label: "Kahve Durağı 100–150 m² (Konyaaltı)",
    kaynakDosya: "2016-105 KAVE DURAĞI KONYALTI LAINOX/2016-105.xlsx",
    not: "Kompakt şube · davlumbaz + sıcak mutfak · servis bar · pasta/dondurma",
    konseptSinif: "cafe-restaurant-kompakt",
  },
  {
    bantId: "150-200",
    xlsx: "kahve-duragi-karabuk-2016-106.xlsx",
    referansM2: 175,
    label: "Kahve Durağı 150–200 m² (Karabük)",
    kaynakDosya: "2016-106 KAHVE DURAĞI KARABÜK LAINOX/2016-106.xlsx",
    not: "Standart şube · geniş servis bar · sıcak mutfak · bulaşık · depo",
    konseptSinif: "cafe-restaurant-standart",
  },
];

const MENU_NOT =
  "Zincir menü: kahve (espresso/latte), kahvaltı, tatlı-pasta, soğuk içecek; marka ayrıca Türk/dünya mutfağı ve retail (lokum/çikolata) — bkz. kahveduragi.com.tr, QR menü";

async function importOne({ bantId, xlsx, referansM2, label, kaynakDosya, not, konseptSinif }) {
  const src = path.join(VERI_DIR, xlsx);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseLainoxProformaWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId,
    label,
    referansM2,
    kaynakDosya,
    not,
    konseptSinif,
    menuNot: MENU_NOT,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };
  const dest = path.join(OUT, `${KATEGORI_ID}-${bantId}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");
  return { bantId, referansM2, label, meta: {
    listeDosya: `${KATEGORI_ID}-${bantId}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
    konseptSinif,
  } };
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const bantlar = [];
  for (const ref of REFERANSLAR) {
    const { bantId, referansM2, label, meta } = await importOne(ref);
    bantlar.push({ id: bantId, label, referansM2, meta });
  }

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Kahve Durağı",
    ustKategori: "Kafe / Coffee Shop · Cafe-Restaurant",
    bantlar,
  };
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest güncellendi");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
