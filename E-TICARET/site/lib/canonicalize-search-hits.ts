import { matchCatalogRowByPathSlug } from "@/lib/catalog-product-slug";
import {
  type CatalogSearchHit,
  rowToHitFromRow,
  getCatalogLookupMaps,
} from "@/lib/catalog-search-fallback";

function isCanonicalSlug(slug: string) {
  return slug.includes("__");
}

/** Meilisearch yanıtı — katalogdaki kanonik slug ve url ile hizala. */
export async function canonicalizeSearchHits(
  hits: CatalogSearchHit[],
): Promise<CatalogSearchHit[]> {
  if (!hits.length) return hits;
  if (hits.every((h) => isCanonicalSlug(String(h.slug || "").toLowerCase()))) {
    return hits;
  }
  const maps = await getCatalogLookupMaps();

  return hits.map((hit) => {
    const slug = String(hit.slug || "").toLowerCase();
    let row =
      (hit.id && maps.byMeiliId.get(hit.id)) ||
      (slug && maps.byCatalogSlug.get(slug)) ||
      (slug && maps.byLegacySlug.get(slug)) ||
      undefined;

    if (!row && slug && !isCanonicalSlug(slug)) {
      for (const candidate of maps.rows) {
        if (matchCatalogRowByPathSlug(candidate, slug)) {
          row = candidate;
          break;
        }
      }
    }

    if (!row) return hit;

    const fixed = rowToHitFromRow(row);
    if (!fixed) return hit;

    return {
      ...hit,
      ...fixed,
      id: hit.id || fixed.id,
    };
  });
}
