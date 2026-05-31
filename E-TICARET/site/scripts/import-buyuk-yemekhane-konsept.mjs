/**
 * 2016-070 Yozgat Hastanesi yemekhane BoQ → pfos-referans + pfos-kategoriler.json
 * Kaynak: PFOS/veri/yozgat-yemekhane-2016-070.xlsx
 * Kullanım: node scripts/import-buyuk-yemekhane-konsept.mjs
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

const KATEGORI_ID = "buyuk-yemekhane";
const BANT_ID = "2000-3500";
const XLSX = "yozgat-yemekhane-2016-070.xlsx";
const REFERANS_KISI = 2750;

const POZ_RE = /^[\dA-Z]+-\d+/i;
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

/** BoQ: col1=POS, col2=tanım, col3=marka, col4=model, col5=birim/ölçü, col6=miktar */
function parseBoqWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 7) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const model = cellStr(row.getCell(4).value);
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^pos$/i.test(poz) || /ekipman.*tanım/i.test(ad)) return;
    if (!poz && ad) {
      bolumAd = ad;
      bolum = ad.replace(/\s+/g, "_").slice(0, 12);
      return;
    }
    if (poz && isPoz(poz) && ad) {
      const parts = [ad];
      if (marka) parts.push(marka);
      if (model) parts.push(model);
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad: parts.join(", "),
        olcu: olcu || "—",
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
  const kalemler = parseBoqWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Büyük Yemekhane 2000–3500 kişi",
    referansM2: REFERANS_KISI,
    kaynakDosya: "2016-070 YOZGAT YEMEKHANE LAINOX/YOZGAT YEMEK EKİPMAN.xlsx",
    not: "Büyük hastane mutfağı · Yozgat referans · catering / fabrika / okul yemekhanesi paketi",
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
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Büyük Yemekhane",
    ustKategori: "Catering / Kurumsal",
    bantlar: [
      {
        id: BANT_ID,
        label: "2000–3500 kişi/gün",
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
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
