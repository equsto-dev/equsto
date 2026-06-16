/**
 * 2016-134 Smyrna Boyoz → all-day-dining-cafe 100–200 m² (All Day Cafe)
 * Kaynak: PFOS/veri/boyoz-pastane-2016-134.xlsx
 * Kullanım: npm run pfos:allday-cafe-boyoz:import
 */
import { execFileSync } from "node:child_process";
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseLainoxProformaFiyatWs } from "./lib/lainox-proforma-parse.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");

const KATEGORI_ID = "all-day-dining-cafe";
const BANT_ID = "100-200";
const XLSX = "boyoz-pastane-2016-134.xlsx";
const REFERANS_M2 = 150;

async function upsertManifest(meta) {
  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "All Day Dining Cafe",
    ustKategori: "Restoran",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "100–200 m² (Smyrna Boyoz)",
    referansM2: REFERANS_M2,
    meta,
  };
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.unshift(bantKayit);
  kayit.bantlar = bantlar.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseLainoxProformaFiyatWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "All Day Dining Cafe 100–200 m² (Smyrna Boyoz)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-134 SMYRNA BOYOZ LAINOX/2016-134.xlsx",
    not: "Smyrna Boyoz · all day cafe · satış alanı · üretim mutfağı · bulaşıkhane",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  await upsertManifest({
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme,
  });
  console.log("Manifest güncellendi:", KATEGORI_ID, BANT_ID);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
