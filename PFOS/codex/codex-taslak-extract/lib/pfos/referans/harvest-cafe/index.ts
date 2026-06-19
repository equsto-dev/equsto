import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildHarvestCafeTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("harvest-cafe", m2);
  return {
    konsept: "harvest-cafe",
    label: "Harvest Cafe",
    ornekler: [
      "Harvest Cafe Bahçeşehir",
      "A la carte menü",
      "Tatlı & kahve ağırlıklı cafe",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "051",
      baslik: `051. HARVEST CAFE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
