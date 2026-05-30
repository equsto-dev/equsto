import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildBirahaneTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("birahane", m2);
  return {
    konsept: "birahane",
    label: "Birahane",
    ornekler: ["Mikro birahane", "Craft beer pub", "Bira salonu"],
    segmentBasis: "m2",
    seatDensity: 1.4,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "11",
      baslik: `11. BİRAHANE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

