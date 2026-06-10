/**
 * SKTÜRK / proforma Excel — Equsto şablonu dışı listeler (Claude'sız).
 */

import type { Worksheet } from "exceljs";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

const POZ_RE = /^[A-Z]\d{1,3}A?$/i;
const OLCU_RE =
  /\d{2,}(?:[.,]\d+)?(?:\*\d{2,}(?:[.,]\d+)?){1,2}(?:\/\d{2,})?/;

const BOLUM_BY_POZ: Record<string, string> = {
  K: "kuru depo",
  C: "panel tip soğuk oda",
  F: "panel tip derin dondurucu oda",
  A: "sıcak mutfak",
  D: "bulaşık yıkama",
};

function cellStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function rowCells(row: { values: unknown }): string[] {
  const raw = row.values as unknown[];
  const out: string[] = [];
  for (let i = 1; i < raw.length; i++) {
    out.push(cellStr(raw[i]));
  }
  return out;
}

function parseAdet(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function findPozIndex(cells: string[]): number {
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i].trim().toUpperCase();
    if (POZ_RE.test(c)) return i;
  }
  return -1;
}

function extractOlcu(text: string): { ad: string; olcu: string } {
  const m = text.match(OLCU_RE);
  if (!m || m.index == null) return { ad: text.trim(), olcu: "" };
  const olcu = m[0];
  const ad = (text.slice(0, m.index) + text.slice(m.index + olcu.length))
    .replace(/[,\s]+$/, "")
    .trim();
  return { ad: ad || text.trim(), olcu };
}

function parseRowFromPoz(
  cells: string[],
  pozIdx: number,
  bolum: string,
  bolumAd: string,
): PfosEkipmanSatir | null {
  const poz = cells[pozIdx].trim().toUpperCase();
  const rest = cells.slice(pozIdx + 1).filter(Boolean);
  if (!rest.length) return null;

  let tanim = rest.join(" ").trim();
  let olcu = "";
  let adet = 1;

  const olcuCell = rest.find((c) => OLCU_RE.test(c));
  if (olcuCell) {
    olcu = olcuCell.match(OLCU_RE)?.[0] ?? olcuCell;
    tanim = rest
      .filter((c) => c !== olcuCell)
      .join(" ")
      .trim();
  } else {
    const split = extractOlcu(tanim);
    tanim = split.ad;
    olcu = split.olcu;
  }

  const last = rest[rest.length - 1];
  if (/^\d+$/.test(last) && last !== olcu.replace(/\D/g, "")) {
    adet = parseAdet(last);
    if (tanim.endsWith(last)) {
      tanim = tanim.slice(0, -last.length).trim();
    }
  }

  tanim = repairPfosDisplayText(tanim);
  if (!tanim) return null;

  return {
    bolum: bolum || poz.charAt(0),
    bolumAd: bolumAd || BOLUM_BY_POZ[poz.charAt(0)] || "",
    poz,
    ad: tanim,
    olcu: olcu || "—",
    adet,
  };
}

/** Proforma Excel — poz sütunu esnek (A1, K2 … herhangi bir sütunda) */
export function parseProformaExcelWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 2) return;
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    const joined = cells.join(" ").toLowerCase();
    if (/^toplam|p\.?no|böl\.?/i.test(cells[0] ?? "")) return;

    const pozIdx = findPozIndex(cells);
    if (pozIdx < 0) {
      const header = cells.filter(Boolean).join(" ");
      if (
        header.length > 4 &&
        !/tanim|açıklama|ölçü|adet|fiyat/i.test(header) &&
        cells.length <= 2
      ) {
        bolumAd = header;
        bolum = header.charAt(0).toUpperCase();
      }
      return;
    }

    const parsed = parseRowFromPoz(cells, pozIdx, bolum, bolumAd);
    if (parsed) rows.push(parsed);
  });

  return rows;
}

/** Claude yedek — sayfa metni (binär xlsx göndermekten ucuz) */
export function worksheetToPlainText(ws: Worksheet, maxChars = 120_000): string {
  const lines: string[] = [];
  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row).filter(Boolean);
    if (cells.length) lines.push(cells.join("\t"));
  });
  return lines.join("\n").slice(0, maxChars);
}
