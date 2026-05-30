import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { mergeSearchHitsDiverse } from "@/lib/search-diverse-merge";

export { mergeSearchHitsDiverse };

/** Meilisearch + fallback birleşimi; önce primary, sonra id ile tekilleştirilmiş ekler. */
export function mergeSearchHits(
  primary: CatalogSearchHit[],
  secondary: CatalogSearchHit[],
  limit: number,
): CatalogSearchHit[] {
  const out: CatalogSearchHit[] = [];
  const seen = new Set<string>();

  for (const h of primary) {
    if (!h?.id || seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h);
    if (out.length >= limit) return out;
  }

  for (const h of secondary) {
    if (!h?.id || seen.has(h.id)) continue;
    seen.add(h.id);
    out.push(h);
    if (out.length >= limit) return out;
  }

  return out;
}
