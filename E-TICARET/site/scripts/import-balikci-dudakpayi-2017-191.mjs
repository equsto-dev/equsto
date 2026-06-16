/**
 * 2017-191 Dudak Payı Watergarden → balikci 350–600 m² referans
 * Kaynak: PFOS/veri/balikci-dudakpayi-2017-191.xlsx
 * Kullanım: npm run pfos:dudakpayi-balikci:import
 *
 * Excel: col1=poz, col2=ürün, col3-5=ölçü, col7=marka, col9=adet
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

const KATEGORI_ID = "balikci";
const BANT_ID = "350-600";
const XLS = "balikci-dudakpayi-2017-191.xlsx";
const REFERANS_M2 = 475;

const POZ_RE = /^[A-Z]\.\d+$/i;

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

function olcuFromRow(row) {
  const w = cellStr(row.getCell(3).value);
  const d = cellStr(row.getCell(4).value);
  const h = cellStr(row.getCell(5).value);
  const parts = [w, d, h].filter((x) => x && x !== "-" && x !== "0");
  return parts.length ? parts.join("x") : "—";
}

function parseTeklifWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 22) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;

    // Bölüm satırı: poz boş, ad "MUTFAK" vb.
    if (!POZ_RE.test(poz) && ad.length > 2 && !/^\d/.test(ad)) {
      bolumAd = ad.trim();
      bolum = bolumAd.replace(/\s+/g, "-").toLowerCase().slice(0, 24) || "bolum";
      return;
    }

    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz,
        ad,
        marka: cellStr(row.getCell(7).value) || undefined,
        olcu: olcuFromRow(row),
        adet: parseAdet(row.getCell(9).value),
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
  const prev = idx >= 0 ? kategoriler[idx] : null;
  const bantlar = Array.isArray(prev?.bantlar) ? [...prev.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "350–600 m² (Dudak Payı 2017-191)",
    referansM2: REFERANS_M2,
    meta,
  };
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.push(bantKayit);
  const kayit = {
    id: KATEGORI_ID,
    label: prev?.label ?? "Balıkçı",
    ustKategori: prev?.ustKategori ?? "Restaurant",
    bantlar,
  };
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
  const ws = wb.getWorksheet("TEKLİF FORMATI") ?? wb.worksheets[0];
  const kalemler = parseTeklifWs(ws);
  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const yukleme = new Date().toISOString();

  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Balık Restaurant 350–600 m² (Dudak Payı)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-191 DUDAK PAYI WATERGARDEN/2017-191-2.xlsx",
    not: "Dudak Payı Watergarden · balık restoran · 350–600 m² bandı · 2017-191",
    konseptSinif: "balikci-dudakpayi",
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

