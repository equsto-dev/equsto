import {
  catalogSearchByBrand,
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import { mergeSearchHits } from "@/lib/merge-search-hits";
import { meiliSearchParams } from "@/lib/meili-search-params";
import { PRODUCTS_INDEX, type getMeiliAdmin } from "@/lib/meilisearch";
import {
  meiliFilterForBrand,
  resolveBrandSearchQuery,
  type BrandSearchMatch,
} from "@/lib/search-brand-resolve";
import { meiliSearchQuery } from "@/lib/search-query";
import {
  BRAND_SEARCH_POOL_CAP,
  SEARCH_FACET_POOL_CAP,
} from "@/lib/search-page-facets";
import {
  diversifySearchHits,
  rankSearchHitsByRelevance,
} from "@/lib/rank-search-hits";

type MeiliClient = NonNullable<ReturnType<typeof getMeiliAdmin>>;

async function fetchMeiliHitsByFilter(
  client: MeiliClient,
  filter: string,
  cap: number,
): Promise<{ hits: CatalogSearchHit[]; total: number }> {
  const index = client.index(PRODUCTS_INDEX);
  const out: CatalogSearchHit[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let total = 0;
  const page = 1000;

  while (out.length < cap) {
    const res = await index.search("", {
      filter,
      limit: Math.min(page, cap - out.length),
      offset,
    });
    const batch = (res.hits || []) as CatalogSearchHit[];
    total = res.estimatedTotalHits ?? total;
    if (!batch.length) break;
    for (const h of batch) {
      if (h?.id && !seen.has(h.id)) {
        seen.add(h.id);
        out.push(h);
      }
    }
    offset += batch.length;
    if (batch.length < Math.min(page, cap - out.length)) break;
    if (offset >= (res.estimatedTotalHits ?? offset)) break;
  }

  return { hits: out, total: Math.max(total, out.length) };
}

async function fetchBrandSearchPool(
  client: MeiliClient | null,
  brand: BrandSearchMatch,
): Promise<{ hits: CatalogSearchHit[]; estimatedTotalHits: number }> {
  const cap = BRAND_SEARCH_POOL_CAP;
  let hits: CatalogSearchHit[] = [];
  let total = 0;

  const filter = meiliFilterForBrand(brand);
  if (client && filter) {
    try {
      const meili = await fetchMeiliHitsByFilter(client, filter, cap);
      hits = meili.hits;
      total = meili.total;
    } catch {
      hits = [];
    }
  }

  const catalog = await catalogSearchByBrand(brand, cap, 0);
  if (catalog.hits.length) {
    const seen = new Set(hits.map((h) => h.id));
    const extras = catalog.hits.filter((h) => h?.id && !seen.has(h.id));
    if (extras.length || !hits.length) {
      hits = rankSearchHitsByRelevance(
        brand.query,
        mergeSearchHits(hits, extras.length ? extras : catalog.hits, cap),
      );
    }
    total = Math.max(total, catalog.estimatedTotalHits);
  }

  hits = await canonicalizeSearchHits(hits);
  hits = rankSearchHitsByRelevance(brand.query, hits);
  return {
    hits: hits.slice(0, cap),
    estimatedTotalHits: Math.max(total, hits.length),
  };
}

/** Arama facetleri için tam sonuç havuzu. */
export async function fetchSearchFacetPool(
  client: MeiliClient | null,
  q: string,
): Promise<{ hits: CatalogSearchHit[]; estimatedTotalHits: number }> {
  const brand = resolveBrandSearchQuery(q);
  if (brand) {
    return fetchBrandSearchPool(client, brand);
  }

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
