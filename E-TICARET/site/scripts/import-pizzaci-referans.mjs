/**
 * Pizzacı PROFORMA Excel → pfos-referans + pfos-kategoriler.json
 * Kullanım: node scripts/import-pizzaci-referans.mjs [bantId]
 *   bantId yok → tüm bantlar (80-200, 200-500)
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

const KATEGORI_ID = "pizzaci";

/** PROFORMA: C=alan, E=poz, G=ürün, K=ölçü, O=adet */
const BANDS = [
  {
    id: "80-200",
    xlsx: "pizzaci-80-200m2.xlsx",
    label: "Pizzacı 80–200 m²",
    referansM2: 140,
    kaynakNot: "MIALIENTO Avcılar · 80–200 m² proforma",
  },
  {
    id: "200-500",
    xlsx: "pizzaci-200-500-m2.xlsx",
    label: "Pizzacı 200–500 m²",
    referansM2: 350,
    kaynakNot: "2025-116 Pizzacı Avcılar (Murat Çaylar) · 2025-116-2.xlsx",
  },
];

const POZ_RE = /^[A-Z]\d{1,2}A?$/i;
function isPoz(s) {
  return POZ_RE.test(String(s).trim());
}
function cellStr(v) {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v) return String(v.text).trim();
  return String(v).trim();
}
function parseAdet(raw) {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  const n = parseInt(String(raw).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : "—";
}

function parseProformaWs(ws) {
  const rows = [];
  let bolum = "";
  let bolumAd = "";
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 21) return;
    const alan = cellStr(row.getCell(3).value);
    const poz = cellStr(row.getCell(5).value);
    const ad = cellStr(row.getCell(7).value);
    const olcuRaw = row.getCell(11).value;
    const adetRaw = row.getCell(15).value;

    if (alan && !poz && !ad) {
      bolumAd = alan;
      bolum = alan.split(/[\s-]/)[0]?.trim() || alan.charAt(0);
      return;
    }
    if (!poz || !ad || !isPoz(poz)) return;
    if (/^poz$/i.test(ad) || /^ürün adı$/i.test(ad) || /^açıklama/i.test(ad)) return;

    rows.push({
      bolum,
      bolumAd,
      poz: poz.toUpperCase(),
      ad,
      olcu: olcuRaw != null && String(olcuRaw).trim() ? String(olcuRaw).trim() : "—",
      adet: parseAdet(adetRaw),
    });
  });
  return rows;
}

async function importBand(band) {
  const src = path.join(PROJE_VERI, band.xlsx);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const kalemler = parseProformaWs(wb.worksheets[0]);
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const liste = {
    kategoriId: KATEGORI_ID,
    bantId: band.id,
    label: band.label,
    referansM2: band.referansM2,
    kaynakDosya: band.xlsx,
    kaynakNot: band.kaynakNot,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const dest = path.join(OUT, `${KATEGORI_ID}-${band.id}.json`);
  await fs.writeFile(dest, JSON.stringify(liste, null, 2), "utf8");
  console.log("OK", dest, kalemler.length, "kalem");
  return { band, liste };
}

function mergePizzaciManifest(manifest, imported) {
  const kategoriler = Array.isArray(manifest.kategoriler) ? [...manifest.kategoriler] : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const prev = idx >= 0 ? kategoriler[idx] : null;
  const bantMap = new Map((prev?.bantlar ?? []).map((b) => [b.id, b]));

  for (const { band, liste } of imported) {
    bantMap.set(band.id, {
      id: band.id,
      label: band.id === "80-200" ? "80–200 m²" : "200–500 m²",
      referansM2: band.referansM2,
      meta: {
        listeDosya: `${KATEGORI_ID}-${band.id}.json`,
        kalemSayisi: liste.kalemSayisi,
        toplamAdet: liste.toplamAdet,
        kaynakDosya: liste.kaynakDosya,
        kaynakNot: liste.kaynakNot,
        yukleme: liste.yukleme,
      },
    });
  }

  const bantlar = [...bantMap.values()].sort((a, b) => a.referansM2 - b.referansM2);
  const kayit = {
    id: KATEGORI_ID,
    label: "Pizzacı",
    ustKategori: "Restaurant",
    bantlar,
  };
  if (idx >= 0) kategoriler[idx] = kayit;
  else kategoriler.push(kayit);
  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  return manifest;
}

async function main() {
  const only = process.argv[2]?.trim();
  const bands = only ? BANDS.filter((b) => b.id === only) : BANDS;
  if (!bands.length) {
    console.error("Bilinmeyen bant:", only, "— geçerli:", BANDS.map((b) => b.id).join(", "));
    process.exit(1);
  }

  const imported = [];
  for (const band of bands) {
    imported.push(await importBand(band));
  }

  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch {
    /* yeni manifest */
  }
  manifest = mergePizzaciManifest(manifest, imported);
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
