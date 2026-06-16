import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPatisserieYemekTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("patisserie-yemek", m2);
  return {
    konsept: "patisserie-yemek",
    label: "Patisserie + Yemek",
    ornekler: ["HAMOUR Acarkent", "Patisserie & restoran", "Tatlı + sıcak mutfak"],
    segmentBasis: "m2",
    seatDensity: 1.4,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "032",
      baslik: `032. PATİSSERİE + YEMEK · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
