import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildMusSelinozTurkTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("mus-selinoz-turk", m2);
  return {
    konsept: "mus-selinoz-turk",
    label: "Türk Mutfağı — Lokanta",
    ornekler: [
      "Muş Selinöz Mimarlık",
      "Bar + pasta teşhir + tam mutfak",
      "Kiremit Akasya’dan ayrı referans",
    ],
    segmentBasis: "m2",
    seatDensity: 1.6,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "101",
      baslik: `101. MUŞ SELİNÖZ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
