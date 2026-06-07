import { readFile } from "fs/promises";
import path from "path";
import type ExcelJS from "exceljs";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import {
  TEKLIF_V14_TEMPLATE_PATH,
  TEKLIF_BOLUM_ROW_FILL_ARGB,
} from "./constants";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import { formatTarihTr, kwHucreExcelValue } from "./format-v14";

const PRODUCT_BLOCK_START = 5;
const PRODUCT_BLOCK_ROWS = 16;
const DATA_TEMPLATE_ROW = 6;
const SPEC_TEMPLATE_ROW = 7;
const SECTION_TEMPLATE_ROW = 5;
const KW_TOTAL_TEMPLATE_ROW = 12;
const SUBTOTAL_TEMPLATE_ROW = 13;
const GRAND_TEMPLATE_ROW = 14;

type RowStyleTpl = {
  height?: number;
  styles: Record<number, Partial<ExcelJS.Style>>;
};

function captureRowStyle(ws: ExcelJS.Worksheet, rowNum: number): RowStyleTpl {
  const styles: Record<number, Partial<ExcelJS.Style>> = {};
  const row = ws.getRow(rowNum);
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    styles[col] = cell.style ? JSON.parse(JSON.stringify(cell.style)) : {};
  });
  return { height: row.height, styles };
}

function applyRowStyle(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  tpl: RowStyleTpl | undefined,
) {
  if (!tpl) return;
  const dst = ws.getRow(rowNum);
  if (tpl.height) dst.height = tpl.height;
  for (const [col, style] of Object.entries(tpl.styles)) {
    ws.getCell(rowNum, Number(col)).style = style;
  }
}

function fillHeader(ws: ExcelJS.Worksheet, model: TeklifModelV14) {
  const { ust } = model;
  const tarih = formatTarihTr(ust.tarih);
  const kur = ust.eurTry != null && ust.eurTry > 0 ? ust.eurTry : 1;

  ws.getCell("J1").value = ust.sayi;
  ws.getCell("C2").value = ust.projeAdi;
  ws.getCell("C3").value = ust.musteri || "—";
  ws.getCell("J2").value = tarih;
  ws.getCell("A3").value = `TCMB Efektif Satış Kuru – ${tarih}`;
  ws.getCell("I3").value = "EUR/TRY";
  const kurCell = ws.getCell("J3");
  kurCell.value = kur;
  kurCell.numFmt = '"₺"#,##0.00';
}

function writeDataRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  satir: TeklifV14Satir,
) {
  ws.getCell(rowNum, 1).value = satir.bolumNo;
  ws.getCell(rowNum, 2).value = satir.poz;
  ws.getCell(rowNum, 3).value = satir.ek ?? "";
  ws.getCell(rowNum, 4).value = satir.stokNo;
  ws.getCell(rowNum, 5).value = satir.tanim;
  ws.getCell(rowNum, 6).value = satir.marka;
  ws.getCell(rowNum, 7).value = satir.olcu || "—";
  ws.getCell(rowNum, 8).value = kwHucreExcelValue(satir.elkKw);
  ws.getCell(rowNum, 8).numFmt = "0.0";
  ws.getCell(rowNum, 9).value = kwHucreExcelValue(satir.gazKw);
  ws.getCell(rowNum, 9).numFmt = "0.0";
  ws.getCell(rowNum, 10).value = satir.adet;
  ws.getCell(rowNum, 11).value = satir.birimSatis ?? 0;
  ws.getCell(rowNum, 11).numFmt = "#,##0.00";
  ws.getCell(rowNum, 12).value = { formula: `J${rowNum}*K${rowNum}` };
  ws.getCell(rowNum, 12).numFmt = "#,##0.00";
  ws.getCell(rowNum, 13).value = satir.doviz;
}

function writeSpecRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  satir: TeklifV14Satir,
  specTpl: RowStyleTpl,
) {
  applyRowStyle(ws, rowNum, specTpl);
  try {
    ws.mergeCells(`A${rowNum}:G${rowNum}`);
    ws.mergeCells(`H${rowNum}:M${rowNum}`);
  } catch {
    /* merged */
  }
  ws.getCell(rowNum, 1).value = satir.fotoNot ?? "Fotoğraf";
  ws.getCell(rowNum, 8).value = satir.aciklama ?? "";
  ws.getRow(rowNum).height = 80;
}

function applyBolumRowFill(ws: ExcelJS.Worksheet, rowNum: number, colCount = 13) {
  for (let col = 1; col <= colCount; col++) {
    ws.getCell(rowNum, col).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TEKLIF_BOLUM_ROW_FILL_ARGB },
    };
  }
}

