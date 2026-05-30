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
import { rankSearchHitsByRelevance } from "@/lib/rank-search-hits";

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
          hint: "Vercel env: MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY",
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
    const fb = await fallbackCatalogSearch(q, limit, { offset: fbOffset });
    const hits = await canonicalizeSearchHits(fb.hits);
    const total = fb.estimatedTotalHits;
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
    const meiliRes = await index.search(meiliQ, {
      limit: meiliOpts.limit,
      offset: meiliOpts.offset,
      ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
    });
    let hits = (meiliRes.hits || []) as CatalogSearchHit[];
    let total = meiliRes.estimatedTotalHits ?? hits.length;
    let source: "meilisearch" | "hybrid" = "meilisearch";
    let warning: string | undefined;

    if (meiliOpts.rerankPool && hits.length) {
      hits = rankSearchHitsByRelevance(q, hits).slice(0, limit);
    }

    // İlk sayfa: Meili az döndürürse katalog tamamlaması (eksik indeks / eşanlam)
    if (offset === 0 && hits.length < limit) {
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
