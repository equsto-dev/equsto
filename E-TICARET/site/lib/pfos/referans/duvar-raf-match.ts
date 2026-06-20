import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { matchEqustoFiyatListesiDuvarRaf } from "../core/equsto-fiyat-listesi-pfos";
import { DUVAR_RAF_MARKA } from "../core/duvar-raf-marka";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import { isDuvarRafiReferans } from "./duvar-raf-heuristics";

export { isDuvarRafiReferans };

/**
 * Duvar / basket raf — EQUSTO Fiyat Listesi 2026 (EQ.KDUVR*, KBASRAF).
 */
export async function matchDuvarRafiByReferans(
  isim: string,
  olcu: string,
  notlar?: string | null,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
  urunTipi?: string | null,
): Promise<EslesmisUrun | null> {
  if (!isDuvarRafiReferans(isim)) return null;

  const olcuBlob =
    olcu.trim() ||
    extractOlcuFromNotlar(notlar) ||
    String(notlar ?? "").match(/(\d+\s*[*xX×]\s*\d+(?:\s*[*xX×]\s*\d+)?)/)?.[1] ||
    "";

  const matched = await matchEqustoFiyatListesiDuvarRaf(
    isim,
    olcuBlob,
    urunTipi ?? undefined,
  );
  if (matched) {
    const isTavaRafi = String(isim).toLowerCase().includes("tava");
    return {
      ...matched,
      ad: displayIsimFromSablon(isim),
      marka: DUVAR_RAF_MARKA,
      olcu: toOlcuMmDisplay(olcuBlob) ?? matched.olcu,
      fiyat: isTavaRafi ? matched.fiyat * 4 : matched.fiyat,
      fiyatEur: isTavaRafi && matched.fiyatEur ? matched.fiyatEur * 4 : matched.fiyatEur,
    };
  }

  return {
    id: "equsto-duvar-raf-ozel",
    sku: "",
    ad: displayIsimFromSablon(isim),
    marka: DUVAR_RAF_MARKA,
    model: null,
    olcu: toOlcuMmDisplay(olcuBlob) ?? (olcuBlob || null),
    elektrikGucuKw: null,
    gazGucuKw: null,
    fiyat: 0,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: null,
  };
}
