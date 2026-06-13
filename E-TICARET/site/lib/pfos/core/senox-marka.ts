import { resolveTipKodu } from "./tip-kodu";

/** PFOS vakum makinesi — teklif markası Şenox */
export const SENOX_MARKA = "Şenox";

/** Şenox katalog liste fiyatından Equsto satış iskontosu */
export const SENOX_SATIS_ORAN = 0.5;

export const SENOX_VAKUM_TIP_KODU = "vakum_makinesi";

/** Şenox fiyat listesi (ekipmanlar.json yüklenene kadar) */
export const SENOX_CATALOG_REL = "fiyat-listeleri/senox/2026-1/catalog.json";
/** Mutbex Senox katalog — HT / DM fiyat yedeklemesi */
export const SENOX_MUTBEX_CATALOG_REL =
  "fiyat-listeleri/senox/mutbex/catalog.json";

function norm(s: string | null | undefined): string {
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

/** Dizden kumandalı / mekanizmali el yıkama lavabosu — Şenox DBE serisi */
export function isSenoxElYikamaReferansIsim(
  isim: string | null | undefined,
): boolean {
  const n = norm(isim);
  if (!n) return false;
  if (/bulasik|bulaşık|bardak yik|paspas yik|cop siyir|çöp sıyır/.test(n)) {
    return false;
  }
  return /el yik|el yık|lavabo|dizden kumand|dizden basm|hygiene sink|hand wash/.test(
    n,
  );
}

/** Yapışkanlı / UV sinek öldürücü — Şenox YSO serisi */
export function isSenoxSinekReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(isim);
  if (!n) return false;
  return /sinek|fly kill|yapiskanli sinek|yapışkanlı sinek|insect trap|hasere/.test(
    n,
  );
}

/** Geri toplamalı yer yıkama hortumu — Şenox 118.HT (HT-10/12/15); ön yıkama duşu değil */
export function isSenoxYerYikamaHortumuReferansIsim(
  isim: string | null | undefined,
  notlar?: string | null,
): boolean {
  const n = norm(`${isim ?? ""} ${notlar ?? ""}`);
  if (!n) return false;
  if (/118\.ht|ht-\d{2}\b|ht\d{2}\b/.test(n)) return true;
  if (/yer yikama hortum|yer yıkama hortum|floor wash hose/.test(n)) return true;
  if (/geri toplam|geri top/.test(n) && /on yik|ön yik|du[sş]|hortum|118\.ht|ht-\d|\d+\s*m\b|\d+\s*mt/.test(n)) {
    return true;
  }
  if (/8760\.0ccgt|ccgt\.(06|10|15)/.test(n)) return true;
  return false;
}

/** Ön yıkama duşu = sprey ünitesi (duş sprey / ara musluk); HT hortum hariç */
export function isSenoxOnYikamaDusuReferansIsim(
  isim: string | null | undefined,
  notlar?: string | null,
): boolean {
  const n = norm(`${isim ?? ""} ${notlar ?? ""}`);
  if (!n) return false;
  if (isSenoxYerYikamaHortumuReferansIsim(isim, notlar)) return false;
  if (/bulasik|bulaşık|tezgah.*on yik|on yikama tezgah|on-yikama-tezgah/.test(n)) {
    return false;
  }
  if (/sprey unitesi|sprey ünitesi|du[sş] sprey|dus sprey|pre.?rinse/.test(n)) {
    return true;
  }
  if (/on yikama dus|ön yikama duş|on yikama dusu|ön yikama duşu/.test(n)) {
    return true;
  }
  if (/on yik.*du[sş]|ön yik.*du[sş]/.test(n)) return true;
  if (/ara musluk/.test(n) && /sprey|on yik|ön yik|dus|duş/.test(n)) return true;
  return false;
}

/** Duş sprey ünitesi — on_yikama_dusu ile eşdeğer */
export function isSenoxDusSpreyReferansIsim(
  isim: string | null | undefined,
  notlar?: string | null,
): boolean {
  return isSenoxOnYikamaDusuReferansIsim(isim, notlar);
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

export function isSenoxDilimlemeReferansIsim(
  isim: string | null | undefined,
): boolean {
  const n = norm(isim);
  return /dilimleme\s*mak|gida\s*dilim|gıda\s*dilim|slicing\s*mach|slicer/.test(n);
}

/** Katı meyve sıkacağı / presi — Şenox KM01 / KMP; portakal (citrus) hariç */
export function isSenoxMeyveSikacagiReferansIsim(
  isim: string | null | undefined,
  urunTipi?: string | null,
  notlar?: string | null,
): boolean {
  const rawTip = String(urunTipi ?? "").trim();
  if (/kati-meyve|kati_meyve|meyve-pres|meyve_pres/i.test(rawTip)) {
    return true;
  }
  const n = norm(`${isim ?? ""} ${notlar ?? ""}`);
  if (!n) return false;
  if (/portakal|narenciye|citrus|9860\.00011|santos\s*no\s*11|motorlu portakal/.test(n)) {
    return false;
  }
  return /kati\s*meyve|katı\s*meyve|meyve\s*pres|meyve\s*sikac|meyve\s*sıkac|extractor|santrifuj/.test(
    n,
  );
}

/** Şenox katalog ürünü — vakum, el yıkama, sinek öldürücü vb. */
export function isSenoxPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
}): boolean {
  if (isSenoxVakumPfosKalem(opts)) return true;
  if (isSenoxElYikamaReferansIsim(opts.isim)) return true;
  if (isSenoxSinekReferansIsim(opts.isim)) return true;
  if (isSenoxYerYikamaHortumuReferansIsim(opts.isim, opts.notlar)) return true;
  if (isSenoxOnYikamaDusuReferansIsim(opts.isim, opts.notlar)) return true;
  if (isSenoxDilimlemeReferansIsim(opts.isim) || opts.urunTipi === "dilimleme_makinesi") return true;
  if (
    isSenoxMeyveSikacagiReferansIsim(opts.isim, opts.urunTipi, opts.notlar)
  ) {
    return true;
  }
  return false;
}

export function isSenoxKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(marka);
  return n.includes("senox") || n.includes("şenox");
}
