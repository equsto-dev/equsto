import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildPersonelYemekhaneTemplate(
  kisi: number,
): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("personel-yemekhane", kisi);
  return {
    konsept: "personel-yemekhane",
    label: "Personel Yemekhanesi (Catering)",
    ornekler: ["Laguna Thermal personel mutfağı", "200 kişilik yemekhane"],
    segmentBasis: "m2",
    seatDensity: 0,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "058",
      baslik: `058. PERSONEL YEMEKHANESİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

