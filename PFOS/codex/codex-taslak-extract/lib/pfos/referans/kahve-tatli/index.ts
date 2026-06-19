import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildKahveTatliTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("kahve-tatli", m2);
  return {
    konsept: "kahve-tatli",
    label: "Kahve & Tatlı",
    ornekler: [
      "Hacıbozan Çemberlitaş",
      "Kahve + pasta teşhir",
      "Alt kat üretim mutfağı",
    ],
    segmentBasis: "m2",
    seatDensity: 1.4,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "132",
      baslik: `132. HACIBOZAN ÇEMBERLİTAŞ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
