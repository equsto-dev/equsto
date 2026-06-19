import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildTurkRestoranTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("turk-restoran", m2);
  return {
    konsept: "turk-restoran",
    label: "Türk Restoranı",
    ornekler: [
      "Sütiş Şişhane",
      "Köfteci Ramiz",
      "Türk / esnaf lokanta",
    ],
    segmentBasis: "m2",
    seatDensity: 1.3,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "006",
      baslik: `006. SÜTİŞ ŞİŞHANE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
