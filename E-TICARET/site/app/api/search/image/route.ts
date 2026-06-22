import { NextRequest, NextResponse } from "next/server";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import {
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { isAnthropicQuotaError } from "@/lib/claude/anthropic-errors";
import { getMeiliAdmin, PRODUCTS_INDEX } from "@/lib/meilisearch";
import { meiliSearchQuery } from "@/lib/search-query";
import { meiliSearchParams } from "@/lib/meili-search-params";
import { extractImageSearchQueryGemini } from "@/lib/search/image-gemini-query";
import {
  extractImageSearchQuery,
  type ImageVisionQuery,
} from "@/lib/search/image-vision-query";
import {
  buildVisualSearchQuery,
  expandVisualSearchQueries,
  isBarStationVisualQuery,
  rerankVisualHits,
  scoreVisualHit,
  suggestBesosUrlForVisualQuery,
  visualCatalogMatch,
} from "@/lib/search/visual-search-query";
import { isDisplayableSearchQuery } from "@/lib/search/parse-vision-output";
import { rankSearchHitsByRelevance } from "@/lib/rank-search-hits";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function buildSearchQ(vision: ImageVisionQuery): string {
  return buildVisualSearchQuery(vision);
}

async function searchCatalog(searchQ: string) {
  const client = getMeiliAdmin();
  let hits: CatalogSearchHit[] = [];
  let source: "meilisearch" | "fallback" = "meilisearch";

  if (client) {
    const index = client.index(PRODUCTS_INDEX);
    const meiliOpts = meiliSearchParams(searchQ, 16, 0);
    const res = await index.search(meiliSearchQuery(searchQ), {
      limit: meiliOpts.limit,
      offset: 0,
      ...(meiliOpts.filter ? { filter: meiliOpts.filter } : {}),
    });
    hits = rankSearchHitsByRelevance(searchQ, (res.hits || []) as CatalogSearchHit[]);
  } else {
    source = "fallback";
    const fb = await fallbackCatalogSearch(searchQ, 16);
    hits = fb.hits;
  }

  const canonical = await canonicalizeSearchHits(hits.slice(0, 12));
  return { canonical, source };
}

async function searchCatalogVisual(queries: string[]) {
  let best = {
    canonical: [] as CatalogSearchHit[],
    source: "meilisearch" as "meilisearch" | "fallback",
    query: queries[0] || "",
    score: -1,
  };

  for (const q of queries) {
    const { canonical, source } = await searchCatalog(q);
    const score = canonical.length
      ? Math.max(...canonical.slice(0, 8).map((h) => scoreVisualHit(q, h)))
      : -1;
    if (score > best.score) {
      best = { canonical, source, query: q, score };
    }
  }

  const catalogMatch = visualCatalogMatch(best.query, best.canonical);
  const hits = catalogMatch
    ? rerankVisualHits(best.query, best.canonical)
    : [];

  return { ...best, catalogMatch, hits };
}

async function resolveVisionQuery(
  buffer: ArrayBuffer,
  mime: string,
): Promise<{ vision: ImageVisionQuery; method: string }> {
  const errors: string[] = [];

  if (process.env.GEMINI_API_KEY?.trim()) {
    try {
      const vision = await extractImageSearchQueryGemini(buffer, mime);
      return { vision, method: "gemini" };
    } catch (geminiErr) {
      errors.push(
        geminiErr instanceof Error ? geminiErr.message : String(geminiErr),
      );
      console.warn("[api/search/image] gemini:", errors[errors.length - 1]);
    }
  }

  try {
    const vision = await extractImageSearchQuery(buffer, mime);
    return { vision, method: "anthropic" };
  } catch (anthropicErr) {
    const anthropicMsg = String(
      anthropicErr instanceof Error ? anthropicErr.message : anthropicErr,
    );
    errors.push(anthropicMsg);
    console.warn("[api/search/image] anthropic:", anthropicMsg);
  }

  const hint = errors[0] || "Görsel analiz edilemedi.";
  if (isAnthropicQuotaError(hint)) {
    throw new Error("Görsel analiz servisi geçici olarak kullanılamıyor. Lütfen biraz sonra tekrar deneyin.");
  }
  throw new Error("Görsel analiz edilemedi. Lütfen tekrar deneyin.");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: "Görsel bulunamadı" }, { status: 400 });
    }

    const mime = (file.type || "image/jpeg").toLowerCase();
    if (!ALLOWED_TYPES.has(mime)) {
      return NextResponse.json(
        { ok: false, error: "Desteklenen formatlar: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Görsel en fazla 20 MB olabilir" },
        { status: 400 },
      );
    }

    const resolved = await resolveVisionQuery(buffer, mime);

    const queries = expandVisualSearchQueries(resolved.vision);
    const searchQ = queries[0] || buildSearchQ(resolved.vision);
    if (!searchQ || !isDisplayableSearchQuery(searchQ)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Görselden ürün tipi çıkarılamadı. Farklı bir açıdan veya daha net bir görsel deneyin.",
        },
        { status: 422 },
      );
    }

    if (isBarStationVisualQuery(searchQ)) {
      return NextResponse.json({
        ok: true,
        query: searchQ,
        vision: resolved.vision,
        method: resolved.method,
        hits: [],
        estimatedTotalHits: 0,
        catalogMatch: false,
        suggestUrl: "/besos/bar-istasyonlari",
        source: "besos",
      });
    }

    const visual = await searchCatalogVisual(queries.length ? queries : [searchQ]);
    const suggestUrl = visual.catalogMatch
      ? null
      : suggestBesosUrlForVisualQuery(visual.query || searchQ);

    return NextResponse.json({
      ok: true,
      query: visual.query || searchQ,
      vision: resolved.vision,
      method: resolved.method,
      hits: visual.hits,
      estimatedTotalHits: visual.catalogMatch ? visual.hits.length : 0,
      catalogMatch: visual.catalogMatch,
      suggestUrl,
      source: visual.source,
    });
  } catch (err) {
    console.error("[api/search/image]", err);
    const msg = err instanceof Error ? err.message : "Görsel arama hatası";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
