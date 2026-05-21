import type { ProductSpecs } from "@/lib/product-specs";
import type { TcmbKurSnapshot } from "@/lib/tcmb-kur";

/** Atalay döner kataloğu — site fiyatı iskontosu */
export const EQUSTO_CATALOG_DISCOUNT = 0.4;

export function catalogEuroToSiteEuro(
  catalogEuro: number,
  discount = EQUSTO_CATALOG_DISCOUNT
): number {
  return Math.round(catalogEuro * (1 - discount) * 100) / 100;
}

export function euroSiteToTryTl(euroSite: number, eurTryRate: number): number {
  return Math.round(euroSite * eurTryRate);
}

export function catalogEuroToTryTl(
  catalogEuro: number,
  eurTryRate: number,
  discount = EQUSTO_CATALOG_DISCOUNT
): number {
  return euroSiteToTryTl(catalogEuro * (1 - discount), eurTryRate);
}

/** Specs’te EUR site fiyatı varsa güncel TCMB kuruyla TL hesaplar */
export function resolveProductListTl(
  specs: ProductSpecs,
  storedTl: number | null | undefined,
  kur: TcmbKurSnapshot
): number | null {
  if (specs.fiyat_euro_site != null && specs.fiyat_euro_site > 0) {
    return euroSiteToTryTl(specs.fiyat_euro_site, kur.rate);
  }
  if (specs.fiyat_euro_katalog != null && specs.fiyat_euro_katalog > 0) {
    const discount = specs.iskonto_oran ?? EQUSTO_CATALOG_DISCOUNT;
    return catalogEuroToTryTl(specs.fiyat_euro_katalog, kur.rate, discount);
  }
  if (storedTl != null && Number(storedTl) > 0) return Number(storedTl);
  return null;
}
