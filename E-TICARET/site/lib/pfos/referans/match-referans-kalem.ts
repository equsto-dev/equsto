import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  matchReferansKalem,
  referansKatalogUyumsuz,
  type ReferansMatchInput,
} from "./referans-eslestirme";

export { referansKatalogUyumsuz };

/**
 * Kayıtlı referans satırı — referans-eslestirme politikası.
 * Tanım her zaman Excel/JSON adı; katalog yalnızca doğrulanmış veya sıkı eşleşmede.
 */
export async function matchProductForReferansKalem(
  opts: ReferansMatchInput & { kategoriKodu?: string },
): Promise<EslesmisUrun | null> {
  return matchReferansKalem(opts);
}

export type { ReferansMatchInput };
