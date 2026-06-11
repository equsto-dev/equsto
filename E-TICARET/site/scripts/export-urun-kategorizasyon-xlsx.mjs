/**
 * ekipmanlar.json → Excel/JSON (yalnızca ilk doldurma / ters yön)
 * Ana besleyici: PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx — düzenleme sonrası import-xlsx kullanın.
 *
 *   npm run catalog:kategorizasyon:export
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import {
  EKIPMANLAR_PATH,
  MASTER_JSON_PATH,
  MASTER_XLSX_FILENAME,
  MASTER_XLSX_PATH,
  MASTER_XLSX_TEMPLATE_PATH,
} from "./catalog-master-paths.mjs";

const EKIP = EKIPMANLAR_PATH;
const TEMPLATE = MASTER_XLSX_TEMPLATE_PATH;
const OUT_XLSX = process.argv[2] || MASTER_XLSX_PATH;
const OUT_JSON = MASTER_JSON_PATH;

const DEPT_ORDER = [
  "pisirme",
  "sogutma",
  "tezgah",
  "istif",
  "dolap",
  "davlumbaz",
  "yikama",
  "bulasik",
  "icecek",
  "kahve",
  "hazirlik",
  "araba",
  "tasima",
  "servis",
  "market-reyon",
  "set-ustu-mutfak",
];

const DEPT_LABEL = {
  pisirme: "Pişirme",
  sogutma: "Soğutma",
  tezgah: "Tezgah",
  istif: "İstif & Depolama",
  dolap: "Dolap",
  davlumbaz: "Davlumbaz",
  yikama: "Yıkama",
  bulasik: "Bulaşık Yıkama",
  icecek: "İçecek",
  kahve: "Kahve",
  hazirlik: "Hazırlık",
  araba: "Servis Arabaları",
  tasima: "Taşıma",
  servis: "Servis",
  "market-reyon": "Market Reyon",
  "set-ustu-mutfak": "Set Üstü Mutfak",
};

const BRAND_RULES = [
  [/atalay/i, "ATALAY"],
  [/öztiryakiler|oztiryakiler/i, "OZTI"],
  [/çağlayan|caglayan/i, "CAGLAYAN"],
  [/electrolux/i, "ELECTROLUX"],
  [/proso/i, "PROSO"],
  [/portabianco|yüksel|yuksel/i, "YUKSEL"],
  [/pimak/i, "PIMAK"],
  [/inoksan/i, "INOKSAN"],
  [/robot\s*coupe/i, "ROBOTCOUPE"],
  [/rational/i, "RATIONAL"],
  [/samixir/i, "SAMIXIR"],
  [/senox/i, "SENOX"],
  [/vosco/i, "VOSCO"],
  [/equsto/i, "EQUSTO"],
];

function brandKod(brandName) {
  const b = String(brandName || "");
  for (const [re, kod] of BRAND_RULES) {
    if (re.test(b)) return kod;
  }
  return b
    .replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, "")
    .trim()
    .split(/\s+/)[0]
    .toLocaleUpperCase("tr")
    .slice(0, 12) || "MARKA";
}

function slugLabel(slug) {
  return String(slug || "")
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1))
    .join(" ");
}

function parseSpecsField(specs, key) {
  const m = String(specs || "").match(
    new RegExp(`^${key}:\\s*(.+)$`, "im"),
  );
  return m ? m[1].trim() : "";
}

function extractOlcu(name, specs) {
  const n = String(name || "");
  const m =
    n.match(/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)\s*mm/i) ||
    n.match(/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)/i);
  if (m) return `${m[1]}×${m[2]}×${m[3]} mm`;
  const m2 = specs.match(/(\d+)\s*[x×]\s*(\d+)\s*[x×]\s*(\d+)/i);
  if (m2) return `${m2[1]}×${m2[2]}×${m2[3]} mm`;
  return "";
}

function sanitizeSkuForEqusto(sku) {
  return String(sku || "")
    .trim()
    .replace(/\s+/g, "")
    .slice(0, 64);
}

function buildEqustoKod(brandKodVal, sku, seen) {
  const uk = sanitizeSkuForEqusto(sku);
  let core = uk ? `${brandKodVal}.${uk}` : brandKodVal;
  let kod = `EQ-${core}`;
  let n = 2;
  while (seen.has(kod)) {
    kod = `EQ-${core}-${n++}`;
  }
  seen.add(kod);
  return kod;
}

function deptRank(dept) {
  const i = DEPT_ORDER.indexOf(dept);
  return i >= 0 ? i : 999;
}

function sortRows(a, b) {
  const dr = deptRank(a.dept) - deptRank(b.dept);
  if (dr) return dr;
  const br = String(a.marka || "").localeCompare(String(b.marka || ""), "tr");
  if (br) return br;
  const cr = String(a.category || "").localeCompare(String(b.category || ""), "tr");
  if (cr) return cr;
  return String(a.aciklama || "").localeCompare(String(b.aciklama || ""), "tr");
}

function rowToExport(row, seenEq) {
  const brand = String(row.brand || "").trim();
  const bk = brandKod(brand);
  const sku = String(row.sku || row.model || "").trim();
  const dept = String(row.dept || "").trim();
  const category = String(row.category || "").trim();
  const specs = String(row.specs || "");
  const kategoriSpecs = parseSpecsField(specs, "Kategori");
  const seri = parseSpecsField(specs, "Seri");
  const equstoKod = buildEqustoKod(bk, sku || row.id, seenEq);
  const fiyatEur =
    row.liste_fiyati_eur != null && Number(row.liste_fiyati_eur) > 0
      ? Number(row.liste_fiyati_eur)
      : row.satis_eur_indirimli != null && Number(row.satis_eur_indirimli) > 0
        ? Number(row.satis_eur_indirimli)
        : null;

  return {
    equsto_kod: equstoKod,
    marka: brand,
    marka_kodu: bk,
    marka_urun_kodu: sku,
    aciklama: String(row.name || "").trim(),
    teknik_ozellikler: specs.slice(0, 8000),
    olculer: extractOlcu(row.name, specs),
    fiyat_eur: fiyatEur,
    urun_kategori: DEPT_LABEL[dept] || slugLabel(dept) || dept,
    urun_alt_kategori: slugLabel(category),
    alt_kategori_1: kategoriSpecs || "",
    alt_kategori_2: seri || "",
    dept,
    category,
    id: row.id,
    fiyat_tl: row.fiyat_tl ?? null,
    image: Array.isArray(row.images) ? row.images[0] : null,
  };
}

const HEADERS = [
  "EQUSTO KOD",
  "MARKA",
  "MARKA ÜRÜN KODU",
  "AÇIKLAMA",
  "TEKNİK ÖZELLİKLER",
  "ÖLÇÜLER",
  "FİYAT",
  "ÜRÜN KATEGORİ",
  "ÜRÜN ALT KATEGORİ",
  "ALT KATEGORİ",
  "ALT KATEGORİ",
];

async function main() {
  if (!fs.existsSync(EKIP)) {
    console.error("ekipmanlar.json bulunamadı:", EKIP);
    process.exit(1);
  }

  const rows = JSON.parse(fs.readFileSync(EKIP, "utf8"));
  if (!Array.isArray(rows) || !rows.length) {
    console.error("ekipmanlar.json boş");
    process.exit(1);
  }

  const seenEq = new Set();
  const exported = rows.map((r) => rowToExport(r, seenEq)).sort(sortRows);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sayfa1");

  ws.addRow(HEADERS);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", wrapText: true };

  for (const r of exported) {
    ws.addRow([
      r.equsto_kod,
      r.marka,
      r.marka_urun_kodu,
      r.aciklama,
      r.teknik_ozellikler,
      r.olculer,
      r.fiyat_eur != null ? r.fiyat_eur : "",
      r.urun_kategori,
      r.urun_alt_kategori,
      r.alt_kategori_1,
      r.alt_kategori_2,
    ]);
  }

  ws.columns = [
    { width: 28 },
    { width: 32 },
    { width: 18 },
    { width: 48 },
    { width: 40 },
    { width: 18 },
    { width: 12 },
    { width: 22 },
    { width: 28 },
    { width: 24 },
    { width: 24 },
  ];

  fs.mkdirSync(path.dirname(OUT_XLSX), { recursive: true });
  await wb.xlsx.writeFile(OUT_XLSX);

  const master = {
    generated: new Date().toISOString(),
    source: `export:ekipmanlar.json (ters yön — ana besleyici: ${MASTER_XLSX_FILENAME})`,
    count: exported.length,
    schema: HEADERS,
    products: exported,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(master, null, 2), "utf8");

  const byBrand = {};
  for (const r of exported) {
    byBrand[r.marka_kodu] = (byBrand[r.marka_kodu] || 0) + 1;
  }

  console.log("[kategorizasyon:export] ürün:", exported.length);
  console.log("[kategorizasyon:export] xlsx:", OUT_XLSX);
  console.log("[kategorizasyon:export] json:", OUT_JSON);
  console.log("[kategorizasyon:export] marka dağılımı:");
  for (const [k, n] of Object.entries(byBrand).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${n}`);
  }
  if (fs.existsSync(TEMPLATE)) {
    console.log("[kategorizasyon:export] şablon:", TEMPLATE);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
