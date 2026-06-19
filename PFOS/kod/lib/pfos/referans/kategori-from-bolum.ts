import type { PfosKategoriKodu } from "@/lib/pfos/core/engine-types";

/** Excel bölüm başlığı / ürün adı — karşılaştırma için normalize */
export function normalizeBolumMetin(s: string): string {
  const clean = String(s ?? "").split("\0")[0];
  return clean
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * PFOS A–H: Excel listesindeki bölüm başlığı (bolumAd) öncelikli.
 * Poz kodundaki harfler (A12, D5) veya bolum tek harfi tek başına kullanılmaz.
 */
export function kategoriFromBolumAd(
  bolumAd: string | null | undefined,
): PfosKategoriKodu | null {
  const b = normalizeBolumMetin(bolumAd ?? "");
  if (!b) return null;

  if (
    /mutfak\s*bulasik|servis\s*bulasik|bula[sş]ik\s*(yikama|hane)|yikama\s*odasi/.test(
      b,
    )
  ) {
    return "H";
  }
  if (/servis\s*bar|^bar\b|bar\s*&|kokteyl\s*bar/.test(b)) {
    return "A";
  }
  if (/sicak\s*mutfak|banquet\s*mutfak/.test(b)) {
    return "B";
  }
  if (/pizza\s*(hazirlik|mutfak)?/.test(b)) {
    return "F";
  }
  if (/pastane|patiser|tatli\s*hazirlik/.test(b)) {
    return "D";
  }
  if (/sebze\s*hazirlik|et\s*hazirlik|hazirlik\s*mutfak|^hazirlik$/.test(b)) {
    return "C";
  }
  if (
    /soguk\s*mutfak|soguk\s*oda|soğuk\s*mutfak|salata\s*hazirlik|soguk\s*hazirlik/.test(
      b,
    )
  ) {
    return "E";
  }
  if (
    /depo|depolar|istif|malzeme\s*dolab|kuru\s*depo|garson\s*hol|nakliye/.test(
      b,
    )
  ) {
    return "G";
  }
  if (/servis\s*ofis|ofis\s*mutfak/.test(b)) {
    return "C";
  }
  if (/yer\s*izgara/.test(b)) {
    return "B";
  }

  return null;
}

/** Ürün adı — yalnızca bölümden çıkmayan net ekipman tipleri */
export function kategoriFromUrunAd(
  urunAd: string | null | undefined,
): PfosKategoriKodu | null {
  const u = normalizeBolumMetin(urunAd ?? "");
  if (!u) return null;

  if (
    /bulasik\s*makin|giyotin|bym\s|on\s*yikama|cop\s*siyirma|bardak\s*yik|kurutma\s*makin|yag\s*tutucu|basket\s*rafi/.test(
      u,
    )
  ) {
    return "H";
  }
  if (/espresso|kahve\s*mak|kokteyl\s*tezgah|bar\s*blender|milk\s*frother/.test(u)) {
    return "A";
  }
  if (/istif\s*raf|tel\s*raf/.test(u) && !/bulasik|yikama/.test(u)) {
    return "G";
  }

  return null;
}

export function referansBolumKey(
  bolum: string | null | undefined,
  bolumAd: string | null | undefined,
): string {
  const ad = String(bolumAd ?? "").trim();
  const kod = String(bolum ?? "").trim().toUpperCase();
  return ad ? `${kod}\0${ad}` : kod || "?";
}

export function displayBolumBaslik(
  bolumAd: string | null | undefined,
  bolum?: string | null,
): string {
  const ad = String(bolumAd ?? "").split("\0")[0].trim();
  if (ad) {
    let cleanAd = ad.replace(/\s+/g, " ").trim();
    if (/mutfak\s*depolama/i.test(cleanAd)) {
      return "Mutfak";
    }
    return cleanAd;
  }
  const kod = String(bolum ?? "").trim();
  return kod || "—";
}
