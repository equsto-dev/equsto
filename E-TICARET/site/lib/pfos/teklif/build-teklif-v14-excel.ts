import type ExcelJS from "exceljs";
import type { TeklifModelV14, TeklifV14Satir } from "./teklif-v14.types";
import { TEKLIF_BOLUM_ROW_FILL_ARGB, uniqueTeklifV14Sartlar } from "./constants";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import {
  formatTarihTr,
  kwHucreExcelValue,
  KW_HUCRE_EXCEL_NUMFMT,
  dovizSembol,
  olcuSutunTemiz,
} from "./format-v14";
import { publicAssetUrl } from "@/lib/public-asset-url";

const DATA_TEMPLATE_ROW = 6;
const SPEC_TEMPLATE_ROW = 7;
const SECTION_TEMPLATE_ROW = 5;
const KW_TOTAL_TEMPLATE_ROW = 12;
const SUBTOTAL_TEMPLATE_ROW = 13;
const GRAND_TEMPLATE_ROW = 14;
const TEKLIF_V14_COL_COUNT = 12;
const FOTO_MAX_W = 150;
const FOTO_MAX_H = 125;

type RowStyleTpl = {
  height?: number;
  styles: Record<number, Partial<ExcelJS.Style>>;
};

type FetchedImage = { buffer: ArrayBuffer; extension: "png" | "jpeg" | "gif" };

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
  const birim = Math.round(satir.birimSatis ?? 0);
  const toplam = Math.round(birim * (satir.adet || 0));
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
      result: birim,
    };
  } else {
    ws.getCell(rowNum, 8).value = birim;
  }
  ws.getCell(rowNum, 8).numFmt = "#,##0";

  ws.getCell(rowNum, 9).value = {
    formula: `ROUND(G${rowNum}*H${rowNum},0)`,
    result: toplam,
  };
  ws.getCell(rowNum, 9).numFmt = "#,##0";
  ws.getCell(rowNum, 10).value = satir.marka;
  ws.getCell(rowNum, 10).alignment = { horizontal: "center", vertical: "top" };
  ws.getCell(rowNum, 11).value = olcuSutunTemiz(satir.olcu);
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

function pngSize(buf: ArrayBuffer): { w: number; h: number } | null {
  if (buf.byteLength < 24) return null;
  const dv = new DataView(buf);
  if (dv.getUint32(0) !== 0x89504e47) return null;
  return { w: dv.getUint32(16), h: dv.getUint32(20) };
}

