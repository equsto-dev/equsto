import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPastaneTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("pastane", m2);
  return {
    konsept: "pastane",
    label: "Pastane",
    ornekler: ["Butik pastane", "Fırın & kafe", "Patisserie"],
    segmentBasis: "m2",
    seatDensity: 1.2,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "14",
      baslik: `14. PASTANE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

