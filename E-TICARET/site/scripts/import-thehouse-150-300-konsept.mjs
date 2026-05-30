/**
 * 19 THEHOUSE CAFE 150-300 m2.xlsx → italyan + all-day-dining-cafe (150–300 m²)
 * Kullanım: node scripts/import-thehouse-150-300-konsept.mjs
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

const BANT_ID = "150-300";
const XLSX = "19 THEHOUSE CAFE 150-300 m2.xlsx";
const REFERANS_M2 = 225;

const TARGETS = [
  {
    kategoriId: "italyan",
    label: "İtalyan Restoran 150–300 m²",
    ustKategori: "Restaurant",
    kategoriLabel: "İtalyan Restoran",
  },
  {
    kategoriId: "all-day-dining-cafe",
    label: "All Day Dining Cafe 150–300 m² (The House)",
    ustKategori: "Restoran",
    kategoriLabel: "All Day Dining Cafe",
  },
];

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
      poz,
      ad,
      olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function writeListe(target, kalemler) {
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: target.kategoriId,
    bantId: BANT_ID,
    label: target.label,
    referansM2: REFERANS_M2,
    kaynakDosya: XLSX,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };
  const dest = path.join(OUT, `${target.kategoriId}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");
  return {
    id: BANT_ID,
    label: "150–300 m²",
    referansM2: REFERANS_M2,
    meta: {
      listeDosya: `${target.kategoriId}-${BANT_ID}.json`,
      kalemSayisi: liste.kalemSayisi,
      toplamAdet: liste.toplamAdet,
      kaynakDosya: liste.kaynakDosya,
      yukleme: liste.yukleme,
    },
  };
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseWs(wb.worksheets[0]);
  await fs.mkdir(OUT, { recursive: true });

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];

  for (const target of TARGETS) {
    const bant = await writeListe(target, kalemler);
    const idx = kategoriler.findIndex((k) => k.id === target.kategoriId);
    const existing = idx >= 0 ? kategoriler[idx] : null;
    const otherBantlar = (existing?.bantlar ?? []).filter((b) => b.id !== BANT_ID);
    const kayit = {
      id: target.kategoriId,
      label: target.kategoriLabel,
      ustKategori: target.ustKategori,
      bantlar: [...otherBantlar, bant].sort((a, b) =>
        String(a.id).localeCompare(String(b.id)),
      ),
    };
    if (idx >= 0) kategoriler[idx] = kayit;
    else kategoriler.push(kayit);
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
