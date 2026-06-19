import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildItalyanTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("italyan", m2);
  return {
    konsept: "italyan",
    label: "İtalyan Restoran",
    ornekler: ["Trattoria", "Osteria", "İtalyan fine casual"],
    segmentBasis: "m2",
    seatDensity: 1.6,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "03",
      baslik: `03. İTALYAN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
