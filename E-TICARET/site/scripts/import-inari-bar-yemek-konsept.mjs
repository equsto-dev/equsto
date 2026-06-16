/**
 * 2016-093 Inari Restaurant → pfos-referans + pfos-kategoriler.json
 * Kaynak: PFOS/veri/inari-restaurant-2016-093-2.xlsx
 * Kullanım: node scripts/import-inari-bar-yemek-konsept.mjs
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

const KATEGORI_ID = "inari-bar-yemek";
const BANT_ID = "100-200";
const XLSX = "inari-restaurant-2016-093-2.xlsx";
const REFERANS_M2 = 150;

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
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

/** Inari/Rota: col2=poz, col4=ürün, col5=ölçü, col6=adet */
function parseInariWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 15) return;
    const poz = cellStr(row.getCell(2).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;
    if (!ad) return;
    if (/^poz|marka|ürün/i.test(poz) || /^ürün|malin/i.test(ad)) return;
    if (!isPoz(poz) && ad && (adetRaw == null || adetRaw === "")) {
      bolumAd = ad;
      bolum = ad.replace(/[^A-ZÇĞİÖŞÜ]/gi, "").charAt(0) || ad.charAt(0);
      return;
    }
    if (isPoz(poz) && ad && adetRaw != null && adetRaw !== "") {
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad,
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseInariWs(wb.worksheets[0]);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Bar + Yemek 100–200 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-093 INARI RESTAURANT/2016-093-2.xlsx",
    not: "Inari Restaurant · bar + yemek · hafif Asya mutfağı",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet: kalemler.reduce((t, r) => t + (typeof r.adet === "number" ? r.adet : 0), 0),
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
    /* */
  }
  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Bar + Yemek",
    ustKategori: "Restoran",
    bantlar: [{ id: BANT_ID, label: "100–200 m²", referansM2: REFERANS_M2, meta }],
  };
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
