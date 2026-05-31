import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildSehirOtelTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("sehir-otel", m2);
  return {
    konsept: "sehir-otel",
    label: "Şehir Oteli (Business)",
    ornekler: [
      "Hilton Kocaeli referans",
      "Ana mutfak · büfe · banquet",
      "Servis bar · personel mutfağı",
    ],
    segmentBasis: "m2",
    seatDensity: 0.8,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "077",
      baslik: `077. ŞEHİR OTELİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
