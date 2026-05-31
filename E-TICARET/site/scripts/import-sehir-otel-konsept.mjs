/**
 * 2016-077 Hilton Kocaeli → pfos-referans + pfos-kategoriler.json
 * Kaynak: PFOS/veri/hilton-sehir-otel-2016-077.xlsx
 * Kullanım: node scripts/import-sehir-otel-konsept.mjs
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

const KATEGORI_ID = "sehir-otel";
const BANT_ID = "500-2000";
const XLSX = "hilton-sehir-otel-2016-077.xlsx";
const REFERANS_M2 = 1000;

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

/** Hilton Lainox: col1=poz, col2=ürün, col3-7=ölçü, col8=marka, col10=adet */
function parseHiltonWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 13) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(8).value);
    const adetRaw = row.getCell(10).value;
    if (!ad) return;
    if (/^ürün|açıklama|sıra/i.test(ad)) return;

    const hasAdet = adetRaw != null && adetRaw !== "";
    if (!poz && ad.length > 3 && !hasAdet) {
      bolumAd = ad;
      bolum = ad.replace(/[^A-ZÇĞİÖŞÜ]/gi, "").charAt(0) || ad.charAt(0);
      return;
    }
    if (poz && hasAdet) {
      const olcuParts = [3, 4, 5, 6, 7]
        .map((c) => cellStr(row.getCell(c).value))
        .filter((s) => s && s !== "x" && s !== "X");
      const olcu = olcuParts.length ? olcuParts.join(" × ") : "—";
      const parts = [ad];
      if (marka) parts.push(`(${marka})`);
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad: parts.join(" "),
        olcu,
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
  const kalemler = parseHiltonWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Şehir Oteli (Business) 500–2000 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-077 HILTON KOCAELİ LAINOX/2016-077.xlsx",
    not: "Hilton Kocaeli · ana mutfak · büfe · banquet · servis bar",
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
    label: "Şehir Oteli (Business)",
    ustKategori: "Otel F&B",
    bantlar: [
      {
        id: BANT_ID,
        label: "500–2000 m²",
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
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
