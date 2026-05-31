/**
 * 2016-087 kasap (yalnızca kasap) → pfos-referans
 * Kaynak: PFOS/veri/kasap-ortaklar-kasap-2016-087.xlsx
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseKasapRotaWs, upsertManifest } from "./lib/kasap-rota-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");

const KATEGORI_ID = "kasap";
const BANT_ID = "100-250";
const XLSX = "kasap-ortaklar-kasap-2016-087.xlsx";
const REFERANS_M2 = 175;

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(VERI_DIR, XLSX));
  const kalemler = parseKasapRotaWs(wb.worksheets[0]);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Kasap 100–250 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-087 KASAP ORTAKLAR ROTA/2016-087 kasap.xlsx",
    not: "Yalnızca kasap hizmeti · et teşhir · hazırlık (Ortaklar Rota)",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet: kalemler.reduce((t, r) => t + (typeof r.adet === "number" ? r.adet : 0), 0),
    kalemler,
  };
  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");
  await upsertManifest(SITE, {
    id: KATEGORI_ID,
    label: "Kasap",
    ustKategori: "Şarküteri & Kasap",
    bantId: BANT_ID,
    labelBant: "100–250 m²",
    referansM2: REFERANS_M2,
    meta: {
      listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: liste.kaynakDosya,
      yukleme: liste.yukleme,
    },
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
