import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildEkmekKruvasanTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("ekmek-kruvasan", m2);
  return {
    konsept: "ekmek-kruvasan",
    label: "Ekmek + Kruvasan",
    ornekler: [
      "Little Farm imalathane",
      "Ekmek + kruvasan üretim fabrikası",
      "Fırın hattı + soğuk zincir",
    ],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "093",
      baslik: `093. EKMEK + KRUVASAN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
