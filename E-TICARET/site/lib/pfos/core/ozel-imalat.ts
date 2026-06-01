import type { EslesmisUrun } from "../schemas/pfos.schema";
import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { toOlcuMmDisplay } from "../teklif/olcu-mm";

/** Özel imalat / atölye — katalog markası yok; teklifte Equsto */
export const OZEL_IMALAT_MARKA = "Equsto";
/** Zone/referans TL fiyatına uygulanan Equsto kar (katalog Öztiryakiler ile aynı) */
export const OZEL_IMALAT_KAR_ORAN = 0.08;

/** Referans şablonunda Portashelf etiketi (ürün henüz katalogda yok) */
export function isPortashelfSablon(isim: string | null | undefined): boolean {
  return /portashelf/i.test(String(isim ?? ""));
}

/** Davlumbaz, tezgah, pasta/şarap dolabı vb. özel üretim kalemleri */
const OZEL_IMALAT_AD_KALIP = [
  /\bdavlumbaz\b/i,
  /\btezgah/i,
  /\bpasta\s*dolab/i,
  /\bşarap\s*dolab/i,
  /\bsarap\s*dolab/i,
  /\bduvar\s*raf/i,
  /\bduvar\s*dolab/i,
  /\bkokteyl\s*tezgah/i,
  /\bservis\s*tezgah/i,
  /\bbulaşık\s*alma\s*tezgah/i,
  /\bpolietilen\s*tablal/i,
  /\bmermer\s*tablal/i,
  /\bmayalama\s*dolab/i,
  /\bbanket\s*arabas/i,
  /\bet\s*kütüğ/i,
  /\bçöp\s*kazan/i,
];

export function isOzelImalatSablon(isim: string | null | undefined): boolean {
  const s = String(isim ?? "").trim();
  if (!s) return false;
  if (isPortashelfSablon(s)) return true;
  const n = s.toLocaleLowerCase("tr");
  if (/\(equsto\)/i.test(s)) return true;
  return OZEL_IMALAT_AD_KALIP.some((re) => re.test(n));
}

/** Şablon adı veya urunTipi — katalog SKU yerine Equsto atölye */
export function isOzelImalatMotor(opts: {
  sablonIsim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isOzelImalatSablon(opts.sablonIsim)) return true;
  const tip = String(opts.urunTipi ?? "")
    .toLowerCase()
    .replace(/_/g, "-");
  if (!tip) return false;
  if (/^davlumbaz/.test(tip)) return true;
  if (
    /^(cop-siyirma|bym-cikis|bulasik-cikis|yag-tutucu|bulasik-makinesi-setalt|on-yikama|polietilen-tabla|mermer-tabla|kokteyl-tezgah|servis-tezgah|pasta-dolab|sarap-dolab)/.test(
      tip,
    )
  ) {
    return true;
  }
  return false;
}

/** Tanımdan (PORTASHELF) / (Equsto) kaldır */
export function displayIsimFromSablon(isim: string | null | undefined): string {
  return repairPfosDisplayText(
    String(isim ?? "")
      .replace(/\s*\(\s*PORTASHELF\s*\)\s*/gi, " ")
      .replace(/\s*\(\s*Equsto\s*\)\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

export function buildOzelImalatEslesmis(opts: {
  isim: string;
  urunTipi?: string;
  notlar?: string | null;
  fiyatTry?: number;
  elektrikGucuKw?: number | null;
  gazGucuKw?: number | null;
}): EslesmisUrun {
  const olcuRaw = String(opts.notlar ?? "")
    .replace(/^ölçü:\s*/i, "")
    .trim();
  const olcu = toOlcuMmDisplay(olcuRaw) ?? (olcuRaw || null);
  const tip = opts.urunTipi ?? "ozel-imalat";
  const fiyat = Math.max(0, Math.round(Number(opts.fiyatTry) || 0));

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
