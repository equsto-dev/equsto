import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { matchProductForMotor } from "../core/match-product";
import { matchOzelImalatForSablon } from "../core/catalog-fallback";
import { isOzelImalatMotor } from "../core/ozel-imalat";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Katalog adı referans satırıyla çelişiyorsa fiyat eşlemesi yapma */
export function referansKatalogUyumsuz(
  sablonIsim: string,
  katalogAd: string,
): boolean {
  const s = norm(sablonIsim);
  const k = norm(katalogAd);
  if (!s || !k) return false;
  if (s.includes("karbuz") && k.includes("buz mak") && !k.includes("karbuz")) {
    return true;
  }
  if (s.includes("espresso") && !k.includes("espresso") && !k.includes("kahve mak")) {
    return true;
  }
  return false;
}

/**
 * Kayıtlı referans satırı — yalnızca fiyat/stok; tanım her zaman Excel/JSON adı.
 * pfos_* otomatik tiplerde katalogdan ürün uydurulmaz.
 */
export async function matchProductForReferansKalem(opts: {
  urunTipi: string;
  kategoriKodu: string;
  fiyatStratejisi: FiyatStratejisi;
  isim: string;
  notlar?: string | null;
}): Promise<EslesmisUrun | null> {
  const tip = String(opts.urunTipi ?? "").trim();
  if (!tip || tip.startsWith("pfos_")) return null;

  if (isOzelImalatMotor({ sablonIsim: opts.isim, urunTipi: tip })) {
    return matchOzelImalatForSablon(opts.isim, tip, opts.notlar);
  }

  const matched = await matchProductForMotor(
    tip,
    opts.kategoriKodu,
    opts.fiyatStratejisi,
    opts.isim,
    opts.notlar,
  );
  if (!matched) return null;
  if (referansKatalogUyumsuz(opts.isim, matched.ad)) return null;
  return matched;
}
