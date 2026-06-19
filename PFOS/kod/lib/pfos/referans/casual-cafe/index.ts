import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildCasualCafeTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("casual-cafe", m2);
  return {
    konsept: "casual-cafe",
    label: "Casual Cafe",
    ornekler: [
      "Şifa Cafe Beykent",
      "Servis mutfağı & teşhir",
      "Casual cafe · pasta & simit",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "026",
      baslik: `026. CASUAL CAFE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
