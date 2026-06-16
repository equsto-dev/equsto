/**
 * 2025-080 Akademi Catering Fabrika → pfos-referans + pfos-kategoriler.json
 * Kaynak: 2025-080-2.xlsx (PROFORMA)
 * Bant: 1500–2500 m² · 15.000–30.000 yemek/gün
 * Kullanım: node scripts/import-akademi-catering-konsept.mjs
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

const KATEGORI_ID = "catering-uretim";
const BANT_ID = "1500-2500";
const XLSX_NAME = "akademi-catering-2025-080-2.xlsx";
const DEFAULT_SRC =
  "c:\\D Disk\\2025\\2025-080 AKADEMİ CATERING FABRİKA\\arşiv\\2025-080-2.xlsx";
const REFERANS_M2 = 2000;
const REFERANS_KAPASITE_GUN = 22500;

const POZ_RE = /^[A-ZÇĞİÖŞÜ][0-9]{1,3}[A-Z]?$/i;

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  if (typeof v === "object" && v && "richText" in v) {
    return v.richText.map((t) => t.text).join("").trim();
  }
  return String(v).trim();
}

function parseAdet(raw) {
  if (raw == null || raw === "") return 1;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** PROFORMA: col1=kat, col3=alan, col5=poz, col7=ad, col11=ölçü, col13=marka, col15=adet */
function parseProformaWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  let zone = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 21) return;
    const kat = cellStr(row.getCell(1).value);
    const alan = cellStr(row.getCell(3).value);
    const poz = cellStr(row.getCell(5).value);
    const ad = cellStr(row.getCell(7).value);
    const olcu = cellStr(row.getCell(11).value);
    const marka = cellStr(row.getCell(13).value);
    const adetRaw = row.getCell(15).value;

    if (kat && /KAT PLANI/i.test(kat)) {
      bolumAd = kat;
      bolum = kat.replace(/[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/g, "_").slice(0, 24) || "kat";
      zone = "";
      return;
    }
    if (alan && !poz) {
      zone = alan;
      return;
    }
    if (!poz || /^poz$/i.test(poz)) return;
    if (!POZ_RE.test(poz) || !ad) return;

    const parts = [ad];
    if (marka) parts.push(marka);
    rows.push({
      bolum,
      bolumAd: bolumAd || bolum,
      zone,
      poz: poz.toUpperCase(),
      ad: parts.join(", "),
      olcu: olcu || "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function main() {
  const envSrc = process.env.PFOS_AKADEMI_XLSX;
  const veriSrc = path.join(VERI_DIR, XLSX_NAME);
  let src = envSrc || veriSrc;
  try {
    await fs.access(src);
  } catch {
    src = DEFAULT_SRC;
  }

  try {
    await fs.mkdir(VERI_DIR, { recursive: true });
    if (src !== veriSrc) {
      await fs.copyFile(src, veriSrc);
      console.log("Kopyalandı:", veriSrc);
    }
  } catch (e) {
    console.warn("veri kopyası atlandı:", e.message);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.getWorksheet("PROFORMA") || wb.worksheets[0];
  const kalemler = parseProformaWs(ws);
  if (!kalemler.length) throw new Error("PROFORMA sheet boş veya parse edilemedi");

  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Üretim Fabrikası 1500–2500 m²",
    referansM2: REFERANS_M2,
    referansKapasiteGun: REFERANS_KAPASITE_GUN,
    kaynakDosya: "2025-080 AKADEMİ CATERING FABRİKA/2025-080-2.xlsx",
    not: "Akademi Catering fabrika · 15.000–30.000 yemek/gün · 1500–2500 m² referans",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem,", toplamAdet, "adet");

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
    label: "Üretim Fabrikası (Catering)",
    ustKategori: "Catering / Kurumsal",
    bantlar: [
      {
        id: BANT_ID,
        label: "1500–2500 m² · 15–30 bin yemek/gün",
        referansM2: REFERANS_M2,
        meta,
      },
    ],
  };
  if (idx >= 0) {
    const existing = kategoriler[idx];
    const bands = Array.isArray(existing.bantlar) ? existing.bantlar : [];
    const bi = bands.findIndex((b) => b.id === BANT_ID);
    if (bi >= 0) bands[bi] = kayit.bantlar[0];
    else bands.push(kayit.bantlar[0]);
    kategoriler[idx] = { ...existing, ...kayit, bantlar: bands };
  } else {
    kategoriler.push(kayit);
  }

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
