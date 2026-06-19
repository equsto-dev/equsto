import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  DAVLUMBAZ_MARKA,
} from "../core/davlumbaz-marka";
import { displayIsimFromSablon } from "../core/ozel-imalat";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { matchEqustoFiyatListesiDavlumbaz } from "../core/equsto-fiyat-listesi-pfos";
import { extractOlcuFromNotlar } from "./yer-izgara-match";

/** Giyotin BYM üstü — standart duvar tip filtresiz davlumbaz (Equsto KDAVDT01) */
export const GIYOTIN_BM_DAVLUMBAZ_OLCU = "100*100*50";

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
      .trim() ||
    defaultGiyotinDavlumbazOlcu(isim, notlar, urunTipi);
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
    let ozelFiyat = 0;
    try {
      const { loadLegacyCatalogRows } = await import("@/lib/legacy-catalog");
      const { findClosestEqustoDavlumbazPriceRow } = await import("../core/ozel-imalat-yakin-olcu");
      const { dimsCmFromOlcu } = await import("../core/davlumbaz-marka");
      const rows = await loadLegacyCatalogRows();
      const targetDims = dimsCmFromOlcu(olcuRaw);
      const isOrta = /orta\s*tip/i.test(`${isim} ${urunTipi ?? ""}`);
      const isFiltreli = !/filtresiz/i.test(`${isim} ${urunTipi ?? ""}`);
      const filter = (row: any) => {
        const sku = String(row.sku ?? "").toUpperCase();
        const isRowOrta = sku.includes("KDAVO");
        const isRowFiltreli = sku.includes("KDAVDTF") || sku.includes("KDAVOTF");
        return isRowOrta === isOrta && isRowFiltreli === isFiltreli;
      };
      const closest = findClosestEqustoDavlumbazPriceRow(rows, targetDims, filter);
      if (closest) {
        ozelFiyat = closest.fiyat_tl;
      }
    } catch (e) {
      console.error("Error in davlumbaz ozel fiyat fallback:", e);
    }

    return {
      id: `equsto-davlumbaz-ozel`,
      sku: "",
      ad: displayIsimFromSablon(isim),
      marka: DAVLUMBAZ_MARKA,
      model: null,
      olcu: olcuDisplay,
      elektrikGucuKw: null,
      gazGucuKw: null,
      fiyat: ozelFiyat,
      fiyatEur: null,
      doviz: "TRY",
      gorselUrl: null,
    };
  }

  return null;
}

function normBlob(...parts: Array<string | null | undefined>): string {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

/** Bulaşıkhane giyotin hattı — ölçü yoksa 100×100 cm duvar tip filtresiz */
function defaultGiyotinDavlumbazOlcu(
  isim: string,
  notlar?: string | null,
  urunTipi?: string | null,
): string {
  const blob = normBlob(isim, notlar, urunTipi);
  if (!/davlumbaz/.test(blob)) return "";
  if (
    /giyotin|bulasikhane|bulaşıkhane|bym\s*10|1000\s*tb|makine\s*giris|makine\s*giriş/.test(
      blob,
    ) ||
    /filtresiz/.test(blob)
  ) {
    return GIYOTIN_BM_DAVLUMBAZ_OLCU;
  }
  return "";
}
