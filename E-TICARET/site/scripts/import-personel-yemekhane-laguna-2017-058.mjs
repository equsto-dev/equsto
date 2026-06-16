/**
 * 2017-058 Laguna Thermal personel yemekhanesi → personel-yemekhane (150–250 kişi)
 * Kaynak: PFOS/veri/personel-yemekhane-laguna-2017-058.xlsx
 * Kullanım: npm run pfos:laguna-personel-yemekhane:import
 *
 * Excel: col2=poz, col3=marka, col4=ürün, col5=ölçü, col6=adet
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

const KATEGORI_ID = "personel-yemekhane";
const BANT_ID = "150-250";
const XLS = "personel-yemekhane-laguna-2017-058.xlsx";
const REFERANS_KISI = 200;

const POZ_RE = /^[A-Z]\d+$/i;

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
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
    if (rowNumber < 16) return;
    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^poz|ürün|marka/i.test(poz + ad)) return;
    if (!POZ_RE.test(poz) && ad.length > 3 && !/^\d/.test(ad)) {
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
        marka: marka || undefined,
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
    label: "Personel Yemekhanesi (Catering)",
    ustKategori: "Catering",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "150–250 kişi (Laguna 2017-058)",
    referansM2: REFERANS_KISI,
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
    label: "Personel Yemekhanesi (Catering) 150–250 kişi",
    referansM2: REFERANS_KISI,
    referansBirim: "kisi",
    kaynakDosya: "2017-058 LAGUNA THERMAL PERSONEL YEMEKHANESİ/2017-058.xlsx",
    not: "Laguna Thermal personel mutfağı · ~200 kişilik catering yemekhanesi · 2017-058",
    konseptSinif: "personel-yemekhane-laguna",
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

