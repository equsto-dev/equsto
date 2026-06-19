import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  matchShopCatalog,
  productMatchesTipKodu,
} from "../core/shop-catalog-match";
import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";

/** Öztiryakiler yer ızgarası — katalog uzunlukları (mm) */
const CATALOG_LEN_MM = [290, 490, 740, 940, 1180, 1620, 2060] as const;

const DEFAULT_VARIANT = "ALTTAN CIKISLI Q50 PVC";

function norm(s: string): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isYerIzgarasiReferans(isim: string): boolean {
  return /yer\s*izgar/i.test(String(isim ?? ""));
}

/** Referans Excel ölçüsü (cm) → katalog uzunluğu mm */
export function yerIzgarasiCatalogLenMm(olcu: string): number {
  const m = String(olcu ?? "").match(/(\d+(?:[.,]\d+)?)\s*[*xX×]\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return 940;
  const a = Number(m[1].replace(",", "."));
  const b = Number(m[2].replace(",", "."));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 940;
  const lenCm = Math.max(a, b);
  const lenMm = lenCm * 10;
  let best: number = CATALOG_LEN_MM[0];
  let bestDist = Infinity;
  for (const s of CATALOG_LEN_MM) {
    const d = Math.abs(s - lenMm);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}

export function yerIzgarasiTipFromOlcu(olcu: string): string {
  return `yer-izgara-${yerIzgarasiCatalogLenMm(olcu)}`;
}

export function extractOlcuFromNotlar(notlar?: string | null): string {
  const m = String(notlar ?? "").match(/ölçü:\s*(.+)/i);
  return m ? m[1].trim() : "";
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  return katalogRowToEslesmis(row);
}

function scoreYerIzgarasiRow(row: AdminUrunRow, lenMm: number): number {
  const name = norm(row.ad);
  if (!productMatchesTipKodu(row, "yer_izgara")) return -9999;
  let score = 0;
  if (name.includes(norm(DEFAULT_VARIANT))) score += 120;
  const sizeNeedle = `${lenMm}*290`;
  if (name.includes(sizeNeedle)) score += 200;
  else if (name.includes(`${lenMm}*`) || name.includes(` ${lenMm} `)) score += 80;
  if (row.sku?.includes(String(lenMm).slice(0, 3))) score += 40;
  if (row.gorsel_url) score += 10;
  return score;
}

/**
 * Yer ızgarası — referans ölçüsüne göre doğru katalog SKU (fiyat ölçüye göre değişir).
 */
export async function matchYerIzgarasiByOlcu(
  olcu: string,
  notlar: string | null | undefined,
  fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const olcuText = olcu.trim() || extractOlcuFromNotlar(notlar);
  if (!olcuText) {
    return matchShopCatalog("yer_izgara", fiyatStratejisi);
  }

  const lenMm = yerIzgarasiCatalogLenMm(olcuText);
  const rows = (await loadLegacyCatalogRows()).filter(
    (r) => r.fiyat_tl > 0 && r.durum === "aktif",
  );

  const scored = rows
    .map((row) => ({ row, score: scoreYerIzgarasiRow(row, lenMm) }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return rowToEslesmis(scored[0].row);
  }

  return matchShopCatalog(`yer-izgara-${lenMm}`, fiyatStratejisi);
}
