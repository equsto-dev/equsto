import type { BesosLocale } from "@/lib/besos/locale";

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
