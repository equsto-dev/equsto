import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildCoffeeShopTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("coffee-shop", m2);
  return {
    konsept: "coffee-shop",
    label: "Coffee Shop",
    ornekler: ["İKİNCİPLAN Kafe", "Espressolab Watergarden", "Espressolab", "Gloria Jean's"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "114",
      baslik: `114. ESPRESSOLAB WATERGARDEN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
