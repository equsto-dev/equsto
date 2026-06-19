import type { AdminUrunRow } from "@/lib/legacy-catalog";
import { dimsCmFromOlcu } from "./davlumbaz-marka";
import {
  equstoTezgahSizePrefix,
  inferEqustoTezgahVariantSuffix,
  isEqustoTezgahRow,
} from "./calisma-tezgah";

/**
 * Özel imalat tezgah / davlumbaz — PFOS fiyat politikası
 *
 * Referans ölçüsü sitede (ekipmanlar.json) birebir yoksa:
 * - Aynı varyant/tip içinde Manhattan mesafesi en küçük katalog satırının fiyatı kullanılır.
 * - Tezgah: EQUSTO.{genişlik}{derinlik}.{sonek} — sonek (.04 taban+ara raflı vb.) korunur.
 * - Davlumbaz: duvar/orta + filtre tipi korunur; genişlik×derinlik en yakın satır.
 * - Teklif satırında istenen ölçü ve üretilen EQUSTO kodu değişmez; yalnızca fiyat yakın satırdan gelir.
 * - Eşit mesafede geniş catalog ölçüsü tercih edilir (eksik fiyat riski).
 */

export function parseEqustoSkuDims(
  sku: string | null | undefined,
): { widthCm: number; depthCm: number; suffix: string } | null {
  const eq = String(sku ?? "")
    .trim()
    .match(/^EQ\.[A-Z0-9]+\.(\d{3})(\d{2,3})$/i);
  if (eq) {
    return {
      widthCm: Number(eq[1]),
      depthCm: Number(eq[2]),
      suffix: "",
    };
  }
  const m = String(sku ?? "")
    .trim()
    .match(/^EQUSTO\.(\d{3})(\d{2})\.(\d{2})$/i);
  if (!m) return null;
  return {
    widthCm: Number(m[1]),
    depthCm: Number(m[2]),
    suffix: m[3],
  };
}

export function olcuManhattanDistance(
  target: [number, number],
  catalog: [number, number],
): number {
  return Math.abs(target[0] - catalog[0]) + Math.abs(target[1] - catalog[1]);
}

function pickClosestRow<T extends { sku?: string | null; fiyat_tl?: number }>(
  rows: T[],
  target: [number, number],
): T | null {
  let best: { row: T; dist: number } | null = null;
  for (const row of rows) {
    const dims = parseEqustoSkuDims(row.sku);
    if (!dims || !(row.fiyat_tl && row.fiyat_tl > 0)) continue;
    const dist = olcuManhattanDistance(target, [dims.widthCm, dims.depthCm]);
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist &&
        dims.widthCm >
          (parseEqustoSkuDims(best.row.sku)?.widthCm ?? 0))
    ) {
      best = { row, dist };
    }
  }
  return best?.row ?? null;
}

function pickClosestRowByDims<T extends { sku?: string | null }>(
  rows: T[],
  target: [number, number],
): T | null {
  let best: { row: T; dist: number } | null = null;
  for (const row of rows) {
    const dims = parseEqustoSkuDims(row.sku);
    if (!dims) continue;
    const dist = olcuManhattanDistance(target, [dims.widthCm, dims.depthCm]);
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist &&
        dims.widthCm >
          (parseEqustoSkuDims(best.row.sku)?.widthCm ?? 0))
    ) {
      best = { row, dist };
    }
  }
  return best?.row ?? null;
}

/** Tezgah — aynı varyant soneki, görseli olan en yakın genişlik×derinlik */
export function findClosestEqustoTezgahImageRow(
  rows: AdminUrunRow[],
  isim: string,
  olcu: string,
  generatedSku?: string | null,
): AdminUrunRow | null {
  const target =
    dimsCmFromOlcu(olcu) ??
    (() => {
      const prefix = equstoTezgahSizePrefix(olcu);
      if (!prefix) return null;
      return [Number(prefix.slice(0, 3)), Number(prefix.slice(3, 5))] as [
        number,
        number,
      ];
    })();
  if (!target) return null;

  const suffix =
    parseEqustoSkuDims(generatedSku)?.suffix ??
    inferEqustoTezgahVariantSuffix(isim);

  const pool = rows.filter(
    (r) =>
      r.durum === "aktif" &&
      isEqustoTezgahRow(r.sku, r.ad) &&
      r.gorsel_url &&
      parseEqustoSkuDims(r.sku)?.suffix === suffix,
  );
  return pickClosestRowByDims(pool, target);
}

/** Tezgah — aynı varyant soneki, en yakın genişlik×derinlik fiyatı */
export function findClosestEqustoTezgahPriceRow(
  rows: AdminUrunRow[],
  isim: string,
  olcu: string,
  generatedSku?: string | null,
): AdminUrunRow | null {
  const target =
    dimsCmFromOlcu(olcu) ??
    (() => {
      const prefix = equstoTezgahSizePrefix(olcu);
      if (!prefix) return null;
      return [Number(prefix.slice(0, 3)), Number(prefix.slice(3, 5))] as [
        number,
        number,
      ];
    })();
  if (!target) return null;

  const suffix =
    parseEqustoSkuDims(generatedSku)?.suffix ??
    inferEqustoTezgahVariantSuffix(isim);

  const pool = rows.filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      isEqustoTezgahRow(r.sku, r.ad) &&
      parseEqustoSkuDims(r.sku)?.suffix === suffix,
  );
  return pickClosestRow(pool, target);
}

/** Davlumbaz — tip filtresi dışarıdan; en yakın genişlik×derinlik fiyatı */
export function findClosestEqustoDavlumbazPriceRow(
  rows: AdminUrunRow[],
  target: [number, number] | null,
  filter: (row: AdminUrunRow) => boolean,
): AdminUrunRow | null {
  if (!target) return null;
  const pool = rows.filter(
    (r) => r.durum === "aktif" && r.fiyat_tl > 0 && filter(r),
  );
  return pickClosestRow(pool, target);
}
