/**
 * S13-388 yerleşim modeli — Türk Restoranı + All Day Dining (150–300 m²).
 * python scripts/build-s13-388-referanslar.py
 */

import s13Data from "@/lib/pfos/data/pfos-s13-388-referanslar.json";
import type { ReferansProfil } from "./referans-types";
import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";

type S13Json = {
  m2Band: { min: number; max: number };
  referanslar: Record<string, ReferansProfil & { konsept: Konsept }>;
};

const data = s13Data as S13Json;

export const S13_388_M2_BAND = data.m2Band;

export function getS13ReferansForKonsept(konsept: Konsept): ReferansProfil | null {
  const prof = data.referanslar[konsept];
  if (!prof) return null;
  const { konsept: _k, ...rest } = prof;
  return rest;
}

export function listS13Referanslar(): Array<
  Pick<ReferansProfil, "id" | "label" | "not" | "referansM2"> & { konsept: Konsept }
> {
  return Object.entries(data.referanslar).map(([konsept, p]) => ({
    id: p.id,
    label: p.label,
    not: p.not,
    referansM2: p.referansM2,
    konsept: konsept as Konsept,
  }));
}

export function pickS13ReferansForM2(
  konsept: Konsept,
  m2: number,
): ReferansProfil | null {
  const prof = getS13ReferansForKonsept(konsept);
  if (!prof) return null;
  if (m2 < S13_388_M2_BAND.min || m2 > S13_388_M2_BAND.max) return null;
  return prof;
}
