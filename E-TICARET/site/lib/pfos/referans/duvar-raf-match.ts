import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { matchEqustoFiyatListesiDuvarRaf } from "../core/equsto-fiyat-listesi-pfos";
import { DUVAR_RAF_MARKA } from "../core/duvar-raf-marka";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { extractOlcuFromNotlar } from "./yer-izgara-match";
import {
  isDuvarRafiReferans,
  isSalamanderRafiReferans,
} from "./duvar-raf-heuristics";
import { loadLegacyCatalogRows } from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";

export { isDuvarRafiReferans, isSalamanderRafiReferans };

const SALAMANDER_RAF_OLCU = "60*60*4";
const SALAMANDER_RAF_FIYAT_SKU = "7897.10030.30";

/**
 * Salamander rafı — katalogda yok; 60×60×4 duvar rafı, fiyat 100×30×4 (7897.10030.30).
 */
export async function matchSalamanderRafiByReferans(
  isim: string,
  _fiyatStratejisi: FiyatStratejisi = "ekonomik",
): Promise<EslesmisUrun | null> {
  if (!isSalamanderRafiReferans(isim)) return null;

  const rows = await loadLegacyCatalogRows();
  const ref = rows.find(
    (r) =>
      r.durum === "aktif" &&
      String(r.sku ?? "")
        .replace(/\s+/g, "")
        .toUpperCase() === SALAMANDER_RAF_FIYAT_SKU.toUpperCase(),
  );
  if (!ref) return null;

  const priced = katalogRowToEslesmis(ref, {
    linkMarka: "Öztiryakiler",
    sablonIsim: isim,
  });

  return {
    ...priced,
    id: "salamander-rafi-duvar-60",
    sku: "",
    ad: displayIsimFromSablon(isim),
    marka: "Öztiryakiler",
    model: SALAMANDER_RAF_FIYAT_SKU,
    olcu: SALAMANDER_RAF_OLCU,
    teklifAciklama: `Duvar rafı ${SALAMANDER_RAF_OLCU} — fiyat referansı: DUVAR RAFI 100*30 (${SALAMANDER_RAF_FIYAT_SKU})`,
  };
}

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
