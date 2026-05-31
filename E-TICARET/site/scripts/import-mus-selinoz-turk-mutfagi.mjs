/**
 * 2016-101 Muş Selinöz Mimarlık → ayrı Türk mutfağı referans (Kiremit’ten bağımsız)
 * Kaynak: PFOS/veri/mus-selinoz-2016-101.xlsx
 * Kullanım: node scripts/import-mus-selinoz-turk-mutfagi.mjs
 * Not: Motor/sihirbaz bağlantısı yok — detaylandırma sonrası ff_mus_selinoz_turk aktifleştirilecek.
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

const KATEGORI_ID = "mus-selinoz-turk";
const BANT_ID = "100-250";
const XLSX = "mus-selinoz-2016-101.xlsx";
const REFERANS_M2 = 200;

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

/** Mefftech: col1=poz, col2=ürün, col5=ölçü, col9=adet */
function parseTeklifWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 18) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const olcu = row.getCell(5).value;
    const adetRaw = row.getCell(9).value;
    if (!poz && !ad) return;
    if (/^no$/i.test(poz) || /^malin/i.test(ad)) return;
    if (!poz && ad && (adetRaw == null || adetRaw === "")) {
      bolumAd = ad;
      bolum = ad.split("-")[0]?.trim() || ad.charAt(0);
      return;
    }
    if (poz && isPoz(poz) && ad && !/^malin|toplam/i.test(ad)) {
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
  const kalemler = parseTeklifWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Muş Selinöz Türk mutfağı 100–250 m² (taslak)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-101 MUŞ SELİNÖZ MİMARLIK/2016-101.xlsx",
    not: "Türk mutfağı · Kiremit Akasya’dan AYRI · bar+pasta teşhir · tam mutfak · konsept detay bekliyor",
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
    durum: "planlanan",
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Muş Selinöz Türk mutfağı (101)",
    ustKategori: "Türk mutfağı · planlanan",
    bantlar: [
      {
        id: BANT_ID,
        label: "100–250 m² (taslak referans m²)",
        referansM2: REFERANS_M2,
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
