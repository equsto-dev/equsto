import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildHotdogKioskTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("hotdog-kiosk", m2);
  return {
    konsept: "hotdog-kiosk",
    label: "Hotdog Kiosk",
    ornekler: ["Sosisli kiosk", "AVM hot dog", "Sokak hotdog"],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "13",
      baslik: `13. HOTDOG KIOSK · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
