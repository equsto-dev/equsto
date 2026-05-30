import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSushiTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("sushi", m2);
  return {
    konsept: "sushi",
    label: "Sushi",
    ornekler: ["Sushi bar", "Omakase", "Paket sushi"],
    segmentBasis: "m2",
    seatDensity: 1.8,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "06",
      baslik: `06. SUSHI · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
