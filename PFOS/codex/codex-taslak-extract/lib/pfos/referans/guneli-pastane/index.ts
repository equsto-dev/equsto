import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildGuneliPastaneTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("guneli-pastane", m2);
  return {
    konsept: "guneli-pastane",
    label: "Güneli Fırın",
    ornekler: [
      "Güneli Fırın markası",
      "Pastane + yerel satış",
      "Fırın & pastane üretim",
    ],
    segmentBasis: "m2",
    seatDensity: 1.3,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "075",
      baslik: `075. GÜNELİ FIRIN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
