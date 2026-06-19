import type { BesosLocale } from "@/lib/besos/locale";
import { resolveMerchantPriceTry } from "@/lib/google-merchant-feed";
import { urbanBarPackQtyFromProduct } from "./pack-qty";
import type { BesosUrbanBarProduct } from "./types";

export function formatUrbanBarTry(amount: number): string {
  const n = Math.round(amount);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `₺${n.toLocaleString("tr-TR")}`;
}

export type UrbanBarPriceDisplay = {
  packQty: number;
  totalTl: number;
  unitTl: number;
  amount: string;
  unitSuffix?: string;
  vat: string;
  packTotalLine?: string;
};

export function resolveUrbanBarPriceDisplay(
  product: Pick<
    BesosUrbanBarProduct,
    "price" | "fiyat_tl" | "name" | "code" | "features" | "description" | "specifications" | "packQty"
  >,
  locale: BesosLocale = "tr",
): UrbanBarPriceDisplay | null {
  const totalTl =
    typeof product.fiyat_tl === "number" && product.fiyat_tl > 0
      ? product.fiyat_tl
      : resolveMerchantPriceTry({ fiyat_tl: product.fiyat_tl, price: product.price });
  if (!totalTl || totalTl <= 0) return null;

  const packQty = urbanBarPackQtyFromProduct(product);
  const unitTl = Math.round(totalTl / packQty);
  const vat = locale === "en" ? "Incl. VAT" : "KDV dahil";
  const unitFmt = formatUrbanBarTry(unitTl);
  const totalFmt = formatUrbanBarTry(totalTl);

  if (packQty > 1) {
    const packLabel =
      locale === "en"
        ? `Box of ${packQty}: ${totalFmt}`
        : `${packQty}'li kutu: ${totalFmt}`;
    return {
      packQty,
      totalTl,
      unitTl,
      amount: unitFmt,
      unitSuffix: locale === "en" ? "/ each" : "/ adet",
      vat,
      packTotalLine: `${packLabel} · ${vat}`,
    };
  }

  return {
    packQty: 1,
    totalTl,
    unitTl: totalTl,
    amount: totalFmt,
    vat,
  };
}

export function splitUrbanBarPrice(
  priceLabel: string,
  locale: BesosLocale = "tr",
): { amount: string; vat: string } {
  const raw = String(priceLabel || "").trim();
  if (!raw) return { amount: "", vat: "" };

  const vatTr = /\s*KDV dahil\s*$/i;
  const vatEn = /\s*Incl\.?\s*VAT\s*$/i;

  if (vatTr.test(raw)) {
    return {
      amount: raw.replace(vatTr, "").trim(),
      vat: locale === "en" ? "Incl. VAT" : "KDV dahil",
    };
  }
  if (vatEn.test(raw)) {
    return {
      amount: raw.replace(vatEn, "").trim(),
      vat: "Incl. VAT",
    };
  }
  return { amount: raw, vat: locale === "en" ? "Incl. VAT" : "KDV dahil" };
}
