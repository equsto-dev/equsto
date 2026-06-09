import { repairPfosDisplayText } from "@/lib/utf8/repair-turkish-fffd";
import { isBuzdolabiPfosKalem } from "./portabianco-marka";

/** Özel imalat / atölye — katalog markası yok; teklifte Equsto */
export const OZEL_IMALAT_MARKA = "Equsto";
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
  /\bservis\s*banko/i,
  /\bdekoratif\s*servis\s*banko/i,
  /\bbulaşık\s*alma\s*tezgah/i,
  /\bpolietilen\s*tablal/i,
  /\bmermer\s*tablal/i,
  /\bmayalama\s*dolab/i,
  /\bbanket\s*arabas/i,
  /\bet\s*kütüğ/i,
  /\bçöp\s*kazan/i,
  /\bkasa\s*banko/i,
];

/** Tezgah tipi buzdolabı / soğutma — katalog ürünü; özel imalat değil */
function isSogutmaTezgahSablon(isim: string): boolean {
  const n = isim.toLocaleLowerCase("tr");
  return /buzdolab|donduruc|derin\s*dondur|sogutuc|soğutuc|sogutmali\s*tezgah|soğutmali\s*tezgah|saladette|sishe\s*sogut|şişe\s*soğut|icecek\s*sogut|içecek\s*soğut|bar\s*sogut|hazirlik\s*buzdolab|hazırlık\s*buzdolab|pizza\s*prep/.test(
    n,
  );
}

export function isOzelImalatSablon(isim: string | null | undefined): boolean {
  const s = String(isim ?? "").trim();
  if (!s) return false;
  if (isPortashelfSablon(s)) return true;
  const n = s.toLocaleLowerCase("tr");
  if (isSogutmaTezgahSablon(s)) return false;
  if (/\(equsto\)/i.test(s)) return true;
  return OZEL_IMALAT_AD_KALIP.some((re) => re.test(n));
}

/** Şablon adı veya urunTipi — katalog SKU yerine Equsto atölye */
export function isOzelImalatMotor(opts: {
  sablonIsim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (
    isBuzdolabiPfosKalem({
      isim: opts.sablonIsim,
      urunTipi: opts.urunTipi,
    })
  ) {
    return false;
  }
  const sablon = String(opts.sablonIsim ?? "").trim();
  if (sablon && isSogutmaTezgahSablon(sablon)) return false;
  if (isOzelImalatSablon(opts.sablonIsim)) return true;
  const tip = String(opts.urunTipi ?? "")
    .toLowerCase()
    .replace(/_/g, "-");
  if (!tip) return false;
  if (/^davlumbaz/.test(tip)) return true;
  if (
    /^(cop-siyirma|bym-cikis|bulasik-cikis|yag-tutucu|bulasik-makinesi-setalt|on-yikama|polietilen-tabla|mermer-tabla|kokteyl-tezgah|servis-tezgah|servis-banko|kasa-banko|pasta-dolab|sarap-dolab)/.test(
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

