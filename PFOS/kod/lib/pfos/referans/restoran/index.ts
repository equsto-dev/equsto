import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildRestoranTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("restoran", m2);
  return {
    konsept: "restoran",
    label: "Restoran",
    ornekler: [
      "Büyük yemek rezervasyonları",
      "Düğün & özel organizasyon",
      "Eğlence & etkinlik salonu",
      "Banquet / çok salonlu restoran",
    ],
    segmentBasis: "m2",
    seatDensity: 1.2,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "REST",
      baslik: `RESTORAN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
