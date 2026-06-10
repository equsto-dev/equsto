import { foldTr } from "@/lib/search-query";
import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { expandProformaAbbreviations } from "./sanitize-tanim";

function normTanim(tanim: string): string {
  return foldTr(expandProformaAbbreviations(tanim));
}

/** Tanımdan aramada öne çıkarılacak ayırt edici terimler */
export function extractFeatureSearchTerms(tanim: string): string[] {
  const f = normTanim(tanim);
  const terms: string[] = [];
  if (/ara\s*raf|taban\s*(ve\s*)?ara|rafl[iı]|rfli/.test(f)) {
    terms.push("ara raflı", "raflı", "taban raf");
  }
  if (/cekmece/.test(f)) terms.push("çekmeceli");
  if (/evyeli|evye/.test(f)) terms.push("evyeli");
  if (/banket|sicak\s*banket/.test(f)) {
    terms.push("banket", "servis arabası", "tepsi arabası");
  }
  if (/servis\s*arab|tasima\s*arab/.test(f)) {
    terms.push("servis arabası", "taşıma arabası");
  }
  if (/\bgn\s*\d|2\s*\/\s*1\b/.test(f)) terms.push("GN tepsi");
  return [...new Set(terms)];
}

function hitHaystack(hit: CatalogSearchHit): string {
  return foldTr(
    [hit.name, hit.brand, hit.category, hit.dept, hit.specs, hit.sku].join(" "),
  );
}

/** Raf / çekmece zorunluluğu — düz tezgaha ağır ceza */
export function shelfFeatureScore(tanim: string, hit: CatalogSearchHit): number {
  const q = normTanim(tanim);
  const hay = hitHaystack(hit);
  const needsShelf =
    /ara\s*raf|taban\s*(ve\s*)?ara|rafl[iı]|rfli|taban\s*raf/.test(q) ||
    (/cekmece/.test(q) && /tezgah/.test(q));

  if (!needsShelf) return 0;

  const hasShelf = /raf|cekmece|rafli|raflı|taban\s*raf|ara\s*raf/.test(hay);
  if (hasShelf) return 45;

  if (/calisma tezgah|çalışma tezgah|notr tezgah|nötr tezgah|servis tezgah/.test(hay)) {
    return -220;
  }
  return -90;
}

/** Banket / servis arabası — bulaşık makinesine karşı */
export function trolleyFeatureScore(tanim: string, hit: CatalogSearchHit): number {
  const q = normTanim(tanim);
  const hay = hitHaystack(hit);

  const wantsTrolley =
    /banket|servis\s*arab|tasima\s*arab|sicak\s*banket/.test(q) ||
    (/\bgn\b/.test(q) && /arab/.test(q));

  if (!wantsTrolley) return 0;

  if (/bulasik|yikama|giyotin|on\s*yikama|kurutma\s*makin|bardak\s*yik|cop\s*siyirma/.test(hay)) {
    return -320;
  }
  if (/banket|servis\s*arab|tepsi\s*arab|tasima\s*arab|unlu\s*mamul\s*arab|sicak\s*serv/.test(hay)) {
    return 50;
  }
  if (/arab/.test(hay) && /tepsi|gn|servis/.test(hay)) return 35;
  return -30;
}

export function requiresShelvedTezgah(tanim: string): boolean {
  const q = normTanim(tanim);
  return /ara\s*raf|taban\s*(ve\s*)?ara|rafl[iı]|rfli|taban\s*raf/.test(q);
}

export function requiresTrolley(tanim: string): boolean {
  const q = normTanim(tanim);
  return /banket|servis\s*arab|tasima\s*arab|sicak\s*banket/.test(q);
}

export function requiresDishwasher(tanim: string): boolean {
  const q = normTanim(tanim);
  return /bulasik|yikama\s*makin|giyotin|siyirma|bardak\s*yik/.test(q);
}

/** Bulaşık hattı — banket / tezgaha karşı */
export function dishwasherFeatureScore(
  tanim: string,
  hit: CatalogSearchHit,
): number {
  const hay = hitHaystack(hit);
  if (!requiresDishwasher(tanim)) return 0;

  if (/banket|servis\s*arab|tepsi\s*arab/.test(hay) && !/bulasik|yikama|bym/.test(hay)) {
    return -350;
  }
  if (/bulasik|yikama|bym\d|giyotin|siyirma|bardak\s*yik/.test(hay)) return 55;
  return -40;
}
