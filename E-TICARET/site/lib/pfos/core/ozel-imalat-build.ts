import type { EslesmisUrun } from "../schemas/pfos.schema";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";
import { sanitizeDavlumbazOlcu } from "../teklif/davlumbaz-olcu";
import {
  displayIsimFromSablon,
  OZEL_IMALAT_MARKA,
} from "./ozel-imalat";

export function buildOzelImalatEslesmis(opts: {
  isim: string;
  urunTipi?: string;
  notlar?: string | null;
  fiyatTry?: number;
  fiyatEur?: number | null;
  elektrikGucuKw?: number | null;
  gazGucuKw?: number | null;
}): EslesmisUrun {
  const olcuRaw = sanitizeDavlumbazOlcu(
    opts.isim,
    String(opts.notlar ?? "")
      .replace(/^ölçü:\s*/i, "")
      .trim(),
    opts.urunTipi,
  ) ?? String(opts.notlar ?? "")
    .replace(/^ölçü:\s*/i, "")
    .trim();
  const olcu = toOlcuMmDisplay(olcuRaw) ?? (olcuRaw || null);
  const tip = opts.urunTipi ?? "ozel-imalat";
  const fiyat = Math.max(0, Math.round(Number(opts.fiyatTry) || 0));
  const fiyatEurRaw = Number(opts.fiyatEur);
  const fiyatEur =
    Number.isFinite(fiyatEurRaw) && fiyatEurRaw > 0
      ? Math.round(fiyatEurRaw * 100) / 100
      : null;

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
    fiyatEur,
    doviz: "TRY",
    gorselUrl: null,
  };
}
