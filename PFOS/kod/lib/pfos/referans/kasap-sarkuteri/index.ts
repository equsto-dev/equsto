import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKasapSarkuteriTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kasap-sarkuteri", m2);
  return {
    konsept: "kasap-sarkuteri",
    label: "Kasap + Şarküteri",
    ornekler: [
      "Kasap + şarküteri teşhir",
      "Hazırlık mutfağı",
      "Ortaklar Rota tam liste",
    ],
    segmentBasis: "m2",
    seatDensity: 0.5,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "087",
      baslik: `087. KASAP + ŞARKÜTERİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
