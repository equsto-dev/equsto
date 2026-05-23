import { resolveProductListTl } from "@/lib/equsto-pricing";
import type { ProductSpecs } from "@/lib/product-specs";
import { getTcmbEurForPricing, type TcmbKurSnapshot } from "@/lib/tcmb-kur";

export type StorefrontPricing = {
  kur: TcmbKurSnapshot;
  listTl: (
    specs: ProductSpecs,
    storedTl?: number | null
  ) => number | null;
};

/** Tek TCMB fetch ile tüm ürün fiyatları aynı kur üzerinden hesaplanır */
export async function loadStorefrontPricing(): Promise<StorefrontPricing> {
  const kur = await getTcmbEurForPricing();
  return {
    kur,
    listTl: (specs, storedTl) => resolveProductListTl(specs, storedTl, kur),
  };
}
