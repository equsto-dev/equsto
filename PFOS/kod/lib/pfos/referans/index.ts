import type { ConceptTemplate } from "../core/engine-types";
import { referansKalemlerToTemplateItems } from "./build-template-items";
import {
  COFFEE_SHOP_DEFAULT_REFERANS_ID,
  getCoffeeShopReferans,
} from "./coffee-shop-espressolab";

export function buildCoffeeShopTemplate(
  referansId = COFFEE_SHOP_DEFAULT_REFERANS_ID,
): ConceptTemplate {
  const ref = getCoffeeShopReferans(referansId);
  return {
    konsept: "coffee-shop",
    label: "Coffee Shop",
    ornekler: ["Espressolab", "Gloria Jean's"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "01",
      baslik: `01. COFFEE SHOP · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

export {
  COFFEE_SHOP_DEFAULT_REFERANS_ID,
  COFFEE_SHOP_ESPRESSOLAB_REFERANSLAR,
  getCoffeeShopReferans,
  listCoffeeShopReferanslar,
} from "./coffee-shop-espressolab";
