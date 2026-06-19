import type { BesosLocale } from "@/lib/besos/locale";
import { urbanBarPackQtyFromProduct } from "./pack-qty";
import type { BesosUrbanBarProduct } from "./types";

function parseTrAmount(fragment: string): number {
  const n = parseFloat(
    String(fragment || "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** Client-safe — Urban Bar fiyat_tl veya ₺… KDV dahil etiketinden toplam TRY */
export function resolveUrbanBarTotalTry(input: {
  fiyat_tl?: number;
  price?: string;
}): number {
  const fiyatTl = Number(input.fiyat_tl);
  if (Number.isFinite(fiyatTl) && fiyatTl > 0) return Math.round(fiyatTl);

  const raw = String(input.price || "");
  const dahil = raw.match(/₺?\s*([\d.,]+)\s*(?:KDV\s*dahil|Incl\.?\s*VAT)/i);
  if (dahil) {
    const v = parseTrAmount(dahil[1]);
    if (v > 0) return v;
  }

  const digits = raw
    .replace(/[^\d,.\-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = parseFloat(digits);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

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
  const totalTl = resolveUrbanBarTotalTry({
    fiyat_tl: product.fiyat_tl,
    price: product.price,
  });
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
