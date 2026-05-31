/**
 * 2016-087 tam liste (kasap + şarküteri) → pfos-referans
 * Kaynak: PFOS/veri/kasap-ortaklar-2016-087.xlsx
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

const KATEGORI_ID = "kasap-sarkuteri";
const BANT_ID = "100-250";
const XLSX = "kasap-ortaklar-2016-087.xlsx";
const REFERANS_M2 = 200;

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(VERI_DIR, XLSX));
  const kalemler = parseKasapRotaWs(wb.worksheets[0]);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Kasap + Şarküteri 100–250 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-087 KASAP ORTAKLAR ROTA/2016-087.xlsx",
    not: "Kasap + şarküteri teşhir · hazırlık mutfağı (Ortaklar Rota tam liste)",
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
    label: "Kasap + Şarküteri",
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
  const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
  try {
    const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
    if (Array.isArray(manifest.kategoriler)) {
      manifest.kategoriler = manifest.kategoriler.filter((k) => k.id !== "kasap-pisirme");
      manifest.updated_at = new Date().toISOString();
      await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
    }
  } catch {
    /* */
  }
  try {
    await fs.unlink(path.join(OUT, "kasap-pisirme-100-250.json"));
    console.log("Removed legacy kasap-pisirme-100-250.json");
  } catch {
    /* yok */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
