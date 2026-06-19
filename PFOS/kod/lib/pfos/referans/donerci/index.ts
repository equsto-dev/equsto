import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildDonerciTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("donerci", m2);
  return {
    konsept: "donerci",
    label: "Dönerci (Yeni Nesil)",
    ornekler: [
      "Dönerci Celal Usta (Gebze)",
      "Yeni nesil döner & ızgara",
      "Servis + hazırlık + bulaşık",
    ],
    segmentBasis: "m2",
    seatDensity: 1.2,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "112",
      baslik: `112. DÖNERCİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

