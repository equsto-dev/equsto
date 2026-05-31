/**
 * 2016-135 Kahve Durağı Sultangazi → kahve-duragi-pastane 100–200 m²
 * Pastane + kahvaltı + hafif yemek (Konyaaltı/Karabük cafe-restaurant'tan ayrı)
 * Kullanım: node scripts/import-kahve-duragi-pastane-konsept.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLainoxProformaMarkaWs } from "./lib/lainox-proforma-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "kahve-duragi-pastane";
const BANT_ID = "100-200";
const XLSX = "kahve-duragi-sultangazi-2016-135.xlsx";
const REFERANS_M2 = 150;

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseLainoxProformaMarkaWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Kahve Durağı — Pastane & Kahvaltı 100–200 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-135 KAHVE DURAĞI SULTANGAZİ LAINOX/2016-135.xlsx",
    not: "Sultangazi · pastane teşhir + bar · mutfak (kahvaltı & hafif yemek)",
    konseptSinif: "pastane-kahvalti-hafif-yemek",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }
  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
    konseptSinif: liste.konseptSinif,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Kahve Durağı — Pastane & Kahvaltı",
    ustKategori: "Kafe / Coffee Shop",
    bantlar: [
      {
        id: BANT_ID,
        label: "100–200 m² (Sultangazi)",
        referansM2: REFERANS_M2,
        meta,
      },
    ],
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
