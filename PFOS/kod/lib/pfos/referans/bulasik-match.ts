import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { katalogRowToEslesmis } from "../core/katalog-row-eslesmis";
import { BULASIK_MARKA } from "../core/bulasik-marka";
import {
  isBulasikReferansIsim,
  isInoksanKatalogMarka,
} from "../core/bulasik-marka";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import {
  parseReferansNitelikleri,
  referansKatalogCeliski,
} from "./referans-nitelikleri";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i");
}

export function isBulasikMakinesiReferans(isim: string): boolean {
  return isBulasikReferansIsim(isim);
}

function rowToEslesmis(row: AdminUrunRow, linkMarka?: string | null): EslesmisUrun {
  return katalogRowToEslesmis(row, { linkMarka });
}

function isInoksanRow(row: AdminUrunRow): boolean {
  const blob = norm(`${row.marka_ad} ${row.ad} ${row.sku ?? ""}`);
  return (
    isInoksanKatalogMarka(row.marka_ad) ||
    blob.includes("inoksan") ||
    blob.includes("ino-bym") ||
    blob.includes("ino-byk")
  );
}

function isBulasikAksesuar(ad: string): boolean {
  const k = norm(ad);
  return (
    /\bbasket\b|\bsepeti\b|\bsepet\b|yükseltici|yukseltici|tabak konveyor/.test(
      k,
    ) && !/tezgahalti\s*bulasik|bulasik\s*yikama\s*mak/.test(k)
  );
}

function isBulasikKatalogAd(ad: string): boolean {
  const k = norm(ad);
  if (isBulasikAksesuar(ad)) return false;
  if (
    /firin|konveksiyon|fritoz|izgara|ocak|kuzine|salamander|merrychef/.test(k) &&
    !/bulasik|bulaşık|yikama\s*mak|dishwash/.test(k)
  ) {
    return false;
  }
  return /bulasik|bulaşık|dishwash|bardak\s*yik|yikama\s*mak|tezgahalti|by[mfk]\d|konveyor/.test(
    k,
  );
}

function scoreBulasikRow(
  ad: string,
  form: ReturnType<typeof parseReferansNitelikleri>["bulasikForm"],
): number {
  const k = norm(ad);
  if (!isBulasikKatalogAd(ad)) return -9999;

  if (form === "setalti") {
    if (/kazan|giyotin|konveyor|flight|byk/.test(k)) return -9999;
    if (/tezgahalti|setalti|by[mf]052|500\s*tb/.test(k)) return 200;
    return -9999;
  }
  if (form === "giyotin") {
    if (/giyotin|by[mf]102|1000\s*tb|1080/.test(k)) return 200;
    return -9999;
  }
  if (form === "konveyor") {
    if (/konveyor|konveyör|flight|byk/.test(k)) return 200;
    return -9999;
  }
  if (form === "bardak") {
    if (isBulasikAksesuar(ad)) return -9999;
    if (/bardak|by[mf]042|600-800|bar\.yik/.test(k)) return 200;
    return -9999;
  }
  if (/bulasik\s*yik|bulaşık\s*yik/.test(k) && !/chafing|fiskiye/.test(k)) {
    return 100;
  }
  return -9999;
}

const PREFERRED_INOKSAN_SKU: Partial<
  Record<NonNullable<ReturnType<typeof parseReferansNitelikleri>["bulasikForm"]>, string>
> = {
  giyotin: "INO-BYM102S",
  setalti: "INO-BYM052ST",
  bardak: "INO-BYM042S",
};

/** Bulaşık makinesi — yalnızca İnoksan (setaltı / giyotin / bardak) */
export async function matchBulasikByReferans(
  isim: string,
  notlar: string | null | undefined,
  fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const ref = parseReferansNitelikleri(isim, notlar);
  const form =
    ref.bulasikForm ??
    (/giyotin|1000\s*tb|1080/.test(norm(isim))
      ? "giyotin"
      : /bardak/.test(norm(isim))
        ? "bardak"
        : "setalti");

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      isInoksanRow(r) &&
      !referansKatalogCeliski(isim, r.ad, notlar),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreBulasikRow(row.ad, form),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const preferSku = PREFERRED_INOKSAN_SKU[form];
      if (preferSku) {
        const aHit = norm(a.row.sku ?? "") === norm(preferSku) ? 1 : 0;
        const bHit = norm(b.row.sku ?? "") === norm(preferSku) ? 1 : 0;
        if (bHit !== aHit) return bHit - aHit;
      }
      if (form === "bardak") {
        const prefer = (ad: string) =>
          /by[mf]042|600-800|bardak/.test(norm(ad)) ? 1 : 0;
        const diff = prefer(b.row.ad) - prefer(a.row.ad);
        if (diff) return diff;
      }
      if (fiyatStratejisi === "premium") return b.row.fiyat_tl - a.row.fiyat_tl;
      return a.row.fiyat_tl - b.row.fiyat_tl;
    });

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row, BULASIK_MARKA);
}
