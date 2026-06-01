import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSehirOtelTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("sehir-otel", m2);
  return {
    konsept: "sehir-otel",
    label: "Şehir Oteli (Business)",
    ornekler: [
      "Hampton By Hilton Bolu",
      "Hilton Kocaeli şehir oteli",
      "DoubleTree Hilton Topkapı (140 oda)",
      "Ana mutfak · büfe · banquet",
    ],
    segmentBasis: "m2",
    seatDensity: 0.8,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "088",
      baslik: `088. ŞEHİR OTELİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
