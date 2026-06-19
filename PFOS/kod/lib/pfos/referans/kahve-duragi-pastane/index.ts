import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKahveDuragiPastaneTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kahve-duragi-pastane", m2);
  return {
    konsept: "kahve-duragi-pastane",
    label: "Kahve Durağı — Pastane & Kahvaltı",
    ornekler: [
      "Kahve Durağı Sultangazi",
      "Pastane + kahvaltı",
      "Hafif sıcak yemek",
    ],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "135",
      baslik: `135. KAHVE DURAĞI SULTANGAZİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
