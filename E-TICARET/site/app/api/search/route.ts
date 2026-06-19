import { NextRequest } from "next/server";
import {
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { mergeSearchHits } from "@/lib/merge-search-hits";
import {
  getMeiliAdmin,
  getMeiliConfigStatus,
  PRODUCTS_INDEX,
} from "@/lib/meilisearch";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import { meiliSearchQuery } from "@/lib/search-query";
import { meiliSearchParams } from "@/lib/meili-search-params";
import { logSearchQuery } from "@/lib/search-log";
import {
  diversifySearchHits,
  rankSearchHitsByRelevance,
  shouldDiversifySearchHits,
} from "@/lib/rank-search-hits";
import { fetchSearchFacetPool } from "@/lib/search-facet-pool";
import { resolveBrandSearchQuery } from "@/lib/search-brand-resolve";
import { shouldBoostBrandCooking } from "@/lib/rank-brand-search-hits";
import {
  applySearchFacetFilters,
  computeSearchFacetCounts,
  hasActiveSearchFacetFilters,
  parseSearchFacetParams,
  searchHasPisirmeFacets,
} from "@/lib/search-page-facets";

export const runtime = "nodejs";

function searchResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return Response.json(body, { status });
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("health") === "1") {
    const cfg = getMeiliConfigStatus();
    if (!cfg.ok) {
      return searchResponse(
        {
          ok: false,
          missing: cfg.missing,
          index: cfg.index,
          hint: ".env.production: MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY",
        },
        503,
      );
    }
    const client = getMeiliAdmin();
    if (!client) {
      return searchResponse({ ok: false, error: "client" }, 503);
    }
    try {
      const stats = await client.index(cfg.index).getStats();
      return searchResponse({
        ok: true,
        index: cfg.index,
        documents: stats.numberOfDocuments,
        hostPreview: cfg.hostPreview,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Meilisearch bağlantı hatası";
      return searchResponse({ ok: false, index: cfg.index, error: msg }, 502);
    }
  }

  const q = sp.get("q")?.trim() || "";
  const isSuggest = sp.get("suggest") === "1";
  const limit = isSuggest
    ? Math.min(Number(sp.get("limit") || 12), 15)
    : Math.min(Number(sp.get("limit") || 48), 100);
  const offset = isSuggest ? 0 : Math.max(Number(sp.get("offset") || 0), 0);
  const facetState = parseSearchFacetParams(sp);
  const wantsFacets =
    !isSuggest &&
    (sp.get("facets") === "1" || hasActiveSearchFacetFilters(facetState));
  const cfg = getMeiliConfigStatus();

  if (!q) {
    return searchResponse({
      configured: cfg.ok,
      missing: cfg.missing,
      index: cfg.index,
      hits: [],
      query: "",
    });
  }

  async function respondFallback(fbOffset = offset, warning?: string) {
    const fbPool = shouldDiversifySearchHits(q)
      ? Math.min(Math.max(limit * 6, 120), 250)
      : limit;
    const fb = await fallbackCatalogSearch(q, fbPool, {
      offset: shouldDiversifySearchHits(q) ? 0 : fbOffset,
    });
    let fbHits = fb.hits;
    if (shouldDiversifySearchHits(q)) {
      fbHits = diversifySearchHits(q, fbHits, fbHits.length).slice(
        fbOffset,
        fbOffset + limit,
      );
    }
    const hits = await canonicalizeSearchHits(fbHits);
    const total = fb.estimatedTotalHits;
    logSearchQuery(q, total, "fallback");
    return searchResponse({
      query: q,
      hits,
      offset: fbOffset,
      limit,
      estimatedTotalHits: total,
      hasMore: fbOffset + hits.length < total,
      source: "fallback",
      warning:
        warning ||
        (!cfg.ok
          ? "Meilisearch yapılandırılmadı — katalog JSON araması."
          : undefined),
      missing: cfg.missing.length ? cfg.missing : undefined,
    });
  }

  const client = getMeiliAdmin();

  if (wantsFacets && q) {
    try {
      const pool = await fetchSearchFacetPool(client, q);
      const filtered = applySearchFacetFilters(pool.hits, facetState);
      const facets = computeSearchFacetCounts(pool.hits, facetState);
      const hits = filtered.slice(offset, offset + limit);
      const total = filtered.length;
      const brandMatch = resolveBrandSearchQuery(q);
      const source = brandMatch
        ? "brand"
        : client
          ? "meilisearch"
          : "fallback";

      logSearchQuery(q, total, source);

      return searchResponse({
        query: q,
        hits: await canonicalizeSearchHits(hits),
        offset,
        limit,
        estimatedTotalHits: total,
        hasMore: offset + hits.length < total,
        source,
        facets: {
          depts: facets.depts,
          brands: facets.brands,
          pisirmeTip: facets.pisirmeTip,
          priceMin: facets.priceMin,
          priceMax: facets.priceMax,
          poolSize: pool.hits.length,
          poolTotal: pool.estimatedTotalHits,
          hasPisirmeFacets: searchHasPisirmeFacets(pool.hits),
          sortMode:
            brandMatch && shouldBoostBrandCooking(brandMatch.slug)
              ? "brand-cooking"
              : undefined,
        },
        warning:
          pool.estimatedTotalHits > pool.hits.length
            ? `Filtre sayıları ilk ${pool.hits.length} sonuç üzerinden hesaplandı.`
            : undefined,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Facet arama hatası";
      console.error("[api/search] facets:", msg);
      if (!client) {
        return respondFallback(
          offset,
          `Facet araması başarısız (${msg}). Katalog araması kullanıldı.`,
        );
      }
    }
  }

  if (!client) {
    return respondFallback(
      offset,
      "Meilisearch yapılandırılmadı — katalog JSON üzerinde arama.",
    );
  }

  try {
    const index = client.index(PRODUCTS_INDEX);
    const meiliQ = meiliSearchQuery(q);
    const meiliOpts = meiliSearchParams(q, limit, offset);
    const meiliOffset = meiliOpts.rerankPool ? 0 : meiliOpts.offset;
    const meiliRes = await index.search(meiliQ, {
      limit: meiliOpts.limit,
      offset: meiliOffset,
      ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
    });
    let hits = (meiliRes.hits || []) as CatalogSearchHit[];
    let total = meiliRes.estimatedTotalHits ?? hits.length;
    let source: "meilisearch" | "hybrid" = "meilisearch";
    let warning: string | undefined;

    if (meiliOpts.rerankPool && hits.length) {
      let pool = rankSearchHitsByRelevance(q, hits);

      if (pool.length < meiliOpts.limit) {
        const fb = await fallbackCatalogSearch(q, meiliOpts.limit + 32, {
          offset: 0,
        });
        const seen = new Set(pool.map((h) => h.id));
        const extras = fb.hits.filter((h) => h?.id && !seen.has(h.id));
        if (extras.length) {
          pool = rankSearchHitsByRelevance(
            q,
            mergeSearchHits(pool, extras, meiliOpts.limit),
          );
          total = Math.max(total, fb.estimatedTotalHits);
          source = "hybrid";
          warning = "Sonuçlar Meilisearch + katalog birleşiminden oluşturuldu.";
        }
      }

      hits = diversifySearchHits(q, pool, pool.length).slice(
        offset,
        offset + limit,
      );
    } else if (offset === 0 && hits.length < limit) {
      const need = limit - hits.length;
      const fb = await fallbackCatalogSearch(q, need + 32, { offset: 0 });
      const seen = new Set(hits.map((h) => h.id));
      const extras = fb.hits.filter((h) => h?.id && !seen.has(h.id));
      if (extras.length) {
        hits = mergeSearchHits(hits, extras, limit);
        total = Math.max(total, fb.estimatedTotalHits);
        source = "hybrid";
        warning = "Sonuçlar Meilisearch + katalog birleşiminden oluşturuldu.";
      }
    }

    hits = await canonicalizeSearchHits(hits);
    if (!meiliOpts.rerankPool) {
      hits = rankSearchHitsByRelevance(q, hits);
    }

    logSearchQuery(q, total, source);

    return searchResponse({
      query: q,
      hits,
      offset,
      limit,
      estimatedTotalHits: total,
      hasMore: offset + hits.length < total,
      source,
      warning,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Arama hatası";
    console.error("[api/search] Meilisearch:", msg);
    return respondFallback(
      offset,
      `Meilisearch erişilemedi (${msg}). Katalog araması kullanıldı.`,
    );
  }
}
