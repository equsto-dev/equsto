import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSarkuteriRestoranTemplate(
  m2: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("sarkuteri-restoran", m2);
  return {
    konsept: "sarkuteri-restoran",
    label: "Şarküteri Restoran",
    ornekler: [
      "Şarküteri restoran",
      "Teşhir + hazırlık mutfağı",
      "Ortaklar Rota referansı",
    ],
    segmentBasis: "m2",
    seatDensity: 0.55,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "087",
      baslik: `087. ŞARKÜTERİ RESTORAN · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
