/**
 * Müşteri / tedarikçi proforma Excel — Equsto şablonu dışı listeler (Claude'sız).
 * Birden fazla tablo düzeni denenir; en çok geçerli kalem üreten sonuç seçilir.
 */

import type { Worksheet } from "exceljs";
import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";

const POZ_RE = /^[A-Z]\s*\d{1,3}A?$/i;
const NUM_POZ_RE = /^\d{1,3}$/;
const BOLUM_HARF_RE = /^[A-Z]$/i;
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
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim();
  if (v instanceof Date) return v.toISOString().trim();

  if (typeof v === "object") {
    if ("result" in v && v.result != null) {
      return cellStr(v.result);
    }
    if ("formula" in v && v.formula != null) {
      return String(v.formula).trim();
    }
    if ("text" in v && v.text != null) {
      return cellStr(v.text);
    }
    if ("richText" in v && Array.isArray((v as any).richText)) {
      return (v as any).richText
        .map((rt: any) =>
          rt && typeof rt === "object" && "text" in rt
            ? cellStr(rt.text)
            : cellStr(rt)
        )
        .join("");
    }
  }

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
  const poz = normalizePoz(cells[pozIdx]);
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

function normalizePoz(poz: string): string {
  return poz.replace(/\s+/g, "").toUpperCase();
}

type ColumnarHeader = {
  poz: number;
  tanim: number;
  adet: number;
  stok: number;
  boy: number;
  en: number;
  yuk: number;
};

function findColumnarHeader(cells: string[]): ColumnarHeader | null {
  const lower = cells.map((c) => c.toLowerCase());
  const pozIdx = lower.findIndex(
    (c) =>
      c === "poz" ||
      c === "p.no" ||
      c === "pno" ||
      c === "p.no." ||
      c === "poz no" ||
      c === "poz no.",
  );
  const tanimIdx = lower.findIndex(
    (c) =>
      c.includes("tanım") ||
      c.includes("tanim") ||
      c === "açıklama" ||
      c.includes("malzeme cinsi") ||
      c.includes("malzeme"),
  );
  if (pozIdx < 0 || tanimIdx < 0) return null;
  return {
    poz: pozIdx,
    tanim: tanimIdx,
    adet: lower.findIndex((c) => c === "adet"),
    stok: lower.findIndex((c) => c.includes("stok") || c.includes("kaynak")),
    boy: lower.findIndex((c) => c === "boy" || c === "derinlik"),
    en: lower.findIndex((c) => c === "en" || c === "genişlik" || c === "genislik"),
    yuk: lower.findIndex((c) => c.includes("yük") || c.includes("yuk")),
  };
}

/**
 * Boyut sütunlu proforma: Poz | Tanım | Boy | En | Yük | Adet
 */
export function parseColumnarProformaWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let header: ColumnarHeader | null = null;

  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    if (!header) {
      header = findColumnarHeader(cells);
      return;
    }

    const pozRaw = cells[header.poz]?.trim();
    if (!pozRaw || !/^[A-Za-z]/.test(pozRaw)) return;
    if (/^poz$/i.test(pozRaw)) return;

    const poz = normalizePoz(pozRaw);
    const ad = repairPfosDisplayText(cells[header.tanim] || "");
    if (!ad) return;

    let adet = 1;
    if (header.adet >= 0) {
      const raw = cells[header.adet];
      const n =
        typeof raw === "number"
          ? Math.round(raw)
          : parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) adet = n;
    }

    const dims = [header.en, header.boy, header.yuk]
      .filter((idx) => idx >= 0)
      .map((idx) => {
        const v = cells[idx];
        if (v == null || v === "") return "";
        return String(v).trim();
      })
      .filter(Boolean);
    const olcu = dims.length ? dims.join("*") : "—";

    const stok = header.stok >= 0 ? cells[header.stok]?.trim() : "";
    const fullAd = stok ? `${ad} (${stok})` : ad;

    rows.push({
      bolum: poz.charAt(0),
      bolumAd: BOLUM_BY_POZ[poz.charAt(0)] || "",
      poz,
      ad: fullAd,
      olcu,
      adet,
    });
  });

  return rows;
}

type TabularHeader = {
  no: number;
  poz: number;
  malzeme: number;
  aciklama: number;
  olcu: number;
  adet: number;
};

function normHeaderCell(c: string): string {
  return c
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .trim();
}

function findTabularHeader(cells: string[]): TabularHeader | null {
  const lower = cells.map(normHeaderCell);
  const malzemeIdx = lower.findIndex(
    (c) => c.includes("malzeme cinsi") || c.includes("malzeme"),
  );
  const aciklamaIdx = lower.findIndex(
    (c) => c.includes("aciklama") && !c.includes("malzeme"),
  );
  const pozIdx = lower.findIndex((c) => c.includes("poz"));
  const noIdx = lower.findIndex((c) => c === "no" || c === "sira" || c === "s.no");
  const tanimIdx =
    malzemeIdx >= 0
      ? malzemeIdx
      : lower.findIndex(
          (c) =>
            c.includes("tanim") ||
            c === "aciklama" ||
            c.includes("ekipman") ||
            c.includes("cinsi"),
        );

  if (tanimIdx < 0) return null;
  if (pozIdx < 0 && noIdx < 0) return null;

  return {
    no: noIdx,
    poz: pozIdx,
    malzeme: tanimIdx,
    aciklama: aciklamaIdx,
    olcu: lower.findIndex(
      (c) => c.includes("olcu") || c.includes("olçü") || c.includes("kapasite"),
    ),
    adet: lower.findIndex(
      (c) => c === "ad" || c === "ad." || c === "adet" || c === "miktar",
    ),
  };
}

