import type { EslesmisUrun } from "../schemas/pfos.schema";
import { estimateOzelImalatFiyatTry } from "../referans/ozel-imalat-fiyat";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import {
  displayIsimFromSablon,
  OZEL_IMALAT_MARKA,
} from "./ozel-imalat";

export async function buildOzelImalatEslesmis(opts: {
  isim: string;
  urunTipi?: string;
  notlar?: string | null;
  fiyatTry?: number;
  elektrikGucuKw?: number | null;
  gazGucuKw?: number | null;
}): Promise<EslesmisUrun> {
  const olcuRaw = String(opts.notlar ?? "")
    .replace(/^ölçü:\s*/i, "")
    .trim();
  const olcu = toOlcuMmDisplay(olcuRaw) ?? (olcuRaw || null);
  const tip = opts.urunTipi ?? "ozel-imalat";
  let fiyat = Math.max(0, Math.round(Number(opts.fiyatTry) || 0));
  if (!fiyat) {
    fiyat = await estimateOzelImalatFiyatTry(opts.isim, opts.notlar);
  }

  return {
    id: `pfos-ozel-${tip}`,
    sku: "",
    ad: displayIsimFromSablon(opts.isim),
    marka: OZEL_IMALAT_MARKA,
    model: null,
    olcu,
    elektrikGucuKw: opts.elektrikGucuKw ?? null,
    gazGucuKw: opts.gazGucuKw ?? null,
    fiyat,
    fiyatEur: null,
    doviz: "TRY",
    gorselUrl: null,
  };
}
