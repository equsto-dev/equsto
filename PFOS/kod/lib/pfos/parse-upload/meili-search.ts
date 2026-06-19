/**
 * Proforma kalem eşlemesi — Meilisearch fuzzy arama (api/search ile aynı mantık).
 */

import {
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { mergeSearchHits } from "@/lib/merge-search-hits";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import {
  getMeiliAdmin,
  getMeiliConfigStatus,
  PRODUCTS_INDEX,
} from "@/lib/meilisearch";
import { meiliSearchQuery } from "@/lib/search-query";
import { meiliSearchParams } from "@/lib/meili-search-params";
import {
  diversifySearchHits,
  rankSearchHitsByRelevance,
  shouldDiversifySearchHits,
} from "@/lib/rank-search-hits";

const DEFAULT_LIMIT = 8;

export async function searchCatalogForProforma(
  q: string,
  limit = DEFAULT_LIMIT,
): Promise<CatalogSearchHit[]> {
  const query = q.trim();
  if (!query) return [];

  const cfg = getMeiliConfigStatus();
  const client = getMeiliAdmin();

  async function fromFallback(poolLimit: number): Promise<CatalogSearchHit[]> {
    const fbPool = shouldDiversifySearchHits(query)
      ? Math.min(Math.max(poolLimit * 6, 48), 120)
      : poolLimit;
    const fb = await fallbackCatalogSearch(query, fbPool, { offset: 0 });
    let hits = fb.hits;
    if (shouldDiversifySearchHits(query)) {
      hits = diversifySearchHits(query, hits, hits.length).slice(0, poolLimit);
    }
    return canonicalizeSearchHits(hits);
  }

  if (!client) {
    const hits = await fromFallback(limit);
    return rankSearchHitsByRelevance(query, hits).slice(0, limit);
  }

  try {
    const index = client.index(PRODUCTS_INDEX);
    const meiliQ = meiliSearchQuery(query);
    const meiliOpts = meiliSearchParams(query, limit, 0);
    const meiliRes = await index.search(meiliQ, {
      limit: meiliOpts.limit,
      offset: 0,
      ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
    });
    let hits = (meiliRes.hits || []) as CatalogSearchHit[];

    if (meiliOpts.rerankPool && hits.length) {
      let pool = rankSearchHitsByRelevance(query, hits);
      if (pool.length < meiliOpts.limit) {
        const fb = await fallbackCatalogSearch(query, meiliOpts.limit + 24, {
          offset: 0,
        });
        const seen = new Set(pool.map((h) => h.id));
        const extras = fb.hits.filter((h) => h?.id && !seen.has(h.id));
        if (extras.length) {
          pool = rankSearchHitsByRelevance(
            query,
            mergeSearchHits(pool, extras, meiliOpts.limit),
          );
        }
      }
      hits = diversifySearchHits(query, pool, pool.length).slice(0, limit);
    } else if (hits.length < limit) {
      const fb = await fallbackCatalogSearch(query, limit + 16, { offset: 0 });
      const seen = new Set(hits.map((h) => h.id));
      const extras = fb.hits.filter((h) => h?.id && !seen.has(h.id));
      if (extras.length) {
        hits = mergeSearchHits(hits, extras, limit);
      }
    }

    hits = await canonicalizeSearchHits(hits);
    if (!meiliOpts.rerankPool) {
      hits = rankSearchHitsByRelevance(query, hits);
    }
    return hits.slice(0, limit);
  } catch (e) {
    console.error("[parse-upload/meili-search]", cfg.index, e);
    const hits = await fromFallback(limit);
    return rankSearchHitsByRelevance(query, hits).slice(0, limit);
  }
}
