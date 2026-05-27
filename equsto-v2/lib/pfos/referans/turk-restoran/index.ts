import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import type { ReferansProfil } from "../referans-types";
import {
  getS13ReferansForKonsept,
  pickS13ReferansForM2,
  S13_388_M2_BAND,
} from "../s13-388";

/** S13-388 modeli @ ~220 m² (150–300 bandı) */
export const TURK_RESTORAN_REFERANS_M2 = 220;

const S13_TURK = getS13ReferansForKonsept("turk-restoran");

if (!S13_TURK) {
  throw new Error("S13-388 Türk Restoranı referansı yüklenemedi");
}

export const TURK_RESTORAN_REFERANSLAR: ReferansProfil[] = [S13_TURK];

export const TURK_RESTORAN_DEFAULT_REFERANS_ID = S13_TURK.id;

export {
  S13_388_M2_BAND as TURK_RESTORAN_M2_BAND,
  pickS13ReferansForM2 as pickTurkRestoranReferansForM2,
};

export function getTurkRestoranReferans(id: string): ReferansProfil {
  const found = TURK_RESTORAN_REFERANSLAR.find((r) => r.id === id);
  if (!found) throw new Error(`Türk Restoranı referans bulunamadı: ${id}`);
  return found;
}

export function listTurkRestoranReferanslar(): Pick<
  ReferansProfil,
  "id" | "label" | "not" | "referansM2"
>[] {
  return TURK_RESTORAN_REFERANSLAR.map(
    ({ id, label, not, referansM2 }) => ({
      id,
      label,
      not,
      referansM2,
    }),
  );
}

export function buildTurkRestoranTemplate(
  referansId = TURK_RESTORAN_DEFAULT_REFERANS_ID,
): ConceptTemplate {
  const ref = getTurkRestoranReferans(referansId);
  return {
    konsept: "turk-restoran",
    label: "Türk Restoranı",
    ornekler: ["Sütiş", "Köfteci Ramiz", "Hacı Arif Bey"],
    segmentBasis: "m2",
    seatDensity: 1.3,
    teklifPozModu: "referans",
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}
