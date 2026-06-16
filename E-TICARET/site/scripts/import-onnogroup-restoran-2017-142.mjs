/**
 * 2017-142 ONNOGROUP (2017-142.xlsx) → restoran 500–1000 m²
 *
 * Kaynak: c:\D Disk\2017\2017-142 ONNOGROUP\2017-142.xlsx
 * Çalışma kopyası: PFOS/veri/proje-veri/2017-142-onnogroup.xlsx
 *
 * Kullanım: npm run pfos:onnogroup-restoran:import
 */
import { execFileSync } from "node:child_process";
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const PROJE_VERI = path.join(SITE, "..", "..", "PFOS", "veri", "proje-veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");

const KATEGORI_ID = "restoran";
const BANT_ID = "500-1000";
const XLSX = "2017-142-onnogroup.xlsx";
const REFERANS_M2 = 500;

const POZ_RE = /^[A-Z]{1,3}\d{1,3}[A-Z]?$/i;

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

/** Birleştirilmiş hücreler nedeniyle POZ col2, ürün col4, adet col6 */
function parseWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 16) return;

    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = row.getCell(5).value;
    const adetRaw = row.getCell(6).value;

    if (!poz && !ad) return;
    if (ad.startsWith("*")) return;

    if (!poz && ad) {
      bolumAd = ad;
      bolum = ad.split(/[- ]/)[0]?.trim() || ad.charAt(0);
      return;
    }

    if (!POZ_RE.test(poz) || !ad) return;

    rows.push({
      bolum,
      bolumAd,
      poz: poz.toUpperCase(),
      ad: marka ? `${ad} (${marka})` : ad,
      olcu: normalizeOlcu(olcu),
      adet: parseAdet(adetRaw),
    });
  });

  return rows;
}

async function main() {
  const src = path.join(PROJE_VERI, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.getWorksheet("Sayfa1") ?? wb.worksheets[0];
  const kalemler = parseWs(ws);
  if (!kalemler.length) {
    throw new Error("Kalem bulunamadı (xlsx formatı değişmiş olabilir).");
  }

  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Büyük Restoran 500–1000 m² (ONNOGROUP)",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-142 ONNOGROUP/2017-142.xlsx",
    not: "Moskova Ticaret Merkezi · staff cafe · restaurant bar · patisserie · tea hall · yer ızgarası",
    yukleme,
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, liste.kalemSayisi, "kalem, toplamAdet", toplamAdet);

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
    yukleme,
  };

  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const existing = idx >= 0 ? kategoriler[idx] : null;
  const otherBantlar = (existing?.bantlar ?? []).filter((b) => b.id !== BANT_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Büyük Restoran",
    ustKategori: "Restoran",
    bantlar: [
      ...otherBantlar,
      {
        id: BANT_ID,
        label: "500–1000 m² (ONNOGROUP)",
        referansM2: REFERANS_M2,
        meta,
      },
    ].sort((a, b) => String(a.id).localeCompare(String(b.id))),
  };

  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);

  try {
    execFileSync("node", [KORPUS_SCRIPT], { stdio: "inherit", cwd: SITE });
  } catch (e) {
    console.warn("Korpus güncellenemedi:", e.message);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
