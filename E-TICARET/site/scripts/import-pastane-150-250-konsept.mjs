/**
 * pastane ekipman_listesi.xlsx → pastane-150-250.json + pfos-kategoriler.json
 * Kullanım: node scripts/import-pastane-150-250-konsept.mjs
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

const KATEGORI_ID = "pastane";
const BANT_ID = "150-250";
const XLSX = "pastane ekipman_listesi.xlsx";
const REFERANS_M2 = 200;

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
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

/** P.NO sütun 1, ürün sütun 2 (satır 1 başlık) */
function parseWs(ws) {
  const rows = [];
  let bolum = "D";
  let bolumAd = "Pastane";
  ws.eachRow({ includeEmpty: false }, (row) => {
    const a = cellStr(row.getCell(1).value);
    const b = cellStr(row.getCell(2).value);
    const c = row.getCell(3).value;
    const d = row.getCell(4).value;
    if (!a && !b) return;
    if (/^p\.?no$/i.test(a) || /^ürün adı$/i.test(a)) return;
    if (a && !isPoz(a) && /bölüm|pastane|fırın|firin/i.test(a)) {
      bolumAd = a;
      bolum = a.split("-")[0]?.trim()?.charAt(0) || "D";
      return;
    }
    if (a && b && isPoz(a)) {
      rows.push({
        bolum,
        bolumAd,
        poz: a.toUpperCase(),
        ad: b,
        olcu: c != null && String(c).trim() ? String(c).trim() : "—",
        adet: parseAdet(d),
      });
    }
  });
  return rows;
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
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Pastane 150–250 m²",
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
  const bant = {
    id: BANT_ID,
    label: "150–250 m²",
    referansM2: REFERANS_M2,
    meta,
  };
  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const existing = idx >= 0 ? kategoriler[idx] : null;
  const otherBantlar = (existing?.bantlar ?? []).filter((b) => b.id !== BANT_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Pastane",
    ustKategori: existing?.ustKategori ?? "Pastane & Fırın",
    bantlar: [...otherBantlar, bant].sort((a, b) =>
      String(a.id).localeCompare(String(b.id)),
    ),
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
