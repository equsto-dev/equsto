/**
 * Serbest müşteri Excel'i — ilk satırda başlık (ürün / adet / marka) varsa satır çıkarır.
 * Proforma poz (A1) şartı yok.
 */
import type { Worksheet } from "exceljs";
import type { PfosEkipmanSatir } from "./types";

function cellStr(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v).trim();
  if (typeof v === "object" && v && "result" in v) {
    return cellStr((v as { result: unknown }).result);
  }
  if (typeof v === "object" && v && "text" in v) {
    return cellStr((v as { text: unknown }).text);
  }
  return String(v).trim();
}

function rowCells(row: { values: unknown }): string[] {
  const raw = row.values as unknown[];
  const out: string[] = [];
  for (let i = 1; i < (raw?.length ?? 0); i++) out.push(cellStr(raw[i]));
  return out;
}

function normHead(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

type Cols = {
  ad: number;
  adet?: number;
  marka?: number;
  olcu?: number;
  poz?: number;
};

function detectCols(cells: string[]): Cols | null {
  const idx: Partial<Record<keyof Cols, number>> = {};
  cells.forEach((c, i) => {
    const h = normHead(c);
    if (!h) return;
    if (
      idx.ad == null &&
      /^(urun|urun adi|urun tanimi|tanim|tanimi|aciklama|malzeme|ekipman|kalem|description|item|name)$/.test(
        h,
      )
    ) {
      idx.ad = i;
    } else if (idx.adet == null && /^(adet|miktar|qty|quantity|ad)$/.test(h)) {
      idx.adet = i;
    } else if (idx.marka == null && /^(marka|brand|imalatci)$/.test(h)) {
      idx.marka = i;
    } else if (
      idx.olcu == null &&
      /^(olcu|ebat|boyut|dimension|olculer)$/.test(h)
    ) {
      idx.olcu = i;
    } else if (
      idx.poz == null &&
      /^(poz|p no|pno|kod|sku|stok|sira)$/.test(h)
    ) {
      idx.poz = i;
    }
  });
  if (idx.ad == null) return null;
  return idx as Cols;
}

function parseAdet(raw: string): number {
  const n = parseInt(raw.replace(/[^\d]/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 1;
  if (n > 999) return 1;
  return n;
}

function looksLikeHeader(ad: string): boolean {
  const h = normHead(ad);
  return /^(urun|tanim|aciklama|malzeme|ekipman|toplam)$/.test(h);
}

export function parseHeaderListeWorksheet(ws: Worksheet): PfosEkipmanSatir[] {
  let cols: Cols | null = null;
  const rows: PfosEkipmanSatir[] = [];
  let seq = 0;

  ws.eachRow({ includeEmpty: false }, (row) => {
    const cells = rowCells(row);
    if (!cols) {
      cols = detectCols(cells);
      return;
    }
    const ad = (cells[cols.ad] ?? "").trim();
    if (!ad || ad.length < 3 || looksLikeHeader(ad)) return;
    if (/^toplam\b/i.test(ad)) return;

    seq += 1;
    const pozRaw = cols.poz != null ? (cells[cols.poz] ?? "").trim() : "";
    const adetRaw = cols.adet != null ? (cells[cols.adet] ?? "") : "";
    const marka = cols.marka != null ? (cells[cols.marka] ?? "").trim() : "";
    const olcu = cols.olcu != null ? (cells[cols.olcu] ?? "").trim() : "";

    rows.push({
      bolum: "A",
      bolumAd: "",
      poz: pozRaw || String(seq),
      ad,
      olcu: olcu || "—",
      adet: parseAdet(adetRaw),
      marka: marka || undefined,
    });
  });

  return rows;
}
