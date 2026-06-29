import type { EslesmisUrun } from "../schemas/pfos.schema";
import { z } from "zod";

export const EslesmeKatmaniEnum = z.enum([
  "verified_db",
  "verified_json",
  "tip_shop_link",
  "aile_kurali",
  "katalog_arama",
  "ozel_imalat",
  "eslesmedi",
]);

export type EslesmeKatmani = z.infer<typeof EslesmeKatmaniEnum>;

export type ReferansMatchResult = {
  urun: EslesmisUrun | null;
  eslesmeKatmani: EslesmeKatmani;
  eslesmeLinkKey?: string;
};

export const ESLESMEDI: ReferansMatchResult = {
  urun: null,
  eslesmeKatmani: "eslesmedi",
};

export function referansMatchResult(
  urun: EslesmisUrun | null,
  katman: EslesmeKatmani,
  eslesmeLinkKey?: string,
): ReferansMatchResult {
  if (!urun) return ESLESMEDI;
  return { urun, eslesmeKatmani: katman, eslesmeLinkKey };
}
