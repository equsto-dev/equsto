"use client";

import type ExcelJS from "exceljs";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import {
  TEKLIF_V14_TEMPLATE_URL,
  TEKLIF_V14_FORM_NO,
  TEKLIF_BOLUM_ROW_FILL_ARGB,
} from "./constants";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import { formatTarihTr, kwHucreExcelValue } from "./format-v14";
import { fetchTcmbKurForTeklif } from "./fetch-kur.client";

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
  ws.getCell(rowNum, 12).value = {
    formula: `J${rowNum}*K${rowNum}`,
  };
  ws.getCell(rowNum, 12).numFmt = "#,##0.00";
  ws.getCell(rowNum, 13).value = satir.doviz;
}

function absFetchUrl(url: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (typeof window !== "undefined") {
    return new URL(u.startsWith("/") ? u : `/${u}`, window.location.origin).href;
  }
  return u;
}

async function fetchImageBuffer(
  url: string,
): Promise<{ buffer: ArrayBuffer; extension: "png" | "jpeg" | "gif" } | null> {
  try {
    const res = await fetch(absFetchUrl(url), { cache: "force-cache" });
    if (!res.ok) return null;
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const extension: "png" | "jpeg" | "gif" = ct.includes("png")
      ? "png"
      : ct.includes("gif")
        ? "gif"
        : "jpeg";
    return { buffer: await res.arrayBuffer(), extension };
  } catch {
    return null;
  }
}

async function writeSpecRow(
  wb: ExcelJS.Workbook,
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

  const img = satir.fotoUrl ? await fetchImageBuffer(satir.fotoUrl) : null;
  if (img) {
    const imageId = wb.addImage({
      buffer: img.buffer,
      extension: img.extension,
    });
    ws.addImage(imageId, {
      tl: { col: 0.2, row: rowNum - 1 + 0.15 },
      ext: { width: 110, height: 90 },
    });
    ws.getCell(rowNum, 1).value = "";
  } else {
    ws.getCell(rowNum, 1).value = satir.fotoNot ?? "📷\nFotoğraf";
    ws.getCell(rowNum, 1).alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    } as ExcelJS.Alignment;
  }

  ws.getCell(rowNum, 8).value = satir.aciklama ?? "";
  ws.getCell(rowNum, 8).alignment = {
    horizontal: "left",
    vertical: "top",
    wrapText: true,
  };
  ws.getRow(rowNum).height = 120;
}

function applyBolumRowFill(ws: ExcelJS.Worksheet, rowNum: number, colCount = 13) {
  for (let col = 1; col <= colCount; col++) {
    const cell = ws.getCell(rowNum, col);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TEKLIF_BOLUM_ROW_FILL_ARGB },
    };
  }
}

async function buildProductBlock(
  ws: ExcelJS.Worksheet,
  model: TeklifModelV14,
  wb: ExcelJS.Workbook,
) {
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
      await writeSpecRow(wb, ws, rowNum, satir, specTpl);
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

async function fetchEurTry(): Promise<number | null> {
  const snap = await fetchTcmbKurForTeklif();
  return snap?.rate ?? null;
}

/** equsto_teklif_v14.xlsx şablonunu doldurup indirir */
export async function downloadTeklifV14Excel(model: TeklifModelV14) {
  const ExcelJS = (await import("exceljs")).default;

  let merged = model;
  if (merged.ust.eurTry == null) {
    const rate = await fetchEurTry();
    if (rate) {
      merged = {
        ...model,
        ust: { ...model.ust, eurTry: rate },
      };
    }
  }

  const res = await fetch(TEKLIF_V14_TEMPLATE_URL, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Şablon yüklenemedi: ${TEKLIF_V14_TEMPLATE_URL}`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await res.arrayBuffer());
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Excel sayfası bulunamadı");

  fillHeader(ws, merged);
  await buildProductBlock(ws, merged, wb);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `equsto-teklif-${merged.ust.sayi}.xlsx`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 400);
}

export { TEKLIF_V14_FORM_NO, TEKLIF_V14_TEMPLATE_URL };
