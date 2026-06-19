import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKanatciKebapciTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kanatci-kebapci", m2);
  return {
    konsept: "kanatci-kebapci",
    label: "Kanatçı-Kebapçı",
    ornekler: ["Kanat & kebap salonu", "Ocakbaşı kanatçı", "Izgara odaklı kebapçı"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "18",
      baslik: `18. KANATÇI-KEBAPÇI · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
