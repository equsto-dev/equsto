import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  CALISMA_TEZGAH_MARKA,
  isCalismaTezgahiReferansIsim,
} from "../core/calisma-tezgah";
import { matchEqustoFiyatListesiTezgah } from "../core/equsto-fiyat-listesi-pfos";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

export function isCalismaTezgahiReferans(isim: string): boolean {
  return isCalismaTezgahiReferansIsim(isim);
}

/**
 * Yerden çalışma tezgahı — EQUSTO Fiyat Listesi 2026 (EQ.* kodları).
 */
export async function matchCalismaTezgahiByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuText =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();

  if (!isCalismaTezgahiReferansIsim(isim, notlar) && !olcuText) {
    return null;
  }

  const matched = await matchEqustoFiyatListesiTezgah(
    isim,
    olcuText,
    urunTipi ?? "calisma_tezgahi",
  );
  if (matched) return matched;

  if (isCalismaTezgahiReferansIsim(isim, notlar)) {
    return {
      id: `equsto-tezgah-ozel-${urunTipi ?? "calisma_tezgahi"}`,
      sku: "",
      ad: isim.trim(),
      marka: CALISMA_TEZGAH_MARKA,
      model: null,
      olcu: olcuText || null,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: 0,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }
  return null;
}
