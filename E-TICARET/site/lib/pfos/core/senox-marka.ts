import { resolveTipKodu } from "./tip-kodu";

/** PFOS vakum makinesi — teklif markası Şenox */
export const SENOX_MARKA = "Şenox";

export const SENOX_VAKUM_TIP_KODU = "vakum_makinesi";

/** Şenox fiyat listesi (ekipmanlar.json yüklenene kadar) */
export const SENOX_CATALOG_REL = "fiyat-listeleri/senox/2026-1/catalog.json";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function isSenoxVakumReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(isim);
  return /vakum\s*mak|vakuum\s*mak/.test(n);
}

export function isSenoxVakumTipKodu(tip: string | null | undefined): boolean {
  return resolveTipKodu(String(tip ?? "").trim()) === SENOX_VAKUM_TIP_KODU;
}

export function isSenoxVakumPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isSenoxVakumTipKodu(opts.urunTipi)) return true;
  return isSenoxVakumReferansIsim(opts.isim);
}

export function isSenoxKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return n.includes("senox") || n.includes("şenox");
}
