import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import { loadReferansProfil } from "../pfos-referans-loader";

export async function buildTatilOtelTemplate(m2: number): Promise<ConceptTemplate> {
  const ref = await loadReferansProfil("tatil-otel", m2);
  return {
    konsept: "tatil-otel",
    label: "Tatil Oteli",
    ornekler: ["Wyndham (Noyan)", "Tatil oteli F&B", "1000 m² ölçek"],
    segmentBasis: "m2",
    seatDensity: 0.9,
    teklifPozModu: "referans",
    teklifBolum: {
      no: "194",
      baslik: `194. TATİL OTELİ · ${ref.label.toUpperCase()}`,
    },
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

