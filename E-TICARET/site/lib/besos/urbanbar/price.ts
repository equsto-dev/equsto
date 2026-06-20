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

/** Client-safe — Urban Bar fiyat_tl veya ₺… TL etiketinden toplam TRY */
export function resolveUrbanBarTotalTry(input: {
  fiyat_tl?: number;
  price?: string;
}): number {
  const fiyatTl = Number(input.fiyat_tl);
  if (Number.isFinite(fiyatTl) && fiyatTl > 0) return Math.round(fiyatTl);

  const raw = String(input.price || "");
  const dahil = raw.match(/₺?\s*([\d.,]+)\s*(?:KDV\s*dahil|Incl\.?\s*VAT|\bTL\b)/i);
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
  /** Birim fiyat — ₺X.XXX */
  amount: string;
  /** Her zaman "/ adet" veya "/ each" */
  unitSuffix: string;
  /** Alt satır: kutu toplamı veya tekil için sadece KDV */
  secondaryLine: string;
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
  const vat = "TL";
  const unitFmt = formatUrbanBarTry(unitTl);
  const totalFmt = formatUrbanBarTry(totalTl);
  const unitSuffix = locale === "en" ? "/ each" : "/ adet";

  const secondaryLine =
    packQty > 1
      ? locale === "en"
        ? `Box of ${packQty}: ${totalFmt} · ${vat}`
        : `${packQty}'li kutu: ${totalFmt} · ${vat}`
      : vat;

  return {
    packQty,
    totalTl,
    unitTl,
    amount: unitFmt,
    unitSuffix,
    secondaryLine,
  };
}

export function splitUrbanBarPrice(
  priceLabel: string,
  locale: BesosLocale = "tr",
): { amount: string; vat: string } {
  const raw = String(priceLabel || "").trim();
  if (!raw) return { amount: "", vat: "" };

  const vatTr = /\s*KDV\s*dahil\s*$/i;
  const vatEn = /\s*Incl\.?\s*VAT\s*$/i;
  const vatTl = /\s*TL\s*$/i;

  if (vatTr.test(raw)) {
    return { amount: raw.replace(vatTr, "").trim(), vat: "TL" };
  }
  if (vatEn.test(raw)) {
    return { amount: raw.replace(vatEn, "").trim(), vat: "TL" };
  }
  if (vatTl.test(raw)) {
    return { amount: raw.replace(vatTl, "").trim(), vat: "TL" };
  }
  return { amount: raw, vat: "TL" };
}
