/**
 * 2016-194 Wyndham Hotel (Noyan) → tatil-otel 800–1500 m² referans
 * Kaynak: PFOS/veri/wyndham-tatil-otel-2016-194.xlsx
 * Kullanım: npm run pfos:tatil-otel-wyndham:import
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");

const KATEGORI_ID = "tatil-otel";
const BANT_ID = "800-1500";
const XLSX = "wyndham-tatil-otel-2016-194.xlsx";
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

const POZ_RE = /^[A-Z]\.?\d{1,3}$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}

/**
 * NOYAN / WYNDAM PROFORMA:
 * - col1 poz (A.01)
 * - col2 ürün adı
 * - col3..7 ölçü parçaları (50 x 43 x 33 gibi)
 * - col8 marka / model
 * - col10 adet
 */
function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 10) return;
    const poz = cellStr(row.getCell(1).value);
    const ad = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(8).value);
    const adetRaw = row.getCell(10).value;

    if (!poz && !ad) return;
    if (/^poz\b/i.test(poz) || /^ürün/i.test(ad)) return;

    // Bölüm satırı: "A" + "SICAK MUTFAK"
    if (poz && /^[A-Z]$/i.test(poz) && ad && !marka) {
      bolum = poz.toUpperCase();
      bolumAd = ad;
      return;
    }

    if (!isPoz(poz) || !ad) return;
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
  });
  return rows;
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
    label: "Tatil Oteli",
    ustKategori: "Otel F&B",
    bantlar: [
      {
        id: BANT_ID,
        label: "800–1500 m² (Wyndham 2016-194)",
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
}

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Tatil Oteli 800–1500 m² (Wyndham)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-170 NOYAN OTELCİLİK LAINOX/2016-194R1_WYNDAM HOTEL_2042017.xlsx",
    not: "Wyndham Hotel · tatil oteli referansı · 1000 m² hedef",
    konseptSinif: "tatil-otel-wyndham-2016-194",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  await upsertManifest({
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme,
    konseptSinif: liste.konseptSinif,
  });
  console.log("Manifest güncellendi:", KATEGORI_ID, BANT_ID);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e?.message ?? String(e));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

