import type { BesosLocale } from "./locale";
import { besosUi } from "./ui-strings";
import type { BesosProduct } from "./types";

/** 8221.5 → "8.221,50 €" */
export function formatEurKdvDahil(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "";
  const fixed = (Math.round(amount * 100) / 100).toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${grouped},${dec} €`;
}

export function getBesosPricing(product: BesosProduct | null | undefined) {
  if (!product) return null;
  if (product.pricing?.fiyatEurKdvDahil != null) return product.pricing;
  if (product.fiyatEurKdvDahil != null) {
    return { fiyatEurKdvDahil: product.fiyatEurKdvDahil, currency: "EUR" };
  }
  return null;
}

export function besosPriceLabel(product: BesosProduct, locale: BesosLocale = "tr"): string {
  const p = getBesosPricing(product);
  if (!p) return "";
  const formatted = formatEurKdvDahil(p.fiyatEurKdvDahil);
  return formatted ? `${formatted} ${besosUi("priceVatIncluded", locale)}` : "";
}
