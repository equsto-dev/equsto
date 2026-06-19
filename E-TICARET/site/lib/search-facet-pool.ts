import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { fallbackCatalogSearch } from "@/lib/catalog-search-fallback";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import { mergeSearchHits } from "@/lib/merge-search-hits";
import { meiliSearchParams } from "@/lib/meili-search-params";
import { getMeiliAdmin, PRODUCTS_INDEX } from "@/lib/meilisearch";
import { meiliSearchQuery } from "@/lib/search-query";
import {
  diversifySearchHits,
  rankSearchHitsByRelevance,
} from "@/lib/rank-search-hits";
import { SEARCH_FACET_POOL_CAP } from "@/lib/search-page-facets";

type MeiliClient = NonNullable<ReturnType<typeof getMeiliAdmin>>;

/** Arama facetleri için tam sonuç havuzu (en fazla SEARCH_FACET_POOL_CAP). */
export async function fetchSearchFacetPool(
  client: MeiliClient | null,
  q: string,
): Promise<{ hits: CatalogSearchHit[]; estimatedTotalHits: number }> {
  if (!client) {
    const fb = await fallbackCatalogSearch(q, SEARCH_FACET_POOL_CAP, {
      offset: 0,
    });
    return {
      hits: await canonicalizeSearchHits(fb.hits),
      estimatedTotalHits: fb.estimatedTotalHits,
    };
  }

  const index = client.index(PRODUCTS_INDEX);
  const meiliQ = meiliSearchQuery(q);
  const meiliOpts = meiliSearchParams(q, SEARCH_FACET_POOL_CAP, 0);
  const fetchLimit = meiliOpts.rerankPool
    ? Math.min(Math.max(SEARCH_FACET_POOL_CAP, 250), 250)
    : SEARCH_FACET_POOL_CAP;

  const meiliRes = await index.search(meiliQ, {
    limit: fetchLimit,
    offset: 0,
    ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
  });

  let hits = (meiliRes.hits || []) as CatalogSearchHit[];
  let total = meiliRes.estimatedTotalHits ?? hits.length;

  if (meiliOpts.rerankPool && hits.length) {
    hits = rankSearchHitsByRelevance(q, hits);
    hits = diversifySearchHits(q, hits, hits.length);
    total = Math.max(total, hits.length);
  } else {
    hits = rankSearchHitsByRelevance(q, hits);
    if (total > hits.length && hits.length < SEARCH_FACET_POOL_CAP) {
      const need = Math.min(total, SEARCH_FACET_POOL_CAP) - hits.length;
      if (need > 0) {
        const more = await index.search(meiliQ, {
          limit: need,
          offset: hits.length,
          ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
        });
        const extras = (more.hits || []) as CatalogSearchHit[];
        const seen = new Set(hits.map((h) => h.id));
        for (const h of extras) {
          if (h?.id && !seen.has(h.id)) {
            seen.add(h.id);
            hits.push(h);
          }
        }
        hits = rankSearchHitsByRelevance(q, hits);
      }
    }
  }

  if (hits.length < Math.min(total, SEARCH_FACET_POOL_CAP)) {
    const fb = await fallbackCatalogSearch(
      q,
      SEARCH_FACET_POOL_CAP - hits.length + 32,
      { offset: 0 },
    );
    const seen = new Set(hits.map((h) => h.id));
    const extras = fb.hits.filter((h) => h?.id && !seen.has(h.id));
    if (extras.length) {
      hits = rankSearchHitsByRelevance(
        q,
        mergeSearchHits(hits, extras, SEARCH_FACET_POOL_CAP),
      );
      total = Math.max(total, fb.estimatedTotalHits);
    }
  }

  hits = await canonicalizeSearchHits(hits);
  hits = rankSearchHitsByRelevance(q, hits);
  return {
    hits: hits.slice(0, SEARCH_FACET_POOL_CAP),
    estimatedTotalHits: total,
  };
}
