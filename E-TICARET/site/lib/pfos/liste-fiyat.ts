/**
 * Müşteri Excel/PDF listesi → PFOS teklif (birebir aktarım).
 */

export type { ListeFiyatInput } from "./liste-fiyat.types";
export {
  LISTE_KONSEPT,
  LISTE_KONSEPT_LABEL,
} from "./liste-fiyat.types";
export { calculateListeQuotePassthrough } from "./liste-passthrough-quote";

import { calculateListeQuotePassthrough } from "./liste-passthrough-quote";
import type { ListeFiyatInput } from "./liste-fiyat.types";
import type { PFOSResponse } from "./schemas/pfos.schema";

/** Yüklenen listeyi katalog eşlemesi olmadan birebir teklife aktarır. */
export async function calculateListeQuote(
  input: ListeFiyatInput,
): Promise<PFOSResponse> {
  return calculateListeQuotePassthrough(input);
}