function resolveTabularPoz(
  pozRaw: string,
  noRaw: string,
  bolum: string,
): string | null {
  const poz = normalizePoz(pozRaw);
  if (poz && POZ_RE.test(poz)) return poz;
  const no = noRaw.replace(/\D/g, "");
  if (NUM_POZ_RE.test(no)) {
    const harf = bolum.trim().toUpperCase().charAt(0);
    return harf && BOLUM_HARF_RE.test(harf) ? `${harf}${no}` : no;
  }
  if (NUM_POZ_RE.test(poz.replace(/\D/g, ""))) {
    const n = poz.replace(/\D/g, "");
    const harf = bolum.trim().toUpperCase().charAt(0);
    return harf && BOLUM_HARF_RE.test(harf) ? `${harf}${n}` : n;
  }
  return null;
}

/**
 * Sütun başlıklı proforma tablosu (yaygın mühendislik listeleri):
 * No | Poz | Malzeme/Tanım | Açıklama | Ölçü | Adet — sayısal ve harfli poz birlikte.
 */
export function parseTabularProformaWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  const rows: PfosEkipmanSatir[] = [];
  let header: TabularHeader | null = null;
  let bolum = "";
  let bolumAd = "";

  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row);
    if (!cells.some(Boolean)) return;

    if (!header) {
      header = findTabularHeader(cells);
      return;
    }

    const malzeme = repairPfosDisplayText(cells[header.malzeme] || "");
    const aciklama =
      header.aciklama >= 0
        ? repairPfosDisplayText(cells[header.aciklama] || "")
        : "";
    const pozRaw = header.poz >= 0 ? cells[header.poz]?.trim() ?? "" : "";
    const noRaw = header.no >= 0 ? cells[header.no]?.trim() ?? "" : "";

    if (!malzeme && !aciklama) return;
    if (/^toplam|proforma|fatura|mutabakat/i.test(malzeme)) return;

    const adBase = malzeme || aciklama;
    if (
      BOLUM_HARF_RE.test(pozRaw) &&
      adBase.length > 4 &&
      !NUM_POZ_RE.test(noRaw.replace(/\D/g, ""))
    ) {
      bolum = pozRaw.toUpperCase();
      bolumAd = adBase;
      return;
    }

    if (
      !pozRaw &&
      !noRaw &&
      adBase.length > 8 &&
      !OLCU_RE.test(adBase) &&
      !/^\d+$/.test(adBase)
    ) {
      bolumAd = adBase;
      const harf = adBase.match(/\b([A-Z])\s*[-–]/i)?.[1];
      if (harf) bolum = harf.toUpperCase();
      return;
    }

    const poz = resolveTabularPoz(pozRaw, noRaw, bolum);
    if (!poz) return;

    let ad = malzeme;
    if (aciklama && aciklama !== malzeme) {
      ad = malzeme ? `${malzeme} — ${aciklama}` : aciklama;
    }
    ad = repairPfosDisplayText(ad);
    if (!ad) return;

    let olcu = "—";
    if (header.olcu >= 0) {
      const raw = cells[header.olcu]?.trim();
      if (raw) olcu = OLCU_RE.test(raw) ? (raw.match(OLCU_RE)?.[0] ?? raw) : raw;
    }
    if (olcu === "—") {
      const split = extractOlcu(ad);
      if (split.olcu) {
        olcu = split.olcu;
        ad = split.ad;
      }
    }

    let adet = 1;
    if (header.adet >= 0) {
      const raw = cells[header.adet];
      const n =
        typeof raw === "number"
          ? Math.round(raw)
          : parseInt(String(raw ?? "").replace(/[^\d]/g, ""), 10);
      if (Number.isFinite(n) && n > 0) adet = n;
    }

    const harf = poz.charAt(0).toUpperCase();
    rows.push({
      bolum: bolum || (BOLUM_HARF_RE.test(harf) ? harf : ""),
      bolumAd: bolumAd || BOLUM_BY_POZ[harf] || "",
      poz,
      ad,
      olcu,
      adet,
    });
  });

  return rows;
}

/** Tüm proforma ayrıştırıcıları — en çok satırı veren seçilir */
export function pickBestProformaRows(
  ws: Worksheet,
  extra: Array<(w: Worksheet) => PfosEkipmanSatir[]> = [],
): PfosEkipmanSatir[] {
  const parsers = [
    parseTabularProformaWorksheet,
    parseColumnarProformaWorksheet,
    parseProformaExcelWorksheet,
    ...extra,
  ];
  let best: PfosEkipmanSatir[] = [];
  for (const parse of parsers) {
    const rows = parse(ws);
    if (rows.length > best.length) best = rows;
  }
  return best;
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
