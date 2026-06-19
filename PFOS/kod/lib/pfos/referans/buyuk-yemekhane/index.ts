import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildBuyukYemekhaneTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("buyuk-yemekhane", m2);
  return {
    konsept: "buyuk-yemekhane",
    label: "Büyük Yemekhane",
    ornekler: [
      "Yozgat Hastanesi referans",
      "Catering · fabrika · okul yemekhanesi",
      "2000–3500 kişi/gün kapasite",
    ],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "070",
      baslik: `070. BÜYÜK YEMEKHANE · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
