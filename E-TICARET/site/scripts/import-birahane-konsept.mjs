/**
 * 11 BIRAHANE.xlsx → public/data/pfos-referans + pfos-kategoriler.json
 * Kullanım: node scripts/import-birahane-konsept.mjs
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

const KATEGORI_ID = "birahane";
const BANT_ID = "100-300";
const XLSX = "11 BIRAHANE.xlsx";
const REFERANS_M2 = 200;

const POZ_RE = /^[A-Z]\d{1,2}A?$|^\d{1,3}$/;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
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
    if (rowNumber < 4) return;
    const cells = row.values;
    const a = cellStr(cells[1]);
    const b = cellStr(cells[2]);
    const c = cellStr(cells[3]);
    const d = cells[4];
    const e = cells[5];
    if (!a && !b && !c) return;
    const au = a.toUpperCase();
    if (au === "TOPLAM ADET") return;
    if (au === "PNO" || au === "P.NO" || au === "BÖL.") return;
    if (a && !b && a.includes("-") && !isPoz(a)) {
      bolumAd = a;
      bolum = a.split("-")[0]?.trim() || a.charAt(0);
      return;
    }
    let poz = null,
      ad = null,
      olcu = null,
      adetRaw = null;
    if (b && c && isPoz(b)) {
      poz = b;
      ad = c;
      olcu = d;
      adetRaw = e;
    } else if (a && b && isPoz(a)) {
      poz = a;
      ad = b;
      olcu = c;
      adetRaw = d;
    }
    if (!poz || !ad) return;
    rows.push({
      bolum,
      bolumAd,
      poz,
      ad,
      olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
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
    label: "Birahane 100–300 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: XLSX,
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
    label: "Birahane",
    ustKategori: "Bar & Lounge",
    bantlar: [
      {
        id: BANT_ID,
        label: "100–300 m²",
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

