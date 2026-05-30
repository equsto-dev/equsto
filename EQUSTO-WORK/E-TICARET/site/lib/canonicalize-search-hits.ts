import { matchCatalogRowByPathSlug } from "@/lib/catalog-product-slug";
import {
  type CatalogSearchHit,
  rowToHitFromRow,
  getCatalogLookupMaps,
} from "@/lib/catalog-search-fallback";

/** Meilisearch yanıtı — katalogdaki kanonik slug, url ve dept ile hizala. */
export async function canonicalizeSearchHits(
  hits: CatalogSearchHit[],
): Promise<CatalogSearchHit[]> {
  if (!hits.length) return hits;
  const maps = await getCatalogLookupMaps();

  return hits.map((hit) => {
    const slug = String(hit.slug || "").toLowerCase();
    const idKey = String(hit.id || "");
    let row =
      (idKey && maps.byMeiliId.get(idKey)) ||
      (slug && maps.byCatalogSlug.get(slug)) ||
      (slug && maps.byLegacySlug.get(slug)) ||
      undefined;

    if (!row && slug) {
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
