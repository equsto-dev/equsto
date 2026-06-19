import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildInariBarYemekTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("inari-bar-yemek", m2);
  return {
    konsept: "inari-bar-yemek",
    label: "Bar + Yemek",
    ornekler: [
      "Inari Restaurant referans",
      "Bar + mutfak",
      "Kokteyl & yemek menüsü",
    ],
    segmentBasis: "m2",
    seatDensity: 1.6,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "093",
      baslik: `093. INARI · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
