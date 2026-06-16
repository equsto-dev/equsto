import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { DAVLUMBAZ_MARKA } from "../core/davlumbaz-marka";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { matchEqustoFiyatListesiDavlumbaz } from "../core/equsto-fiyat-listesi-pfos";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

export function isDavlumbazReferans(isim: string): boolean {
  return /davlumbaz/i.test(String(isim ?? ""));
}

/**
 * Davlumbaz — EQUSTO Fiyat Listesi 2026 (EQ.KDAV* kodları).
 */
export async function matchDavlumbazByReferans(
  isim: string,
  olcu: string,
  notlar: string | null | undefined,
  urunTipi?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  const olcuRaw =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim();
  const olcuDisplay =
    toOlcuMmDisplay(
      sanitizeDavlumbazOlcu(isim, olcuRaw, urunTipi) ?? olcuRaw,
    ) ?? (olcuRaw || null);

  const matched = await matchEqustoFiyatListesiDavlumbaz(
    isim,
    sanitizeDavlumbazOlcu(isim, olcuRaw, urunTipi) ?? olcuRaw,
    urunTipi ?? undefined,
  );
  if (matched) {
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: DAVLUMBAZ_MARKA,
      olcu: olcuDisplay,
    };
  }

  if (isDavlumbazReferans(isim)) {
    return {
      id: `equsto-davlumbaz-ozel`,
      sku: "",
      ad: displayIsimFromSablon(isim),
      marka: DAVLUMBAZ_MARKA,
      model: null,
      olcu: olcuDisplay,
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
