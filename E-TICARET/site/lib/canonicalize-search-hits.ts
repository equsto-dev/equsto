import { matchCatalogRowByPathSlug } from "@/lib/catalog-product-slug";
import {
  type CatalogSearchHit,
  rowToHitFromRow,
  getCatalogLookupMaps,
} from "@/lib/catalog-search-fallback";
import { formatConsumerPriceTry } from "@/lib/shop/consumer-price";

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

    if (!row) {
      return {
        ...hit,
        price_display:
          hit.price_display ||
          formatConsumerPriceTry({
            fiyat_tl: hit.fiyat_tl,
            price: hit.price,
            fiyat_bekleniyor: hit.fiyat_bekleniyor,
          }),
      };
    }

    const fixed = rowToHitFromRow(row);
    if (!fixed) return hit;

    const fiyatTl =
      fixed.fiyat_tl != null && fixed.fiyat_tl > 0
        ? fixed.fiyat_tl
        : hit.fiyat_tl != null && hit.fiyat_tl > 0
          ? hit.fiyat_tl
          : null;

    return {
      ...hit,
      ...fixed,
      id: hit.id || fixed.id,
      fiyat_tl: fiyatTl,
      fiyat_bekleniyor: fixed.fiyat_bekleniyor ?? hit.fiyat_bekleniyor ?? 0,
      price_display:
        fixed.price_display ||
        formatConsumerPriceTry({
          fiyat_tl: fiyatTl,
          price: String(row.price || hit.price || ""),
          fiyat_bekleniyor: row.fiyat_bekleniyor ?? hit.fiyat_bekleniyor,
        }),
    };
  });
}