function jpegSize(buf: ArrayBuffer): { w: number; h: number } | null {
  const u8 = new Uint8Array(buf);
  if (u8.length < 10 || u8[0] !== 0xff || u8[1] !== 0xd8) return null;
  let i = 2;
  while (i < u8.length - 8) {
    if (u8[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = u8[i + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      return { h: (u8[i + 5] << 8) | u8[i + 6], w: (u8[i + 7] << 8) | u8[i + 8] };
    }
    const len = (u8[i + 2] << 8) | u8[i + 3];
    if (len < 2) break;
    i += 2 + len;
  }
  return null;
}

function fitContain(
  nat: { w: number; h: number } | null,
): { width: number; height: number } {
  const w = nat && nat.w > 0 ? nat.w : 4;
  const h = nat && nat.h > 0 ? nat.h : 3;
  const scale = Math.min(FOTO_MAX_W / w, FOTO_MAX_H / h);
  return {
    width: Math.max(24, Math.round(w * scale)),
    height: Math.max(24, Math.round(h * scale)),
  };
}

async function fetchImageBuffer(
  url: string,
  siteOrigin: string,
): Promise<FetchedImage | null> {
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

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return out;
}

async function prefetchImages(
  satirlar: TeklifV14Satir[],
  siteOrigin: string,
): Promise<Map<string, FetchedImage>> {
  const urls = [
    ...new Set(satirlar.map((s) => s.fotoUrl?.trim()).filter((u): u is string => !!u)),
  ];
  const map = new Map<string, FetchedImage>();
  await mapPool(urls, 8, async (url) => {
    const img = await fetchImageBuffer(url, siteOrigin);
    if (img) map.set(url, img);
  });
  return map;
}

function writeSpecRow(
  wb: ExcelJS.Workbook,
  ws: ExcelJS.Worksheet,
  rowNum: number,
  satir: TeklifV14Satir,
  specTpl: RowStyleTpl,
  images: Map<string, FetchedImage>,
) {
  applyRowStyle(ws, rowNum, specTpl);
  try {
    ws.mergeCells(`A${rowNum}:B${rowNum}`);
    ws.mergeCells(`E${rowNum}:L${rowNum}`);
  } catch {
    /* merged */
  }

  const key = satir.fotoUrl?.trim() || "";
  const img = key ? images.get(key) : undefined;
  if (img) {
    const nat =
      img.extension === "png" ? pngSize(img.buffer) : jpegSize(img.buffer);
    const ext = fitContain(nat);
    const imageId = wb.addImage({
      buffer: img.buffer,
      extension: img.extension,
    });
    ws.addImage(imageId, {
      tl: { col: 2.05, row: rowNum - 1 + 0.08 },
      ext,
      editAs: "oneCell",
    });
    ws.getCell(rowNum, 3).value = "";
  } else {
    ws.getCell(rowNum, 3).value = satir.fotoUrl ? "—" : "";
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

function allMergeRanges(ws: ExcelJS.Worksheet): string[] {
  const out = new Set<string>();
  const model = (ws as unknown as { model?: { merges?: string[] } }).model;
  if (Array.isArray(model?.merges)) {
    for (const m of model.merges) out.add(String(m));
  }
  const internal = (ws as unknown as { _merges?: Record<string, unknown> })._merges;
  if (internal && typeof internal === "object") {
    for (const key of Object.keys(internal)) {
      if (key.includes(":")) out.add(key);
    }
  }
  return [...out];
}

function rowFromA1(addr: string): number {
  const m = /[A-Z]+(\d+)/i.exec(addr.trim());
  return m ? Number(m[1]) : 0;
}

/** Satır 5'ten itibaren şablon gövdesini sil — örnek ürün / ikinci toplam kalmasın */
function wipeFromRow(ws: ExcelJS.Worksheet, startRow: number) {
  for (const range of allMergeRanges(ws)) {
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
  const last = ws.rowCount;
  if (last >= startRow) {
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

  wipeFromRow(ws, 5);
  const images = await prefetchImages(model.satirlar, siteOrigin);

  let rowNum = 5;
  const sumRefs: string[] = [];
  const elkParts: string[] = [];
  const gazParts: string[] = [];
  const adetRefs: string[] = [];
  let genel = 0;

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
      genel += Math.round((satir.birimSatis ?? 0) * (satir.adet || 0));
      rowNum++;

      ws.insertRow(rowNum, []);
      writeSpecRow(wb, ws, rowNum, satir, specTpl, images);
      rowNum++;
    }
  }

  if (model.ozet.genelToplam != null && Number.isFinite(model.ozet.genelToplam)) {
    genel = Math.round(model.ozet.genelToplam);
  }

  const sumFormula = sumRefs.length ? sumRefs.join("+") : String(genel);
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
  try {
    ws.mergeCells(`G${rowNum}:H${rowNum}`);
  } catch {
    /* */
  }
  ws.getCell(rowNum, 7).value = "GENEL TOPLAM";
  ws.getCell(rowNum, 7).font = { bold: true, name: "Arial", size: 9 };
  ws.getCell(rowNum, 7).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(rowNum, 9).value =
    sumFormula.length > 8000
      ? genel
      : { formula: sumFormula, result: genel };
  ws.getCell(rowNum, 9).numFmt = "#,##0";
  ws.getCell(rowNum, 9).font = { bold: true };
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
  wipeFromRow(ws, lastProductRow + 1);
  writeSartlarBlock(ws, lastProductRow + 1, model.sartlar);
}
