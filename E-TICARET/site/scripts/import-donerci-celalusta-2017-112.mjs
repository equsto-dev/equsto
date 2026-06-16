/**
 * 2017-112 Dönerci Celal Usta → donerci 350–500 m² referans (Yeni nesil dönerci)
 * Kaynak: PFOS/veri/donerci-celalusta-2017-112.xlsx
 * Kullanım: npm run pfos:donerci-celalusta:import
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

const KATEGORI_ID = "donerci";
const BANT_ID = "350-500";
const XLS = "donerci-celalusta-2017-112.xlsx";
const REFERANS_M2 = 425;

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

    // Bölüm satırı: "A- SEBZE HAZIRLIK"
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
    label: "Dönerci (Yeni Nesil)",
    ustKategori: "Restoran",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "350–500 m² (Celal Usta 2017-112)",
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
    label: "Dönerci (Yeni Nesil) 350–500 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-112 DÖNERCİ CELAL USTA/2017-112-2.xlsx",
    not: "Dönerci Celal Usta Gebze · yeni nesil dönerci · 350–500 m² · 2017-112",
    konseptSinif: "donerci-celalusta",
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

