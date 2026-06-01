import {
  loadLegacyCatalogRows,
  type AdminUrunRow,
} from "@/lib/legacy-catalog";
import { enrichEslesmisFromKatalogRow } from "../core/catalog-enrich";
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
  return /bulasik\s*yik|bulaşık\s*yik|bardak\s*yik|dishwash/i.test(norm(isim));
}

function rowToEslesmis(row: AdminUrunRow): EslesmisUrun {
  const enriched = enrichEslesmisFromKatalogRow(row, {});
  return {
    id: row.id,
    slug: row.id.replace(/^ecom_/, ""),
    sku: row.sku,
    ad: row.ad,
    marka: enriched.marka,
    model: enriched.model,
    olcu: enriched.olcu,
    elektrikGucuKw: row.el_guc,
    gazGucuKw: row.gaz_guc,
    fiyat: row.fiyat_tl,
    doviz: "TRY",
    gorselUrl: row.gorsel_url,
  };
}

function isBulasikKatalogAd(ad: string): boolean {
  const k = norm(ad);
  if (
    /firin|konveksiyon|fritoz|izgara|ocak|kuzine|salamander|merrychef/.test(k) &&
    !/bulasik|bulaşık|yikama\s*mak|dishwash/.test(k)
  ) {
    return false;
  }
  return /bulasik|bulaşık|dishwash|bardak\s*yik|yikama\s*mak|tezgahalti/.test(k);
}

function scoreBulasikRow(
  ad: string,
  form: ReturnType<typeof parseReferansNitelikleri>["bulasikForm"],
): number {
  const k = norm(ad);
  if (!isBulasikKatalogAd(ad)) return -9999;

  if (form === "setalti") {
    if (/kazan|giyotin|konveyor|flight/.test(k)) return -9999;
    if (/tezgahalti|oby\s*50|bulasik.*setalti|setalti.*bulasik/.test(k)) return 200;
    return -9999;
  }
  if (form === "giyotin") {
    if (/giyotin|obm\s*1080/.test(k)) return 200;
    return -9999;
  }
  if (form === "bardak") {
    if (/bardak\s*yik|oby\s*35|oby\s*40/.test(k)) return 200;
    return -9999;
  }
  if (/bulasik\s*yik|bulaşık\s*yik/.test(k) && !/chafing|fiskiye/.test(k)) {
    return 100;
  }
  return -9999;
}

/** Bulaşık makinesi — setaltı / giyotin / bardak ayrımı (11110 SKU karışıklığı önlenir) */
export async function matchBulasikByReferans(
  isim: string,
  notlar: string | null | undefined,
  _fiyatStratejisi: FiyatStratejisi,
): Promise<EslesmisUrun | null> {
  const ref = parseReferansNitelikleri(isim, notlar);
  const form =
    ref.bulasikForm ??
    (/setalti|set alti/.test(norm(isim)) ? "setalti" : "setalti");

  const rows = (await loadLegacyCatalogRows()).filter(
    (r) =>
      r.durum === "aktif" &&
      r.fiyat_tl > 0 &&
      !referansKatalogCeliski(isim, r.ad, notlar),
  );

  const scored = rows
    .map((row) => ({
      row,
      score: scoreBulasikRow(row.ad, form),
    }))
    .filter((x) => x.score >= 100)
    .sort((a, b) => b.score - a.score || a.row.fiyat_tl - b.row.fiyat_tl);

  if (!scored.length) return null;
  return rowToEslesmis(scored[0].row);
}
