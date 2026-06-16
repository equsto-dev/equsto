/**
 * 2017-098 Dersaadet Karaköy → meyhane referans (200–350 m²)
 * Kaynak: PFOS/veri/meyhane-dersaadet-2017-098.xlsx
 * Kullanım: npm run pfos:meyhane:import
 *
 * Excel: col1=poz, col2=ürün, col5=ölçü, col9=adet
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "meyhane";
const BANT_ID = "200-350";
const XLS = "meyhane-dersaadet-2017-098.xlsx";
const REFERANS_M2 = 275;

const POZ_RE = /^[A-Z]\d+$/i;

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  return String(v).trim();
}

function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseTeklifWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 24) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(9).value;

    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;

    // Bölüm satırları: "A- SOĞUK ODA" gibi
    if (!POZ_RE.test(poz) && ad.length > 3) {
      bolumAd = ad.replace(/^[A-Z]\s*[-–]\s*/i, "").trim() || ad.trim();
      bolum = bolumAd.replace(/\s+/g, "-").toLowerCase().slice(0, 24) || "bolum";
      return;
    }

    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz,
        ad,
        olcu: olcu || "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

async function writeJsonAtomic(dest, obj) {
  const tmp = `${dest}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2) + "\n", "utf8");
  await fs.rename(tmp, dest);
}

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
    label: "Meyhane",
    ustKategori: "Restoran",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "200–350 m² (Dersaadet 2017-098)",
    referansM2: REFERANS_M2,
    meta,
  };
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.push(bantKayit);
  kayit.bantlar = bantlar;
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await writeJsonAtomic(MANIFEST, manifest);
}

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseTeklifWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const yukleme = new Date().toISOString();

  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Meyhane 200–350 m² (Dersaadet Karaköy)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-098 DERSAADET KARAKÖY/2017-098-1.xlsx",
    not: "Dersaadet Karaköy · meyhane konsepti · 200–350 m² bandı · 2017-098",
    konseptSinif: "meyhane-dersaadet",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await writeJsonAtomic(dest, liste);
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  await upsertManifest({
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme,
    konseptSinif: liste.konseptSinif,
  });
  console.log("Manifest güncellendi:", KATEGORI_ID);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

