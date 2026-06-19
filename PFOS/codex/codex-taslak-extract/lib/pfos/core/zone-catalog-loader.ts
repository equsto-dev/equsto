import { dataPath, readJsonFile } from "@/lib/legacy-data";

export type ZoneCatalogProduct = {
  id: string;
  name: string;
  marka?: string;
  dimensions?: string;
  classification?: string;
  m2_per_unit?: number | null;
  min_qty?: number;
  max_qty?: number;
  tip_kodu: string;
  elk_kw?: number;
  gaz_kw?: number;
  unit_price_try?: number;
  price_source?: string;
};

export type ZoneCatalogBundle = {
  version: number;
  categories: Record<
    string,
    { name: string; share?: number; icon?: string; color?: string }
  >;
  catalog: Record<string, { products: ZoneCatalogProduct[] }>;
};

let cache: ZoneCatalogBundle | null = null;

export async function loadZoneCatalog(): Promise<ZoneCatalogBundle> {
  if (cache) return cache;
  const parsed = await readJsonFile<ZoneCatalogBundle>(
    dataPath("pfos-zone-catalog.json"),
  );
  if (!parsed) {
    throw new Error("pfos-zone-catalog.json yüklenemedi");
  }
  cache = parsed;
  return cache;
}

export function isSingletonM2(m2PerUnit: number | null | undefined): boolean {
  return (
    m2PerUnit == null ||
    !Number.isFinite(Number(m2PerUnit)) ||
    Number(m2PerUnit) <= 0
  );
}

export function qtyForZoneProduct(
  zoneM2: number,
  product: ZoneCatalogProduct,
): number {
  const minQ = product.min_qty != null ? product.min_qty : 1;
  const maxQ =
    product.max_qty != null && Number.isFinite(product.max_qty)
      ? product.max_qty
      : Infinity;
  const clamp = (q: number) => Math.min(maxQ, Math.max(minQ, q));

  if (isSingletonM2(product.m2_per_unit)) {
    return clamp(minQ);
  }
  const raw = zoneM2 / Number(product.m2_per_unit);
  let q = Math.ceil(raw);
  if (!q || q < 1) q = minQ;
  return clamp(q);
}

/** bolumM2 yoksa: toplam m² × kategori payı */
export function zoneM2FromShare(
  totalM2: number,
  zoneKey: string,
  categories: ZoneCatalogBundle["categories"],
): number {
  const share = categories[zoneKey]?.share ?? 0.1;
  return Math.max(0, Math.round(totalM2 * share));
}
