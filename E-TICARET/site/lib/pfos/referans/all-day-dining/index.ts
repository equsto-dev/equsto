import type { ConceptTemplate } from "../../core/engine-types";
import { referansKalemlerToTemplateItems } from "../build-template-items";
import type { ReferansProfil } from "../referans-types";
import { getS13ReferansForKonsept, S13_388_M2_BAND } from "../s13-388";
import {
  ALL_DAY_DINING_DEFAULT_REFERANS_ID,
  ALL_DAY_DINING_M2_BAND,
  ALL_DAY_DINING_REFERANSLAR as THC_REFERANSLAR,
  getAllDayDiningReferans,
} from "./thc-referanslar";

/** THC Bakü referans m² (yerleşim planı + proforma) */
export const ALL_DAY_DINING_REFERANS_M2 = 280;

const S13_ALL_DAY = getS13ReferansForKonsept("all-day-dining-cafe");

/** THC (200–400) + S13-388 (150–300) */
export const ALL_DAY_DINING_REFERANSLAR: ReferansProfil[] = [
  ...THC_REFERANSLAR,
  ...(S13_ALL_DAY ? [S13_ALL_DAY] : []),
];

export function listAllDayDiningReferanslar(): Pick<
  ReferansProfil,
  "id" | "label" | "not" | "referansM2"
>[] {
  return ALL_DAY_DINING_REFERANSLAR.map(({ id, label, not, referansM2 }) => ({
    id,
    label,
    not,
    referansM2,
  }));
}

export {
  ALL_DAY_DINING_DEFAULT_REFERANS_ID,
  ALL_DAY_DINING_M2_BAND,
  getAllDayDiningReferans,
};

export function buildAllDayDiningTemplate(
  referansId = ALL_DAY_DINING_DEFAULT_REFERANS_ID,
): ConceptTemplate {
  const ref = getAllDayDiningReferans(referansId);
  return {
    konsept: "all-day-dining-cafe",
    label: "All Day Dining Cafe",
    ornekler: ["The House Café", "Big Chefs", "Happy Moon's"],
    segmentBasis: "m2",
    seatDensity: 1.5,
    teklifPozModu: "referans",
    referansId: ref.id,
    items: referansKalemlerToTemplateItems(ref.kalemler),
  };
}

export function pickAllDayDiningReferansForM2(m2: number): ReferansProfil {
  const candidates = ALL_DAY_DINING_REFERANSLAR.filter((r) => {
    const refM2 = r.referansM2 ?? ALL_DAY_DINING_REFERANS_M2;
    if (r.id.startsWith("s13-388")) {
      return m2 >= S13_388_M2_BAND.min && m2 <= S13_388_M2_BAND.max;
    }
    return m2 >= ALL_DAY_DINING_M2_BAND.min && m2 <= ALL_DAY_DINING_M2_BAND.max;
  });
  if (!candidates.length) {
    return getAllDayDiningReferans(ALL_DAY_DINING_DEFAULT_REFERANS_ID);
  }
  const sorted = [...candidates].sort(
    (a, b) =>
      Math.abs((a.referansM2 ?? ALL_DAY_DINING_REFERANS_M2) - m2) -
      Math.abs((b.referansM2 ?? ALL_DAY_DINING_REFERANS_M2) - m2),
  );
  return sorted[0] ?? getAllDayDiningReferans(ALL_DAY_DINING_DEFAULT_REFERANS_ID);
}
