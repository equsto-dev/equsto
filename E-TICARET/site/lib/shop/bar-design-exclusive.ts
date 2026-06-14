/** Bar Design (Besos / Urban Bar) ürünleri yalnızca /besos altında listelenir. */
export const BAR_DESIGN_SHOP_KAYNAK = "urbanbar-web";
export const BAR_DESIGN_BRAND_ID = "urban-bar";

export function isBarDesignShopProduct(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false;
  const id = String(row.id || "");
  const kaynak = String(row.kaynak || "");
  if (kaynak === BAR_DESIGN_SHOP_KAYNAK) return true;
  if (id.startsWith(`${BAR_DESIGN_BRAND_ID}__`)) return true;
  if (row.besos_section) return true;
  return false;
}
