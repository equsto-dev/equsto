import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKasapTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kasap", m2);
  return {
    konsept: "kasap",
    label: "Kasap",
    ornekler: [
      "Yalnızca kasap hizmeti",
      "Et teşhir & hazırlık",
      "Ortaklar Rota referans",
    ],
    segmentBasis: "m2",
    seatDensity: 0.3,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "087",
      baslik: `087. KASAP · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
