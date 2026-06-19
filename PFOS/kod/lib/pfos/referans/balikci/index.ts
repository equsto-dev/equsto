import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import {
  loadReferansProfil,
  type ReferansListeId,
} from "../pfos-referans-loader";

export async function buildBalikciTemplate(
  m2: number,
  listeId?: ReferansListeId,
  altTip?: string | null,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("balikci", m2, listeId, altTip);
  return {
    konsept: "balikci",
    label: "Balıkçı",
    ornekler: ["Uçan Balık referans", "Balık restoran", "Deniz ürünleri"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
