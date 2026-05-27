/**
 * All Day Dining Cafe — THC referans proformaları (200–400 m² bandı).
 * Veri: public/data/pfos-all-day-dining-referanslar.json
 * Yenileme: python scripts/build-all-day-dining-referanslar.py
 */

import referansData from "@/public/data/pfos-all-day-dining-referanslar.json";
import type { ReferansKalem, ReferansProfil } from "../referans-types";

type ReferansJson = {
  defaultReferansId: string;
  m2Band: { min: number; max: number };
  referanslar: ReferansProfil[];
};

const data = referansData as ReferansJson;

export const ALL_DAY_DINING_M2_BAND = data.m2Band;

export const ALL_DAY_DINING_REFERANSLAR: ReferansProfil[] = data.referanslar;

export const ALL_DAY_DINING_DEFAULT_REFERANS_ID = data.defaultReferansId;

export function getAllDayDiningReferans(id: string): ReferansProfil {
  const found = ALL_DAY_DINING_REFERANSLAR.find((r) => r.id === id);
  if (!found) throw new Error(`All day dining referans bulunamadı: ${id}`);
  return found;
}

export function listAllDayDiningReferanslar(): Pick<
  ReferansProfil,
  "id" | "label" | "not" | "referansM2"
>[] {
  return ALL_DAY_DINING_REFERANSLAR.map(
    ({ id, label, not, referansM2 }) => ({
      id,
      label,
      not,
      referansM2,
    }),
  );
}

export type { ReferansKalem };
