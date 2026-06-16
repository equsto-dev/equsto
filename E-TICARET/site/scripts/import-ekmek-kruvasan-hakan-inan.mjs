/**
 * 2017-093 Hakan İnan İmalathane → ekmek-kruvasan referans (150–400 m²)
 * Kaynak: PFOS/veri/ekmek-kruvasan-2017-093.xlsx
 * Kullanım: npm run pfos:ekmek-kruvasan:import
 *
 * Excel: col2=poz, col3=marka, col4=ürün, col5=ölçü, col6=adet
 */
import { execFileSync } from "node:child_process";
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const VERI_DIR = path.join(SITE, "..", "..", "PFOS", "veri");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const KORPUS_SCRIPT = path.join(__dirname, "build-pfos-mutfak-korpus.mjs");

const KATEGORI_ID = "ekmek-kruvasan";
const BANT_ID = "150-400";
const XLS = "ekmek-kruvasan-2017-093.xlsx";
const REFERANS_M2 = 300;

const POZ_RE = /^[A-Z]\d+$/i;

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

function parseTeklifWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 16) return;
    const poz = cellStr(row.getCell(2).value);
    const marka = cellStr(row.getCell(3).value);
    const ad = cellStr(row.getCell(4).value);
    const olcu = cellStr(row.getCell(5).value);
    const adetRaw = row.getCell(6).value;
    if (!poz && !ad) return;
    if (/^poz|ürün|marka/i.test(poz + ad)) return;
    if (!POZ_RE.test(poz) && ad.length > 3 && !/^\d/.test(ad)) {
      bolumAd = ad;
      bolum = ad.replace(/\s+/g, "-").slice(0, 24).toLowerCase() || "bolum";
      return;
    }
    if (POZ_RE.test(poz) && ad) {
      rows.push({
        bolum,
        bolumAd,
        poz,
        ad,
        marka: marka || undefined,
        olcu: olcu || "—",
        adet: parseAdet(adetRaw),
      });
    }
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
    label: "Ekmek + Kruvasan (İmalathane)",
    ustKategori: "Üretim / Fabrika",
    bantlar: [],
  };
  const existing = idx >= 0 ? kategoriler[idx] : kayit;
  const bantlar = Array.isArray(existing.bantlar) ? [...existing.bantlar] : [];
  const bantKayit = {
    id: BANT_ID,
    label: "150–400 m² (Hakan İnan 093)",
    referansM2: REFERANS_M2,
    meta,
  };
  const bi = bantlar.findIndex((b) => b.id === BANT_ID);
  if (bi >= 0) bantlar[bi] = bantKayit;
  else bantlar.push(bantKayit);
  kayit.bantlar = bantlar;
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}

async function main() {
  const src = path.join(VERI_DIR, XLS);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseTeklifWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce((t, r) => t + r.adet, 0);
  const yukleme = new Date().toISOString();
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Ekmek + Kruvasan imalathane 150–400 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2017-093 HAKAN İNAN İMALATHANE/2017-093.xlsx",
    not: "Little Farm · ekmek + kruvasan üretim · soğuk oda · şoklama · fırın hattı · Hakan İnan 2017-093",
    konseptSinif: "ekmek-kruvasan-imalathane",
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
  console.log("Manifest güncellendi:", KATEGORI_ID);

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
