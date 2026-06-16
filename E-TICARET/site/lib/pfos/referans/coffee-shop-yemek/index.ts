import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildCoffeeShopYemekTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("coffee-shop-yemek", m2);
  return {
    konsept: "coffee-shop-yemek",
    label: "Coffee Shop + Yemek",
    ornekler: [
      "Coffee Shop Trabzon",
      "Bar + sıcak mutfak",
      "Kahve + yemek servisi",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "013",
      baslik: `013. COFFEE SHOP + YEMEK · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
