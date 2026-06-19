import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKahveDuragiTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kahve-duragi", m2);
  return {
    konsept: "kahve-duragi",
    label: "Kahve Durağı",
    ornekler: [
      "Kahve Durağı Konyaaltı (kompakt)",
      "Kahve Durağı Karabük (standart)",
      "Cafe-restaurant · espresso & tatlı",
    ],
    segmentBasis: "m2",
    seatDensity: 1.6,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "105",
      baslik: `105. KAHVE DURAĞI KONYAALTI · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
