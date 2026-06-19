import { foldTr } from "@/lib/search-query";

/** Pimak PDF gömülü görsel — PIMAK tezgah SKU soneki */
const SUFFIX_GORSEL: Record<string, string> = {
  "00": "p188-prod00.jpeg",
  "08": "p188-prod01.jpeg",
  "04": "p188-prod02.jpeg",
  "13": "p189-prod00.jpeg",
  "56": "p189-prod00.jpeg",
  "52": "p190-prod03.jpeg",
  "15": "p190-prod01.jpeg",
  "70": "p190-prod01.jpeg",
  "50": "p191-prod00.jpeg",
  "46": "p191-prod00.jpeg",
  "31": "p192-prod01.jpeg",
  "51": "p192-prod00.jpeg",
  "25": "p192-prod02.png",
};

function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/** Çift / tek evyeli — sayfa 194 görselleri */
function evyeliGorselFile(suffix: string, tanim?: string | null): string | null {
  const q = foldTr(tanim ?? "");
  if (suffix === "12") {
    if (/taban\s*(ve\s*)?ara\s*rafl|taban\s*rafl/.test(q)) {
      return "p194-prod03.jpeg";
    }
    return "p194-prod01.jpeg";
  }
  if (suffix === "11" || suffix === "17") {
    if (/taban\s*rafl/.test(q)) return "p193-prod03.jpeg";
    return "p193-prod01.jpeg";
  }
  return null;
}

function pimakImageSlug(mid: string, suffix: string): string {
  return `pimak-${mid}-${suffix}`.toLowerCase();
}

/**
 * PIMAK.WWDDD.SS → `images/catalog/pimak/pimak-wwddd-ss/pXXX.jpeg`
 * Eski `images/catalog/equsto/equsto-*` yolları geriye dönük alias olarak üretilir.
 */
export function equstoPimakGorselRelFromSku(
  sku: string | null | undefined,
  tanim?: string | null,
): string | null {
  const k = normSku(sku);
  const m = /^(?:EQUSTO|PIMAK)\.(\d{4,5})\.(\d{2})$/i.exec(k);
  if (!m) return null;

  const slug = pimakImageSlug(m[1], m[2]);
  const suffix = m[2] ?? "";
  const file = evyeliGorselFile(suffix, tanim) ?? SUFFIX_GORSEL[suffix] ?? null;
  if (!file) return null;

  return `images/catalog/pimak/${slug}/${file}`;
}

/** @deprecated equsto-pimak-gorsel — geriye dönük import adı */
export const pimakTezgahGorselRelFromSku = equstoPimakGorselRelFromSku;

export function isEqustoOrPimakTezgahSku(sku: string | null | undefined): boolean {
  return /^(?:EQUSTO|PIMAK)\.\d{4,5}\.\d{2}$/i.test(normSku(sku));
}
