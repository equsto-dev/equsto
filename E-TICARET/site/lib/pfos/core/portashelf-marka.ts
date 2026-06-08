import { resolveTipKodu } from "./tip-kodu";

/** PFOS istif rafları — teklif markası Portashelf (Yüksel). */
export const PORTASHELF_MARKA = "Portashelf";

export const PORTASHELF_CATALOG_REL =
  "fiyat-listeleri/yuksel/2025-yerli/istif/portashelf/urunler.json";

export const ISTIF_RAFI_TIP_KODLARI = new Set([
  "istif_rafi",
  "kuru_depo_raf",
]);

export const COP_ARABASI_TIP_KODU = "cop_arabasi";

export const YUKSEL_SATIS_CATALOG_REL =
  "fiyat-listeleri/yuksel/yukselsatis/fiyatlar.json";

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Referans adı — istif raf (malzeme dolabı / buzdolabı rafı hariç) */
export function isIstifRafiReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(isim);
  if (!n) return false;
  if (/buzdolab|sogutuc|donduruc|slim\s*2\s*door|cam\s*kapili\s*dolap/.test(n)) {
    return false;
  }
  if (/istif\s*raf|istif\s*rafi|tel\s*raf|katli\s*raf|kati\s*raf|demonte\s*raf/.test(n)) {
    return true;
  }
  if (/kuru\s*depo\s*raf|depo\s*raf/.test(n)) return true;
  if (/portashelf/.test(n)) return true;
  return false;
}

export function isIstifRafiTipKodu(tip: string | null | undefined): boolean {
  return ISTIF_RAFI_TIP_KODLARI.has(resolveTipKodu(String(tip ?? "").trim()));
}

/** Referans adı — çöp arabası / tekerlekli çöp kovası */
export function isCopArabasiReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(isim);
  if (!n) return false;
  return (
    /cop\s*arab|çöp\s*arab|cop\s*kova|çöp\s*kova|cop\s*servant|çöp\s*servant/.test(
      n,
    ) && !/cop\s*tezgah|çöp\s*tezgah/.test(n)
  );
}

export function isCopArabasiTipKodu(tip: string | null | undefined): boolean {
  return resolveTipKodu(String(tip ?? "").trim()) === COP_ARABASI_TIP_KODU;
}

export function isCopArabasiPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isCopArabasiTipKodu(opts.urunTipi)) return true;
  return isCopArabasiReferansIsim(opts.isim);
}

/** PFOS teklif markası Portashelf — istif raf veya çöp arabası */
export function isPortashelfMarkaKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  return isPortashelfPfosKalem(opts) || isCopArabasiPfosKalem(opts);
}

export function isPortashelfPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isIstifRafiTipKodu(opts.urunTipi)) return true;
  return isIstifRafiReferansIsim(opts.isim);
}

export function isPortashelfKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return (
    n.includes("portashelf") ||
    (n.includes("yuksel") && !n.includes("ozti"))
  );
}

export function isIstifRafiDisMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return (
    n.includes("oztiryakiler") ||
    n.includes("ozti") ||
    n.includes("atalay") ||
    n.includes("electrolux")
  );
}
