import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPideciTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("pideci", m2);
  return {
    konsept: "pideci",
    label: "Pideci",
    ornekler: ["Lahmacun & pide salonu", "Taş fırın pideci", "Paket servis pide"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "04",
      baslik: `04. PİDECİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
