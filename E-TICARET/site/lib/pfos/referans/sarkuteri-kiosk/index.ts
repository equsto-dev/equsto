import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSarkuteriKioskTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("sarkuteri-kiosk", m2);
  return {
    konsept: "sarkuteri-kiosk",
    label: "Şarküteri Kiosk",
    ornekler: ["Gurme şarküteri kiosk", "AVM şarküteri", "Paket şarküteri"],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "07",
      baslik: `07. ŞARKÜTERİ KIOSK · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
