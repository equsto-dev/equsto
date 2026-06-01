/**
 * equsto_teklif_v14.xlsx — PFOS Excel export şablonu.
 *   node scripts/generate-teklif-v14-template.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "data", "templates", "equsto_teklif_v14.xlsx");
const also = path.join(root, "templates", "teklif-v14.xlsx");

const BOLUM_FILL = "FFE6F4EA";
const fontHdr = { name: "Arial", size: 8, bold: true };
const fontBold = { name: "Arial", size: 9, bold: true };
const fontNorm = { name: "Arial", size: 9 };
const center = { horizontal: "center", vertical: "middle", wrapText: true };
const leftTop = { horizontal: "left", vertical: "top", wrapText: true };

function borderThin() {
  const s = { style: "thin", color: { argb: "FFCCCCCC" } };
  return { top: s, left: s, bottom: s, right: s };
}

function fillRow(ws, row, argb) {
  for (let c = 1; c <= 13; c++) {
    ws.getCell(row, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb },
    };
  }
}

function mergeSafe(ws, r1, c1, r2, c2) {
  try {
    ws.mergeCells(r1, c1, r2, c2);
  } catch {
    /* already merged */
  }
}

async function build() {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Teklif", {
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  ws.columns = [
    { width: 4 },
    { width: 6 },
    { width: 4 },
    { width: 12 },
    { width: 28 },
    { width: 12 },
    { width: 10 },
    { width: 8 },
    { width: 8 },
    { width: 6 },
    { width: 10 },
    { width: 12 },
    { width: 6 },
  ];

  ws.getCell("A1").value = "PROFORMA FATURA";
  ws.getCell("A1").font = { name: "Arial", size: 14, bold: true };
  ws.getCell("C1").value = "Proje:";
  ws.getCell("C1").font = fontBold;
  ws.getCell("C2").value = "";
  ws.getCell("A2").value = "Müşteri:";
  ws.getCell("A2").font = fontBold;
  ws.getCell("C3").value = "";
  ws.getCell("I1").value = "Sayı:";
  ws.getCell("I1").font = fontBold;
  ws.getCell("J1").value = "";
  ws.getCell("I2").value = "Tarih:";
  ws.getCell("I2").font = fontBold;
  ws.getCell("J2").value = "";
  ws.getCell("A3").value = "TCMB Efektif Satış Kuru";
  ws.getCell("A3").font = fontNorm;
  ws.getCell("I3").value = "EUR/TRY";
  ws.getCell("I3").font = fontBold;
  ws.getCell("J3").value = 1;
  ws.getCell("J3").numFmt = '"₺"#,##0.00';

  const headers = [
    "Böl.",
    "Poz",
    "EK",
    "Stok no",
    "Tanımı",
    "Marka",
    "Ölçü",
    "Elk. kW",
    "Gaz kW",
    "Adet",
    "Satış",
    "Toplam",
    "Döviz",
  ];
  headers.forEach((h, i) => {
    const c = ws.getCell(4, i + 1);
    c.value = h;
    c.font = fontHdr;
    c.alignment = center;
    c.border = borderThin();
  });

  // Row 5 — bölüm başlığı şablonu
  mergeSafe(ws, 5, 1, 5, 13);
  ws.getCell(5, 1).value = "01. MUTFAK";
  ws.getCell(5, 1).font = fontBold;
  ws.getCell(5, 1).alignment = { horizontal: "left", vertical: "middle" };
  fillRow(ws, 5, BOLUM_FILL);

  // Row 6 — ürün satırı şablonu
  const sample = {
    bol: "01",
    poz: "A01",
    ek: "",
    stok: "STK-001",
    tanim: "Örnek ürün",
    marka: "Marka",
    olcu: "600×800×900",
    elk: 3.5,
    gaz: 0,
    adet: 1,
    satis: 1000,
  };
  ws.getCell(6, 1).value = sample.bol;
  ws.getCell(6, 2).value = sample.poz;
  ws.getCell(6, 3).value = sample.ek;
  ws.getCell(6, 4).value = sample.stok;
  ws.getCell(6, 5).value = sample.tanim;
  ws.getCell(6, 6).value = sample.marka;
  ws.getCell(6, 7).value = sample.olcu;
  ws.getCell(6, 8).value = sample.elk;
  ws.getCell(6, 8).numFmt = "0.0";
  ws.getCell(6, 9).value = sample.gaz;
  ws.getCell(6, 9).numFmt = "0.0";
  ws.getCell(6, 10).value = sample.adet;
  ws.getCell(6, 11).value = sample.satis;
  ws.getCell(6, 11).numFmt = "#,##0.00";
  ws.getCell(6, 12).value = { formula: "J6*K6" };
  ws.getCell(6, 12).numFmt = "#,##0.00";
  ws.getCell(6, 13).value = "EUR";
  for (let c = 1; c <= 13; c++) {
    ws.getCell(6, c).font = fontNorm;
    ws.getCell(6, c).border = borderThin();
  }

  // Row 7 — foto + açıklama şablonu
  mergeSafe(ws, 7, 1, 7, 7);
  mergeSafe(ws, 7, 8, 7, 13);
  ws.getCell(7, 1).value = "📷\nFotoğraf";
  ws.getCell(7, 1).alignment = center;
  ws.getCell(7, 8).value = "•  Örnek teknik açıklama";
  ws.getCell(7, 8).alignment = leftTop;
  ws.getRow(7).height = 120;
  for (let c = 1; c <= 13; c++) {
    ws.getCell(7, c).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFAFAFA" },
    };
    ws.getCell(7, c).border = borderThin();
  }

  // Rows 8-11 filler (splice block içinde)
  for (let r = 8; r <= 11; r++) {
    for (let c = 1; c <= 13; c++) ws.getCell(r, c).border = borderThin();
  }

  // Row 12 — gaz toplam şablonu
  ws.getCell(12, 5).value = "Gazlı cihaz toplam bağlantısı (kW)";
  ws.getCell(12, 5).font = fontBold;
  ws.getCell(12, 9).numFmt = "0.0";
  for (let c = 1; c <= 13; c++) ws.getCell(12, c).border = borderThin();

  // Row 13 — sütun toplamları
  ws.getCell(13, 7).value = "Sütun toplamları →";
  ws.getCell(13, 7).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(13, 8).numFmt = "0.0";
  ws.getCell(13, 9).numFmt = "0.0";
  for (let c = 1; c <= 13; c++) ws.getCell(13, c).border = borderThin();

  // Row 14 — genel toplam
  ws.getCell(14, 10).value = "GENEL TOPLAM";
  ws.getCell(14, 10).font = fontBold;
  ws.getCell(14, 12).numFmt = "#,##0.00";
  ws.getCell(14, 13).value = "EUR";
  for (let c = 1; c <= 13; c++) ws.getCell(14, c).border = borderThin();

  // Rows 15-20 padding (PRODUCT_BLOCK_ROWS = 16)
  for (let r = 15; r <= 20; r++) {
    for (let c = 1; c <= 13; c++) ws.getCell(r, c).border = borderThin();
  }

  // Şartlar
  let r = 22;
  const sartlar = [
    "ŞARTLARIMIZ",
    "  01.   Teklifimiz 7 (YEDİ) gün geçerlidir.",
    "  02.   Fiyatlarımıza KDV dahil değildir, faturada ayrıca eklenecektir.",
    "  17.   Equsto.com yapay zekadan yardım alır; hata yapabilir. Nihai teyit satıcı onayındadır.",
  ];
  for (const line of sartlar) {
    ws.getCell(r, 1).value = line;
    ws.getCell(r, 1).font = line.startsWith("  ") ? fontNorm : fontBold;
    mergeSafe(ws, r, 1, r, 13);
    r++;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const buf = await wb.xlsx.writeBuffer();
  fs.writeFileSync(out, Buffer.from(buf));
  fs.mkdirSync(path.dirname(also), { recursive: true });
  fs.writeFileSync(also, Buffer.from(buf));
  console.log("[teklif-v14] Yazıldı:", out);
  console.log("[teklif-v14] Kopya:", also);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
