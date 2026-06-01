/**
 * 2016-178 Liva Fabrika yemekhanesi → yerinde-uretim referans (20–60 kişi)
 * Kaynak: PFOS/veri/liva-fabrika-2016-178.xlsx
 * Kullanım: node scripts/import-liva-yerinde-uretim.mjs
 *
 * Excel: col2=poz (K1/M1/Y1), col4=ürün, col5=ölçü, col6=adet
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

const KATEGORI_ID = "yerinde-uretim";
const BANT_ID = "20-60";
const XLS = "liva-fabrika-2016-178.xlsx";
const REFERANS_KISI = 40;

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
    if (rowNumber < 16) return;
    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^poz|ürün|marka/i.test(poz + ad)) return;
    if (!POZ_RE.test(poz) && ad.length > 3 && !/^\d/.test(ad)) {
      bolumAd = ad;
      bolum = ad.replace(/\s+/g, "-").slice(0, 24).toLowerCase() || "bolum";
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

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseTeklifWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Yerinde üretim 20–60 kişi (Liva Fabrika)",
    referansM2: REFERANS_KISI,
    referansBirim: "kisi",
    kaynakDosya: "2016-178 LİVA FABRİKA/2016-178.xlsx",
    not: "Liva Fabrika yemekhanesi · 20–60 kişilik yerinde üretim · Doruk/SKTürk teklif 2016-178",
    konseptSinif: "yerinde-uretim-mutfak",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem", toplamAdet, "adet");

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
    konseptSinif: liste.konseptSinif,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Yerinde Üretim (fabrika mutfağı)",
    ustKategori: "Catering",
    bantlar: [
      {
        id: BANT_ID,
        label: "20–60 kişi (Liva 178)",
        referansM2: REFERANS_KISI,
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
