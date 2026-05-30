import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKokteylKahveTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kokteyl-kahve", m2);
  return {
    konsept: "kokteyl-kahve",
    label: "Kokteyl + Kahve",
    ornekler: [
      "No Fish Today",
      "Kokteyl & espresso bar",
      "Mixology + filtre kahve",
    ],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "NFT",
      baslik: `KOKTEYL + KAHVE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
