import type { AdminUrunApiRow } from "@/lib/pro-admin-client";

export type UrunQuickFilter =
  | "all"
  | "eksik"
  | "eksik-fiyat"
  | "eksik-sku"
  | "eksik-gorsel"
  | "pasif"
  | "db";

export function isDbEditable(row: AdminUrunApiRow): boolean {
  return !row.readonly && !row.id.startsWith("ecom_");
}

export function urunIssues(row: AdminUrunApiRow): string[] {
  const issues: string[] = [];
  if (!row.sku?.trim()) issues.push("SKU");
  if (!row.fiyat_tl || row.fiyat_tl <= 0) issues.push("Fiyat");
  if (!row.gorsel_url?.trim()) issues.push("Görsel");
  if (!row.marka_id) issues.push("Marka");
  return issues;
}

export function matchesUrunQuickFilter(
  row: AdminUrunApiRow,
  filter: UrunQuickFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "eksik":
      return urunIssues(row).length > 0;
    case "eksik-fiyat":
      return !row.fiyat_tl || row.fiyat_tl <= 0;
    case "eksik-sku":
      return !row.sku?.trim();
    case "eksik-gorsel":
      return !row.gorsel_url?.trim();
    case "pasif":
      return row.durum === "pasif";
    case "db":
      return isDbEditable(row);
    default:
      return true;
  }
}

export type UrunHealthStats = {
  total: number;
  eksik: number;
  eksikFiyat: number;
  eksikSku: number;
  pasif: number;
  dbEditable: number;
};

export function computeUrunHealthStats(rows: AdminUrunApiRow[]): UrunHealthStats {
  let eksik = 0;
  let eksikFiyat = 0;
  let eksikSku = 0;
  let pasif = 0;
  let dbEditable = 0;
  for (const row of rows) {
    if (urunIssues(row).length > 0) eksik++;
    if (!row.fiyat_tl || row.fiyat_tl <= 0) eksikFiyat++;
    if (!row.sku?.trim()) eksikSku++;
    if (row.durum === "pasif") pasif++;
    if (isDbEditable(row)) dbEditable++;
  }
  return {
    total: rows.length,
    eksik,
    eksikFiyat,
    eksikSku,
    pasif,
    dbEditable,
  };
}

export type BulkUrunRow = {
  ad: string;
  sku?: string;
  marka_id: string;
  kategori: string;
  fiyat_tl: number;
  durum?: "aktif" | "pasif";
};

/** Basit CSV: ad,sku,marka_id,kategori,fiyat_tl,durum */
export function parseBulkUrunCsv(text: string): {
  rows: BulkUrunRow[];
  errors: string[];
} {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { rows: [], errors: ["Dosya boş"] };

  const errors: string[] = [];
  const rows: BulkUrunRow[] = [];
  let start = 0;
  const first = lines[0].toLowerCase();
  if (first.includes("ad") && first.includes("marka")) start = 1;

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 4) {
      errors.push(`Satır ${i + 1}: en az 4 sütun gerekli`);
      continue;
    }

    let ad: string;
    let sku: string | undefined;
    let marka_id: string;
    let kategori: string;
    let fiyatRaw: string;
    let durumRaw: string | undefined;

    if (parts.length >= 5) {
      [ad, sku, marka_id, kategori, fiyatRaw, durumRaw] = parts;
    } else {
      [ad, marka_id, kategori, fiyatRaw, durumRaw] = parts;
      sku = undefined;
    }

    const fiyat_tl = Number(fiyatRaw);
    if (!ad?.trim()) {
      errors.push(`Satır ${i + 1}: ad zorunlu`);
      continue;
    }
    if (!marka_id?.trim() || !kategori?.trim()) {
      errors.push(`Satır ${i + 1}: marka_id ve kategori zorunlu`);
      continue;
    }
    rows.push({
      ad: ad.trim(),
      sku: sku?.trim() || undefined,
      marka_id: marka_id.trim(),
      kategori: kategori.trim(),
      fiyat_tl: Number.isFinite(fiyat_tl) ? fiyat_tl : 0,
      durum: durumRaw === "pasif" ? "pasif" : "aktif",
    });
  }
  return { rows, errors };
}
