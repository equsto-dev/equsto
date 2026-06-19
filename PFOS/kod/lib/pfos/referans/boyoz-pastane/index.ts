import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildBoyozPastaneTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("boyoz-pastane", m2);
  return {
    konsept: "boyoz-pastane",
    label: "Pastane Cafe (Boyoz)",
    ornekler: ["Smyrna Boyoz", "İzmir boyoz dükkanı", "Pastane + cafe oturma"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "134",
      baslik: `134. SMYRNA BOYOZ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
