import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKahveAtolyesiTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kahve-atolyesi", m2);
  return {
    konsept: "kahve-atolyesi",
    label: "Kahve Atölyesi",
    ornekler: [
      "Kahve Atölyesi markası",
      "Kahve + kahvaltı & brunch",
      "Espresso bar & hafif yemek",
    ],
    segmentBasis: "m2",
    seatDensity: 1.4,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "046",
      baslik: `046. KAHVE ATÖLYESİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
