import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  matchReferansKalem,
  matchReferansKalemWithMeta,
  referansKatalogUyumsuz,
  type ReferansMatchInput,
} from "./referans-eslestirme";
import type { ReferansMatchResult } from "./referans-match-meta";

export { referansKatalogUyumsuz };
export type { ReferansMatchInput, ReferansMatchResult };

/**
 * Kayıtlı referans satırı — referans-eslestirme politikası.
 * Tanım her zaman Excel/JSON adı; katalog yalnızca doğrulanmış veya sıkı eşleşmede.
 */
export async function matchProductForReferansKalem(
  opts: ReferansMatchInput & { kategoriKodu?: string },
): Promise<EslesmisUrun | null> {
  return matchReferansKalem(opts);
}

export async function matchProductForReferansKalemWithMeta(
  opts: ReferansMatchInput & { kategoriKodu?: string },
): Promise<ReferansMatchResult> {
  return matchReferansKalemWithMeta(opts);
}

export type ReferansKalemMatchMeta = {
  eslesmeKatmani: ReferansMatchResult["eslesmeKatmani"];
  eslesmeLinkKey?: string;
  referansListeKey?: string;
};

export function metaFromReferansMatch(
  match: ReferansMatchResult,
  referansListeKey?: string,
): ReferansKalemMatchMeta {
  return {
    eslesmeKatmani: match.eslesmeKatmani,
    eslesmeLinkKey: match.eslesmeLinkKey,
    referansListeKey,
  };
}
