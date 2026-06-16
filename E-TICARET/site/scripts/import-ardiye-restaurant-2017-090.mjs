/**
 * 2017-090 ARDİYE RESTAURANT (mutfak + bar) → public/data/pfos-referans + pfos-kategoriler.json
 *
 * Kaynak: PFOS/veri/proje-veri/2017-090-ardiye-restaurant-mutfak.xlsx
 * Kullanım: node scripts/import-ardiye-restaurant-2017-090.mjs
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

const KATEGORI_ID = "patisserie-yemek";
const BANT_ID = "referans";
const XLSX = "2017-090-ardiye-restaurant-mutfak.xlsx";
const REFERANS_M2 = 200;

function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && v && "text" in v) return String(v.text).trim();
  if (typeof v === "object" && v && "result" in v) return String(v.result).trim();
  return String(v).trim();
}

function parseAdet(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : "—";
}

function normalizeOlcu(raw) {
  const s = cellStr(raw);
  if (!s || /^-+$/.test(s)) return "—";
  return s.replace(/\*/g, "×");
}

function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 15) return;

    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;

    // Bölüm satırı: ürün açıklaması dolu, poz boş
    if (!poz && ad && /ALANI/i.test(ad)) {
      bolumAd = ad;
      bolum = ad.toLowerCase().includes("bar") ? "A" : "M";
      return;
    }

    if (!poz || !/^\d{1,3}$/.test(poz)) return;
    if (!ad) return;

    rows.push({
      bolum: bolum || "?",
      bolumAd: bolumAd || "GENEL",
      poz,
      ad: marka ? `${ad} (${marka})` : ad,
      olcu: normalizeOlcu(olcu),
      adet: parseAdet(adetRaw),
    });
  });

  return rows;
}

async function readJson(p) {
  return JSON.parse(await fs.readFile(p, "utf8"));
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.getWorksheet("Sayfa1") ?? wb.worksheets[0];
  const kalemler = parseWs(ws);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );

  const yukleme = new Date().toISOString();
  const label = "ARDİYE Restaurant (2017) — mutfak + bar";
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label,
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-090 ARDİYE RESTAURANT/2017-090.1 mutfak.xlsx",
    not: "Standart restoran listesi; pastane ağırlıklı (proje bazlı referans).",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem, toplamAdet", toplamAdet);

  const manifest = await readJson(MANIFEST);
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  if (idx < 0) {
    throw new Error(`Kategori bulunamadı: ${KATEGORI_ID} (pfos-kategoriler.json)`);
  }

  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };

  const k = kategoriler[idx];
  const other = Array.isArray(k.bantlar) ? k.bantlar.filter((b) => b.id !== BANT_ID) : [];
  const bant = { id: BANT_ID, label: "Referans liste (2017)", referansM2: REFERANS_M2, meta };
  k.bantlar = [...other, bant].sort((a, b) => String(a.id).localeCompare(String(b.id)));

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

