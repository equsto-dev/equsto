/**
 * pizzaci-200-500-m2.xlsx (kaynak: 2025-116 Avcılar) → pfos-referans + pfos-kategoriler.json
 * Kullanım: node scripts/import-pizzaci-referans.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "pizzaci";
const BANT_ID = "200-500";
const XLSX = "pizzaci-200-500-m2.xlsx";
const REFERANS_M2 = 350;
const KAYNAK_NOT = "2025-116 Pizzacı Avcılar (Murat Çaylar) · 2025-116-2.xlsx";

/** PROFORMA: C=alan/bölüm, E=poz, G=ürün, K=ölçü, O=adet */
const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v) return String(v.text).trim();
  return String(v).trim();
}
function parseAdet(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 21) return;
    const alan = cellStr(row.getCell(3).value);
    const poz = cellStr(row.getCell(5).value);
    const ad = cellStr(row.getCell(7).value);
    const olcuRaw = row.getCell(11).value;
    const adetRaw = row.getCell(15).value;

    if (alan && !poz && !ad) {
      bolumAd = alan;
      bolum = alan.split(/[\s-]/)[0]?.trim() || alan.charAt(0);
      return;
    }
    if (!poz || !ad || !isPoz(poz)) return;
    if (/^poz$/i.test(ad) || /^ürün adı$/i.test(ad)) return;

    rows.push({
      bolum,
      bolumAd,
      poz: poz.toUpperCase(),
      ad,
      olcu: olcuRaw != null && String(olcuRaw).trim() ? String(olcuRaw).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Pizzacı 200–500 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: XLSX,
    kaynakNot: KAYNAK_NOT,
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
    kaynakNot: liste.kaynakNot,
    yukleme: liste.yukleme,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Pizzacı",
    ustKategori: "Restaurant",
    bantlar: [
      {
        id: BANT_ID,
        label: "200–500 m²",
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
