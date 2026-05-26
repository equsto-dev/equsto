import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSteakhouseTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("steakhouse", m2);
  return {
    konsept: "steakhouse",
    label: "Steakhouse",
    ornekler: ["Nusr-Et tarzı", "Mangal / steak"],
    segmentBasis: "m2",
    seatDensity: 1.8,
    teklifPozModu: "referans",
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
