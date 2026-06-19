import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "restoran";
const BANT_ID = "200-500";
const XLSX = "RESTORAN.xlsx";
const REFERANS_M2 = 350;

const POZ_RE = /^[A-Z]\d{1,2}A?$|^\d{1,3}$/;
function isPoz(s: any) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v: any) {
  if (v == null) return "";
  return String(v).trim();
}
function parseAdet(raw: any) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

function parseWs(ws: ExcelJS.Worksheet) {
  const rows: any[] = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 4) return;
    const a = cellStr(row.getCell(1).value);
    const b = cellStr(row.getCell(2).value);
    const c = cellStr(row.getCell(3).value);
    const d = row.getCell(4).value;
    const e = row.getCell(5).value;
    if (!a && !b && !c) return;
    const au = a.toUpperCase();
    if (au === "TOPLAM ADET") return;
    if (au === "PNO" || au === "P.NO" || au === "BÖL.") return;
    if (a && !b && a.includes("-") && !isPoz(a)) {
      bolumAd = a;
      bolum = a.split("-")[0]?.trim() || a.charAt(0);
      return;
    }
    let poz = null;
    let ad = null;
    let olcu = null;
    let adetRaw = null;
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
      poz: poz.toUpperCase(),
      ad,
      olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  console.log("Reading source Excel:", src);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.worksheets[0];
  if (!ws) {
    throw new Error("RESTORAN.xlsx has no worksheets!");
  }
  const kalemler = parseWs(ws);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const listData = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Restoran 200–500 m² (RESTORAN)",
    referansM2: REFERANS_M2,
    kaynakDosya: XLSX,
    not: "Zonlar ve doğru ekipman atamaları ile 200-500 m² bandı proforma listesi",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(listData, null, 2), "utf8");
  console.log(`Saved reference list to: ${dest} (${kalemler.length} items)`);

  let manifest: any = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch (e) {
    console.log("Creating new manifest file...");
  }

  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: listData.kalemSayisi,
    toplamAdet: listData.toplamAdet,
    kaynakDosya: listData.kaynakDosya,
    yukleme: listData.yukleme,
  };

  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k: any) => k.id === KATEGORI_ID);

  const newBand = {
    id: BANT_ID,
    label: "200–500 m² (RESTORAN)",
    referansM2: REFERANS_M2,
    meta,
  };

  if (idx >= 0) {
    const existing = kategoriler[idx];
    const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
    const bidx = bantlar.findIndex((b: any) => b.id === BANT_ID);
    if (bidx >= 0) {
      bantlar[bidx] = newBand;
    } else {
      bantlar.push(newBand);
    }
    existing.bantlar = bantlar;
  } else {
    kategoriler.push({
      id: KATEGORI_ID,
      label: "Restoran",
      ustKategori: "Restoran",
      bantlar: [newBand],
    });
  }

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest successfully updated:", MANIFEST);
}

main().catch(console.error);
