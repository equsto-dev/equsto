import { resolveTipKodu } from "./tip-kodu";

/** PFOS bulaşık yıkama makineleri — teklif markası İnoksan. */
export const BULASIK_MARKA = "Inoksan";

/** tip_kodu — bulaşık makinesi (tezgah/aksesuar hariç) */
export const BULASIK_MAKINESI_TIP_KODLARI = new Set([
  "bulasik_giyotin_1000",
  "bulasik_makinesi_giyotin",
  "bulasik_setalti",
  "bardak_yikama",
  "bulasik_tunel",
  "bulasik_sepet",
]);

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Referans / şablon adı — bulaşık yıkama makinesi (çıkış tezgahı vb. hariç) */
export function isBulasikReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!n) return false;
  if (/cikis\s*tezgah|çıkış\s*tezgah|siyirma|sıyırma|on\s*yikama|kurutma\s*unite|yag\s*tutucu|yağ\s*tutucu|basket\s*raf/.test(n)) {
    return false;
  }
  if (/bulasik\s*yik|bulaşık\s*yik|bardak\s*yik|dishwash/.test(n)) return true;
  if (/(?:bulasik|bulaşık|bardak)/.test(n) && /(?:yikama|yik|makine|makin)/.test(n)) {
    return true;
  }
  return false;
}

export function isBulasikMakinesiTipKodu(tip: string | null | undefined): boolean {
  return BULASIK_MAKINESI_TIP_KODLARI.has(
    resolveTipKodu(String(tip ?? "").trim()),
  );
}

/** PFOS kalemi bulaşık makinesi mi? (tip veya referans adı) */
export function isBulasikPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isBulasikMakinesiTipKodu(opts.urunTipi)) return true;
  return isBulasikReferansIsim(opts.isim);
}

export function isInoksanKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return n.includes("inoksan");
}

export function isBulasikDisMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return (
    n.includes("electrolux") ||
    n.includes("oztiryakiler") ||
    n.includes("ozti") ||
    n.includes("rational") ||
    n.includes("fagor") ||
    n.includes("hobart") ||
    n.includes("winterhalter")
  );
}
