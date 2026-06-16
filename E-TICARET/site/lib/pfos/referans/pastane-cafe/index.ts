import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPastaneCafeTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("pastane-cafe", m2);
  return {
    konsept: "pastane-cafe",
    label: "Pastane + Cafe",
    ornekler: [
      "Hacısayid Büyükçekmece",
      "Pastane + cafe oturma",
      "Üretim + teşhir + sıcak mutfak",
    ],
    segmentBasis: "m2",
    seatDensity: 1.4,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "210",
      baslik: `210. PASTANE + CAFE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
