import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildResortOtelTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("resort-otel", m2);
  return {
    konsept: "resort-otel",
    label: "Resort Otel",
    ornekler: [
      "Zigana Resort Alaçatı",
      "Boutique resort F&B",
      "Restaurant + personel mutfak",
    ],
    segmentBasis: "m2",
    seatDensity: 0.8,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "159",
      baslik: `159. ZİGANA RESORT · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
