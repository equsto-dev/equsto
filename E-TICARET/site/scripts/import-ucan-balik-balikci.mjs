/**
 * 2016-094 Uçan Balık → balikci 150–250 m² referans
 * Kaynak: PFOS/veri/ucan-balik-2016-094.xlsx
 * Kullanım: node scripts/import-ucan-balik-balikci.mjs
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

const KATEGORI_ID = "balikci";
const BANT_ID = "150-250";
const XLSX = "ucan-balik-2016-094.xlsx";
const REFERANS_M2 = 200;
const LEGACY_BACKUP = "balikci-150-250-ekipman-listesi.json";

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
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

/** Uçan Balık/Rota: col2=poz, col3=marka, col4=ürün, col5=ölçü, col6=adet */
function parseUcanBalikWs(ws) {
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
    if (!ad) return;
    if (/^poz|marka|ürün/i.test(poz) || /^ürün|malin/i.test(ad)) return;
    if (!isPoz(poz) && ad && (adetRaw == null || adetRaw === "")) {
      bolumAd = ad;
      bolum = ad.replace(/[^A-ZÇĞİÖŞÜ]/gi, "").charAt(0) || ad.charAt(0);
      return;
    }
    if (isPoz(poz) && ad && adetRaw != null && adetRaw !== "") {
      const parts = [ad];
      if (marka) parts.push(`(${marka})`);
      rows.push({
        bolum,
        bolumAd,
        poz: poz.toUpperCase(),
        ad: parts.join(" "),
        olcu: olcu != null && String(olcu).trim() ? String(olcu).trim() : "—",
        adet: parseAdet(adetRaw),
      });
    }
  });
  return rows;
}

async function main() {
  const src = path.join(VERI_DIR, XLSX);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseUcanBalikWs(wb.worksheets[0]);
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Balıkçı 150–250 m²",
    referansM2: REFERANS_M2,
    kaynakDosya: "2016-094 UÇAN BALIK/2016-094.xlsx",
    not: "Uçan Balık · balık restoran · soğuk oda · mutfak · bar",
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet: kalemler.reduce((t, r) => t + (typeof r.adet === "number" ? r.adet : 0), 0),
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const primary = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  try {
    const prev = JSON.parse(await fs.readFile(primary, "utf8"));
    if (!prev.kaynakDosya?.includes("094")) {
      await fs.writeFile(
        path.join(OUT, LEGACY_BACKUP),
        JSON.stringify(prev, null, 2),
        "utf8",
      );
      console.log("Yedek:", LEGACY_BACKUP);
    }
  } catch {
    /* */
  }
  await fs.writeFile(primary, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", primary, kalemler.length, "kalem");

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* */
  }
  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: liste.kalemSayisi,
    toplamAdet: liste.toplamAdet,
    kaynakDosya: liste.kaynakDosya,
    yukleme: liste.yukleme,
  };
  const bantlar = [
    { id: "mahalle", label: "Mahalle balıkçı", referansM2: 80, meta: { listeDosya: "balikci-mahalle.json" } },
    { id: "80-150", label: "80–150 m²", referansM2: 115, meta: { listeDosya: "balikci-80-150.json" } },
    { id: BANT_ID, label: "150–250 m² (Uçan Balık)", referansM2: REFERANS_M2, meta },
  ];
  const kayit = { id: KATEGORI_ID, label: "Balıkçı", ustKategori: "Restaurant", bantlar };
  if (idx >= 0) {
    const existing = kategoriler[idx];
    if (Array.isArray(existing.bantlar)) {
      for (const b of existing.bantlar) {
        if (b.id === "mahalle" || b.id === "80-150") {
          const bi = bantlar.findIndex((x) => x.id === b.id);
          if (bi >= 0 && b.meta) bantlar[bi].meta = b.meta;
        }
      }
    }
    kategoriler[idx] = kayit;
  } else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest güncellendi");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
