/**
 * Müşteri Excel/PDF listesi → PFOS katalog eşlemesi ve sistem fiyatları.
 */

export type { ListeFiyatInput } from "./liste-fiyat.types";
export {
  LISTE_KONSEPT,
  LISTE_KONSEPT_LABEL,
} from "./liste-fiyat.types";
export { calculateListeQuotePassthrough } from "./liste-passthrough-quote";

import { calculateListeQuoteCatalog } from "./liste-catalog-quote";
import type { ListeFiyatInput } from "./liste-fiyat.types";
import type { PFOSResponse } from "./schemas/pfos.schema";

/** Yüklenen listeyi PFOS katalog eşlemesi ile fiyatlandırır (Excel tedarikçi fiyatı kullanılmaz). */
export async function calculateListeQuote(
  input: ListeFiyatInput,
): Promise<PFOSResponse> {
  return calculateListeQuoteCatalog(input);
}
