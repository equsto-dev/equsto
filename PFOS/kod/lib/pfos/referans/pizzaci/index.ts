import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPizzaciReferansTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("pizzaci", m2);
  return {
    konsept: "pizzaci",
    label: "Pizzacı",
    ornekler: ["Avcılar referans", "Mialiento", "Pizza Il Forno"],
    segmentBasis: "m2",
    seatDensity: 1.0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "2025-116",
      baslik: `PİZZACI · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

