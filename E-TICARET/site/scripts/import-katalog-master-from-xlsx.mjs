/**
 * Ana besleyici Excel → equsto-katalog-master.json
 *   npm run catalog:master:import-xlsx
 *   npm run catalog:master:import-xlsx -- "C:\path\custom.xlsx"
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import {
  EKIPMANLAR_PATH,
  MASTER_JSON_PATH,
  MASTER_XLSX_FILENAME,
  MASTER_XLSX_PATH,
} from "./catalog-master-paths.mjs";

const XLSX = process.argv[2] || MASTER_XLSX_PATH;
const MASTER_JSON = MASTER_JSON_PATH;
const EKIP = EKIPMANLAR_PATH;

function normHeader(h) {
  return String(h || "")
    .trim()
    .toLocaleUpperCase("tr")
    .replace(/İ/g, "I")
    .replace(/Ş/g, "S")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C")
    .replace(/\s+/g, " ");
}

function findCol(headers, ...names) {
  for (const n of names) {
    const i = headers.findIndex((h) => normHeader(h) === normHeader(n));
    if (i >= 0) return i;
  }
  return -1;
}

function parseNum(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(String(v || "").replace(/[^\d.,-]/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  if (!fs.existsSync(XLSX)) {
    console.error("Excel bulunamadı:", XLSX);
    process.exit(1);
  }

  const prev = fs.existsSync(MASTER_JSON)
    ? JSON.parse(fs.readFileSync(MASTER_JSON, "utf8"))
    : { products: [] };
  const prevByEq = new Map(
    (prev.products || []).map((p) => [String(p.equsto_kod || "").toUpperCase(), p]),
  );
  const prevById = new Map(
    (prev.products || []).filter((p) => p.id).map((p) => [p.id, p]),
  );

  const ekipRows = fs.existsSync(EKIP)
    ? JSON.parse(fs.readFileSync(EKIP, "utf8"))
    : [];
  const ekipBySku = new Map();
  const ekipById = new Map();
  for (const r of ekipRows) {
    const key = `${String(r.brand || "")}::${String(r.sku || r.model || "").toUpperCase()}`;
    if (r.sku) ekipBySku.set(key, r);
    if (r.id) ekipById.set(r.id, r);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX);
  const ws = wb.worksheets[0];
  if (!ws) {
    console.error("Sayfa yok");
    process.exit(1);
  }

  let headers = [];
  const products = [];

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    const cells = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col - 1] = cell.value;
    });
    if (rowNumber === 1) {
      headers = cells.map((c) => String(c ?? "").trim());
      return;
    }

    const col = {
      equsto: findCol(headers, "EQUSTO KOD"),
      marka: findCol(headers, "MARKA"),
      markaUrun: findCol(headers, "MARKA ÜRÜN KODU", "MARKA URUN KODU"),
      aciklama: findCol(headers, "AÇIKLAMA", "ACIKLAMA"),
      teknik: findCol(headers, "TEKNİK ÖZELLİKLER", "TEKNIK OZELLIKLER"),
      olcu: findCol(headers, "ÖLÇÜLER", "OLCULER"),
      fiyat: findCol(headers, "FİYAT", "FIYAT"),
      kat: findCol(headers, "ÜRÜN KATEGORİ", "URUN KATEGORI"),
      altKat: findCol(headers, "ÜRÜN ALT KATEGORİ", "URUN ALT KATEGORI"),
      alt1: findCol(headers, "ALT KATEGORİ", "ALT KATEGORI"),
      alt2: findCol(headers, "ALT KATEGORİ", "ALT KATEGORI") >= 0 ? findCol(headers, "ALT KATEGORİ", "ALT KATEGORI") + 1 : -1,
    };

    const equsto_kod = String(cells[col.equsto] ?? "").trim();
    if (!equsto_kod) return;

    const marka = String(cells[col.marka] ?? "").trim();
    const marka_urun_kodu = String(cells[col.markaUrun] ?? "").trim();
    const prevRow =
      prevByEq.get(equsto_kod.toUpperCase()) ||
      prevById.get(
        [...prevById.values()].find(
          (p) =>
            p.marka_urun_kodu?.toUpperCase() === marka_urun_kodu.toUpperCase() &&
            p.marka === marka,
        )?.id,
      );

    const ekipMatch =
      ekipBySku.get(`${marka}::${marka_urun_kodu.toUpperCase()}`) ||
      (prevRow?.id ? ekipById.get(prevRow.id) : null);

    const altKategori2 =
      col.alt2 >= 0 && col.alt2 < cells.length
        ? String(cells[col.alt2] ?? "").trim()
        : "";

    products.push({
      equsto_kod,
      marka,
      marka_kodu: prevRow?.marka_kodu || ekipMatch?.marka_kodu || "",
      marka_urun_kodu,
      aciklama: String(cells[col.aciklama] ?? "").trim(),
      teknik_ozellikler: String(cells[col.teknik] ?? "").trim(),
      olculer: String(cells[col.olcu] ?? "").trim(),
      fiyat_eur: parseNum(cells[col.fiyat]),
      urun_kategori: String(cells[col.kat] ?? "").trim(),
      urun_alt_kategori: String(cells[col.altKat] ?? "").trim(),
      alt_kategori_1: col.alt1 >= 0 ? String(cells[col.alt1] ?? "").trim() : "",
      alt_kategori_2: altKategori2,
      dept: prevRow?.dept || ekipMatch?.dept || "",
      category: prevRow?.category || ekipMatch?.category || "",
      id: prevRow?.id || ekipMatch?.id || "",
      fiyat_tl: prevRow?.fiyat_tl ?? ekipMatch?.fiyat_tl ?? null,
      image:
        prevRow?.image ||
        (Array.isArray(ekipMatch?.images) ? ekipMatch.images[0] : null),
    });
  });

  const out = {
    generated: new Date().toISOString(),
    source: path.basename(XLSX) === MASTER_XLSX_FILENAME
      ? MASTER_XLSX_FILENAME
      : path.basename(XLSX),
    count: products.length,
    schema: headers,
    products,
  };

  fs.writeFileSync(MASTER_JSON, JSON.stringify(out, null, 2), "utf8");
  console.log("[master:import-xlsx] ürün:", products.length);
  console.log("[master:import-xlsx] →", MASTER_JSON);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
