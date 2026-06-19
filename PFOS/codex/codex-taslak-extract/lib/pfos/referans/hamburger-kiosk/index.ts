import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildHamburgerKioskTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("hamburger-kiosk", m2);
  return {
    konsept: "hamburger-kiosk",
    label: "Hamburger Kiosk",
    ornekler: ["QSR burger kiosk", "AVM hamburger", "Drive-thru burger"],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "08",
      baslik: `08. HAMBURGER KIOSK · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
