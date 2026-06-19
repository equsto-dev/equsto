import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKiremitAkasyaTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kiremit-akasya", m2);
  return {
    konsept: "kiremit-akasya",
    label: "Kiremit Akasya",
    ornekler: [
      "Türk mutfağı self servis",
      "Food court / AVM",
      "Kiremit Akasya referans",
    ],
    segmentBasis: "m2",
    seatDensity: 1.8,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "085",
      baslik: `085. KİREMİT AKASYA · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