function buildProductBlock(ws: ExcelJS.Worksheet, model: TeklifModelV14) {
  const dataTpl = captureRowStyle(ws, DATA_TEMPLATE_ROW);
  const specTpl = captureRowStyle(ws, SPEC_TEMPLATE_ROW);
  const sectionTpl = captureRowStyle(ws, SECTION_TEMPLATE_ROW);
  const kwTpl = captureRowStyle(ws, KW_TOTAL_TEMPLATE_ROW);
  const subTpl = captureRowStyle(ws, SUBTOTAL_TEMPLATE_ROW);
  const grandTpl = captureRowStyle(ws, GRAND_TEMPLATE_ROW);

  ws.spliceRows(PRODUCT_BLOCK_START, PRODUCT_BLOCK_ROWS);

  let rowNum = PRODUCT_BLOCK_START;
  const sumRefs: string[] = [];
  const elkParts: string[] = [];
  const gazParts: string[] = [];
  const adetRefs: string[] = [];

  for (const block of groupTeklifV14Satirlar(model.satirlar)) {
    ws.insertRow(rowNum, []);
    applyRowStyle(ws, rowNum, sectionTpl);
    applyBolumRowFill(ws, rowNum);
    try {
      ws.mergeCells(`A${rowNum}:M${rowNum}`);
    } catch {
      /* merged */
    }
    ws.getCell(rowNum, 1).value = block.bolumBaslik;
    rowNum++;

    for (const satir of block.satirlar) {
      ws.insertRow(rowNum, []);
      applyRowStyle(ws, rowNum, dataTpl);
      writeDataRow(ws, rowNum, satir);
      const dr = rowNum;
      sumRefs.push(`L${dr}`);
      elkParts.push(`H${dr}*J${dr}`);
      gazParts.push(`I${dr}*J${dr}`);
      adetRefs.push(`J${dr}`);
      rowNum++;

      ws.insertRow(rowNum, []);
      writeSpecRow(ws, rowNum, satir, specTpl);
      rowNum++;
    }
  }

  const sumFormula = sumRefs.length ? sumRefs.join("+") : "0";
  const elkSum = elkParts.length ? elkParts.join("+") : "0";
  const gazSum = gazParts.length ? gazParts.join("+") : "0";
  const adetSum = adetRefs.length ? `SUM(${adetRefs.join(",")})` : "0";

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, kwTpl);
  ws.getCell(rowNum, 5).value = "Gazlı cihaz toplam bağlantısı (kW)";
  if (gazParts.length) {
    ws.getCell(rowNum, 9).value = { formula: gazSum };
    ws.getCell(rowNum, 9).numFmt = "0.0";
  }
  rowNum++;

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, subTpl);
  ws.getCell(rowNum, 7).value = "Sütun toplamları →";
  if (elkParts.length) {
    ws.getCell(rowNum, 8).value = { formula: elkSum };
    ws.getCell(rowNum, 8).numFmt = "0.0";
  }
  if (gazParts.length) {
    ws.getCell(rowNum, 9).value = { formula: gazSum };
    ws.getCell(rowNum, 9).numFmt = "0.0";
  }
  if (adetRefs.length) {
    ws.getCell(rowNum, 10).value = { formula: adetSum };
  }
  rowNum++;

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, grandTpl);
  ws.getCell(rowNum, 10).value = "GENEL TOPLAM";
  ws.getCell(rowNum, 10).font = { bold: true };
  ws.getCell(rowNum, 12).value = { formula: sumFormula };
  ws.getCell(rowNum, 12).numFmt = "#,##0.00";
  ws.getCell(rowNum, 13).value = model.ozet.doviz;
}

/** Sunucu — PFOS v14 Excel (e-posta eki) */
async function loadTemplateBytes(): Promise<Buffer> {
  const candidates = [
    TEKLIF_V14_TEMPLATE_PATH,
    path.join(process.cwd(), "public/data/templates/equsto_teklif_v14.xlsx"),
    path.join(process.cwd(), "templates/teklif-v14.xlsx"),
  ];
  for (const p of candidates) {
    try {
      return await readFile(p);
    } catch {
      /* next */
    }
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://equsto.com";
  const res = await fetch(`${site}/data/templates/equsto_teklif_v14.xlsx`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Teklif Excel şablonu bulunamadı");
  return Buffer.from(await res.arrayBuffer());
}

export async function generateTeklifV14ExcelBuffer(
  model: TeklifModelV14,
): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default;
  const templateBytes = await loadTemplateBytes();
  const wb = new ExcelJS.Workbook();
  const templateAb = templateBytes.buffer.slice(
    templateBytes.byteOffset,
    templateBytes.byteOffset + templateBytes.byteLength,
  );
  // @ts-expect-error exceljs Buffer typings vs Node 22
  await wb.xlsx.load(templateAb);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sayfası bulunamadı");

  fillHeader(ws, model);
  buildProductBlock(ws, model);

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
