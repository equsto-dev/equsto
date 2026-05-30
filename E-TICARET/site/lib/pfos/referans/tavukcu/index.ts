import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildTavukcuTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("tavukcu", m2);
  return {
    konsept: "tavukcu",
    label: "Tavukçu",
    ornekler: ["Pilic çevirme", "Fried chicken salonu", "Tavuk restoran"],
    segmentBasis: "m2",
    seatDensity: 1.6,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "17",
      baslik: `17. TAVUKÇU · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
