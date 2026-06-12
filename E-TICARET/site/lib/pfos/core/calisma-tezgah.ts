import { resolveTipKodu } from "./tip-kodu";

/** Yer tezgahları — Pimak imalat (EQUSTO / PIMAK SKU) */
export const CALISMA_TEZGAH_MARKA = "Pimak";

export const CALISMA_TEZGAH_TIP_KODLARI = new Set([
  "calisma_tezgahi",
  "calisma_tezgahi_dolap",
  "cop_tezgahi",
  "tezgah_evyeli",
  "evye_tezgah_dolap",
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

/** Yerden çalışma / evyeli tezgah (set üstü ara tezgah hariç) */
export function isCalismaTezgahiReferansIsim(
  isim: string | null | undefined,
  notlar?: string | null,
): boolean {
  const n = norm(`${isim ?? ""} ${notlar ?? ""}`);
  if (!n) return false;
  if (
    /set\s*ustu|setüstü|set alti|setalti|ara\s*tezgah|bym\s*giris|bym\s*cikis|bulasik.*giris|on\s*yikama|kokteyl\s*istasyon|servis\s*tezgah.*sicak/i.test(
      n,
    )
  ) {
    return false;
  }
  if (/evyeli|evye\s*li|çift\s*evye|cift\s*evye|tek\s*evye|üç\s*evye|uc\s*evye/.test(n)) {
    return true;
  }
  if (
    /(?:giris|giriş|makine\s*giris|makin[aae]\s*giris)\s*tezgah/.test(n) &&
    !/bym|bula[sş]ik\s*yik|on\s*yikama/.test(n)
  ) {
    return true;
  }
  if (/(?:calisma|çalışma|firin|fırın)\s*(?:tezgah|sehpa)/.test(n)) return true;
  if (/tezgah.*(?:taban|dolap|mermer|polietilen|hareketli|cekmeceli)/.test(n)) {
    return true;
  }
  if (/^tezgah,|^tezgah\s+dolapli|calisma\s*tezgahi/i.test(n)) return true;
  return false;
}

export function isCalismaTezgahiTipKodu(tip: string | null | undefined): boolean {
  return CALISMA_TEZGAH_TIP_KODLARI.has(
    resolveTipKodu(String(tip ?? "").trim()),
  );
}

export function isCalismaTezgahiPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  notlar?: string | null;
}): boolean {
  if (isCalismaTezgahiTipKodu(opts.urunTipi)) return true;
  return isCalismaTezgahiReferansIsim(opts.isim, opts.notlar);
}

/** Öztiryakiler set üstü / ara tezgah — yer tezgahı referansına uymaz */
export function isSetUstuAraTezgahKatalog(ad: string, sku?: string | null): boolean {
  const blob = norm(`${ad} ${sku ?? ""}`);
  return (
    /7911\.n1\.|set\s*ustu|setüstü|ara\s*tezgah/.test(blob) ||
    (/600\s*seri|700\s*seri|900\s*seri/.test(blob) &&
      /ara\s*tezgah|set\s*ustu/.test(blob))
  );
}

export function isEqustoTezgahRow(sku: string | null | undefined): boolean {
  return /^EQUSTO\.\d{4,5}\./i.test(String(sku ?? "").trim());
}

/** 120×70 → 12070; 90×70 → 09070 (EQUSTO katalog önek formatı) */
export function equstoTezgahSizePrefix(olcu: string): string | null {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return null;
  const w = Math.round(nums[0]);
  const d = Math.round(nums[1]);
  if (w < 40 || d < 40) return null;
  return `${String(w).padStart(3, "0")}${String(d).padStart(2, "0")}`;
}

/** Referans adından EQUSTO varyant soneki (.08 taban raflı, .51 polietilen …) */
export function inferEqustoTezgahVariantSuffix(isim: string): string {
  const n = norm(isim);
  if (/polietilen/.test(n) && /taban\s*ve\s*ara\s*rafl/.test(n)) return "51";
  if (/polietilen/.test(n) && /taban\s*rafl/.test(n)) return "51";
  if (/mermer/.test(n) && /taban\s*ve\s*ara\s*rafl/.test(n)) return "46";
  if (/mermer/.test(n) && /taban\s*rafl/.test(n)) return "46";
  if (/mermer/.test(n)) return "50";
  if (/çift\s*evyeli|cift\s*evyeli|iki\s*evyeli/.test(n)) return "12";
  if (/üç\s*evyeli|uc\s*evyeli|\b3\s*evye/.test(n)) return "17";
  if (/tek\s*evyeli|\b1\s*evye/.test(n)) return "11";
  if (/hareketli/.test(n) && /taban\s*ve\s*ara\s*rafl/.test(n)) return "15";
  if (/hareketli/.test(n) && /taban\s*rafl/.test(n)) return "70";
  if (/dolap/.test(n) && /cekmeceli|çekmeceli|blok/.test(n)) return "56";
  if (/dolap/.test(n)) return "13";
  if (/taban\s*ve\s*ara\s*rafl/.test(n)) return "04";
  if (/taban\s*rafl/.test(n)) return "08";
  return "00";
}

export function generateEqustoTezgahSku(isim: string, olcu: string): string | null {
  const prefix = equstoTezgahSizePrefix(olcu);
  if (!prefix) return null;
  const suffix = inferEqustoTezgahVariantSuffix(isim);
  return `EQUSTO.${prefix}.${suffix}`;
}

export function isOztiYerTezgahSku(sku: string | null | undefined): boolean {
  return /^7911\.N1\.|^7711\.|^7897\.|^7911\./i.test(String(sku ?? "").trim());
}
