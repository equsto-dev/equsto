import type ExcelJS from "exceljs";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import { TEKLIF_BOLUM_ROW_FILL_ARGB, uniqueTeklifV14Sartlar } from "./constants";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import {
  formatTarihTr,
  kwHucreExcelValue,
  KW_HUCRE_EXCEL_NUMFMT,
  dovizSembol,
} from "./format-v14";
import { publicAssetUrl } from "@/lib/public-asset-url";

const PRODUCT_BLOCK_START = 5;
const PRODUCT_BLOCK_ROWS = 16;
const DATA_TEMPLATE_ROW = 6;
const SPEC_TEMPLATE_ROW = 7;
const SECTION_TEMPLATE_ROW = 5;
const KW_TOTAL_TEMPLATE_ROW = 12;
const SUBTOTAL_TEMPLATE_ROW = 13;
const GRAND_TEMPLATE_ROW = 14;
const TEKLIF_V14_COL_COUNT = 12;

type RowStyleTpl = {
  height?: number;
  styles: Record<number, Partial<ExcelJS.Style>>;
};

export type PopulateTeklifV14ExcelOpts = {
  kurMode: "static" | "webservice";
  kurFormulaUrl?: string;
  siteOrigin: string;
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

function fillHeader(
  ws: ExcelJS.Worksheet,
  model: TeklifModelV14,
  opts: PopulateTeklifV14ExcelOpts,
) {
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
  if (opts.kurMode === "webservice" && opts.kurFormulaUrl) {
    kurCell.value = {
      formula: `WEBSERVICE("${opts.kurFormulaUrl}")`,
      result: kur,
    };
  } else {
    kurCell.value = kur;
  }
  kurCell.numFmt = '"₺"#,##0.00';
}

function writeDataRow(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  satir: TeklifV14Satir,
) {
  ws.getCell(rowNum, 1).value = satir.bolumNo;
  ws.getCell(rowNum, 2).value = satir.poz;
  ws.getCell(rowNum, 3).value = satir.stokNo;
  ws.getCell(rowNum, 3).alignment = { horizontal: "left", vertical: "top" };
  ws.getCell(rowNum, 4).value = satir.tanim;
  ws.getCell(rowNum, 5).value = kwHucreExcelValue(satir.elkKw);
  ws.getCell(rowNum, 5).numFmt = KW_HUCRE_EXCEL_NUMFMT;
  ws.getCell(rowNum, 6).value = kwHucreExcelValue(satir.gazKw);
  ws.getCell(rowNum, 6).numFmt = KW_HUCRE_EXCEL_NUMFMT;
  ws.getCell(rowNum, 7).value = satir.adet;

  if (satir.originalDoviz === "TRY" && satir.originalFiyat && satir.originalFiyat > 0) {
    ws.getCell(rowNum, 8).value = {
      formula: `ROUND(${satir.originalFiyat}/J$3,0)`,
      result: Math.round(satir.birimSatis ?? 0),
    };
  } else {
    ws.getCell(rowNum, 8).value = Math.round(satir.birimSatis ?? 0);
  }
  ws.getCell(rowNum, 8).numFmt = "#,##0";

  ws.getCell(rowNum, 9).value = {
    formula: `ROUND(G${rowNum}*H${rowNum},0)`,
  };
  ws.getCell(rowNum, 9).numFmt = "#,##0";
  ws.getCell(rowNum, 10).value = satir.marka;
  ws.getCell(rowNum, 10).alignment = { horizontal: "center", vertical: "top" };
  ws.getCell(rowNum, 11).value = satir.olcu || "—";
  ws.getCell(rowNum, 11).alignment = { horizontal: "center", vertical: "top" };
  ws.getCell(rowNum, 12).value = satir.doviz;
}

function resolveImageUrl(url: string, siteOrigin: string): string {
  const u = url.trim();
  if (!u) return "";
  const viaPublic = publicAssetUrl(u.startsWith("/") || /^https?:\/\//i.test(u) ? u : `/${u}`);
  if (/^https?:\/\//i.test(viaPublic)) return viaPublic;
  const path = viaPublic.startsWith("/") ? viaPublic : `/${viaPublic}`;
  try {
    return new URL(path, siteOrigin).href;
  } catch {
    return `${siteOrigin.replace(/\/$/, "")}${path}`;
  }
}

async function fetchImageBuffer(
  url: string,
  siteOrigin: string,
): Promise<{ buffer: ArrayBuffer; extension: "png" | "jpeg" | "gif" } | null> {
  try {
    const abs = resolveImageUrl(url, siteOrigin);
    if (!abs) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(abs, {
      cache: "force-cache",
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
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
  siteOrigin: string,
) {
  applyRowStyle(ws, rowNum, specTpl);
  try {
    ws.mergeCells(`A${rowNum}:B${rowNum}`);
    ws.mergeCells(`E${rowNum}:L${rowNum}`);
  } catch {
    /* merged */
  }

  const img = satir.fotoUrl ? await fetchImageBuffer(satir.fotoUrl, siteOrigin) : null;
  if (img) {
    const imageId = wb.addImage({
      buffer: img.buffer,
      extension: img.extension,
    });
    ws.addImage(imageId, {
      tl: { col: 2.08, row: rowNum - 1 + 0.15 },
      ext: { width: 110, height: 90 },
    });
    ws.getCell(rowNum, 3).value = "";
  } else {
    ws.getCell(rowNum, 3).value = satir.fotoNot ?? "📷\nFotoğraf";
    ws.getCell(rowNum, 3).alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    } as ExcelJS.Alignment;
  }

  ws.getCell(rowNum, 5).value = satir.aciklama ?? "";
  ws.getCell(rowNum, 5).alignment = {
    horizontal: "left",
    vertical: "top",
    wrapText: true,
  };
  ws.getRow(rowNum).height = 120;
}

function applyBolumRowFill(
  ws: ExcelJS.Worksheet,
  rowNum: number,
  colCount = TEKLIF_V14_COL_COUNT,
) {
  for (let col = 1; col <= colCount; col++) {
    const cell = ws.getCell(rowNum, col);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: TEKLIF_BOLUM_ROW_FILL_ARGB },
    };
  }
}

function mergeRanges(ws: ExcelJS.Worksheet): string[] {
  const model = (ws as unknown as { model?: { merges?: string[] } }).model;
  return [...(model?.merges ?? [])];
}

function rowFromA1(addr: string): number {
  const m = /[A-Z]+(\d+)/i.exec(addr.trim());
  return m ? Number(m[1]) : 0;
}

/** Şablon artıklarının (çift toplam / sütunlara yayılmış şartlar) silinmesi */
function clearRowsFrom(ws: ExcelJS.Worksheet, startRow: number) {
  const last = ws.rowCount;
  if (last < startRow) return;
  for (const range of mergeRanges(ws)) {
    const parts = String(range).split(":");
    if (parts.length !== 2) continue;
    const r1 = rowFromA1(parts[0]);
    const r2 = rowFromA1(parts[1]);
    if (Math.max(r1, r2) >= startRow) {
      try {
        ws.unMergeCells(range);
      } catch {
        /* */
      }
    }
  }
  try {
    ws.spliceRows(startRow, last - startRow + 1);
  } catch {
    for (let r = last; r >= startRow; r--) {
      try {
        ws.spliceRows(r, 1);
      } catch {
        /* */
      }
    }
  }
}

function writeSartlarBlock(ws: ExcelJS.Worksheet, startRow: number, lines: string[]) {
  let rowNum = startRow;
  ws.insertRow(rowNum, []);
  rowNum++;

  for (const line of uniqueTeklifV14Sartlar(lines)) {
    ws.insertRow(rowNum, []);
    try {
      ws.mergeCells(`A${rowNum}:L${rowNum}`);
    } catch {
      /* merged */
    }
    const isTitle = line.trim().toLocaleUpperCase("tr") === "ŞARTLARIMIZ";
    const cell = ws.getCell(rowNum, 1);
    cell.value = line;
    cell.font = {
      name: "Arial",
      size: isTitle ? 10 : 9,
      bold: isTitle,
    };
    cell.alignment = {
      horizontal: "left",
      vertical: "middle",
      wrapText: true,
    };
    ws.getRow(rowNum).height = isTitle ? 18 : 16;
    rowNum++;
  }
}

async function buildProductBlock(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  model: TeklifModelV14,
  siteOrigin: string,
): Promise<number> {
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
      ws.mergeCells(`A${rowNum}:L${rowNum}`);
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
      sumRefs.push(`I${dr}`);
      elkParts.push(`E${dr}*G${dr}`);
      gazParts.push(`F${dr}*G${dr}`);
      adetRefs.push(`G${dr}`);
      rowNum++;

      ws.insertRow(rowNum, []);
      await writeSpecRow(wb, ws, rowNum, satir, specTpl, siteOrigin);
      rowNum++;
    }
  }

  const sumFormula = sumRefs.length ? sumRefs.join("+") : "0";
  const elkSum = elkParts.length ? elkParts.join("+") : "0";
  const gazSum = gazParts.length ? gazParts.join("+") : "0";
  const adetSum = adetRefs.length ? `SUM(${adetRefs.join(",")})` : "0";

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, kwTpl);
  ws.getCell(rowNum, 4).value = "Gazlı cihaz toplam bağlantısı (kW)";
  if (gazParts.length) {
    ws.getCell(rowNum, 6).value = { formula: gazSum };
    ws.getCell(rowNum, 6).numFmt = KW_HUCRE_EXCEL_NUMFMT;
  }
  rowNum++;

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, subTpl);
  ws.getCell(rowNum, 4).value = "";
  if (elkParts.length) {
    ws.getCell(rowNum, 5).value = { formula: elkSum };
    ws.getCell(rowNum, 5).numFmt = KW_HUCRE_EXCEL_NUMFMT;
  }
  if (gazParts.length) {
    ws.getCell(rowNum, 6).value = { formula: gazSum };
    ws.getCell(rowNum, 6).numFmt = KW_HUCRE_EXCEL_NUMFMT;
  }
  if (adetRefs.length) {
    ws.getCell(rowNum, 7).value = { formula: adetSum };
  }
  rowNum++;

  ws.insertRow(rowNum, []);
  applyRowStyle(ws, rowNum, grandTpl);
  ws.getCell(rowNum, 8).value = "GENEL TOPLAM";
  ws.getCell(rowNum, 8).font = { bold: true };
  ws.getCell(rowNum, 9).value = { formula: sumFormula };
  ws.getCell(rowNum, 9).numFmt = "#,##0";
  ws.getCell(rowNum, 12).value = dovizSembol(model.ozet.doviz);
  return rowNum;
}

/** Şablonu doldurur: doğru sütunlar, görseller, tek ŞARTLARIMIZ */
export async function populateTeklifV14Sheet(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  model: TeklifModelV14,
  opts: PopulateTeklifV14ExcelOpts,
): Promise<void> {
  fillHeader(ws, model, opts);
  const lastProductRow = await buildProductBlock(wb, ws, model, opts.siteOrigin);
  clearRowsFrom(ws, lastProductRow + 1);
  writeSartlarBlock(ws, lastProductRow + 1, model.sartlar);
}
