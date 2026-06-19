import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildAllSportCafeTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("all-sport-cafe", m2);
  return {
    konsept: "all-sport-cafe",
    label: "All Sport Cafe",
    ornekler: [
      "All Sport Cafe",
      "All day cafe · gün boyu servis",
      "Kahvaltı–öğle–akşam menü döngüsü",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "064",
      baslik: `064. ALL SPORT CAFE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
