import type { BesosLocale } from "@/lib/besos/locale";
import { resolveUrbanBarPriceDisplay } from "@/lib/besos/urbanbar/price";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

type Props = {
  product: Pick<
    BesosUrbanBarProduct,
    "price" | "fiyat_tl" | "name" | "code" | "features" | "description" | "specifications" | "packQty"
  >;
  locale?: BesosLocale;
  variant?: "plp" | "pdp" | "related";
};

export default function BesosUrbanBarPrice({
  product,
  locale = "tr",
  variant = "plp",
}: Props) {
  const display = resolveUrbanBarPriceDisplay(product, locale);
  if (!display) return null;

  const rootClass =
    variant === "pdp"
      ? "ub-pdp-price"
      : variant === "related"
        ? "ub-pdp-related__price"
        : "ub-plp-card__price";

  const amountClass =
    variant === "pdp"
      ? "ub-pdp-price__amount"
      : variant === "related"
        ? "ub-pdp-related__amount"
        : "ub-plp-card__price-amount";

  const unitClass =
    variant === "pdp"
      ? "ub-pdp-price__unit"
      : variant === "related"
        ? "ub-pdp-related__unit"
        : "ub-plp-card__price-unit";

  const packClass =
    variant === "pdp"
      ? "ub-pdp-price__pack"
      : variant === "related"
        ? "ub-pdp-related__pack"
        : "ub-plp-card__price-pack";

  return (
    <div className={rootClass}>
      <span className={amountClass}>
        {display.amount}
        <span className={unitClass}>{display.unitSuffix}</span>
      </span>
      <span className={packClass}>{display.secondaryLine}</span>
    </div>
  );
}
