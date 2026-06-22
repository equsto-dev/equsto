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
  visualCatalogMatch,
} from "@/lib/search/visual-search-query";
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

async function resolveVisionQuery(
  buffer: ArrayBuffer,
  mime: string,
): Promise<{ vision: ImageVisionQuery; method: string } | { fallback: "client-ocr" }> {
  try {
    const vision = await extractImageSearchQuery(buffer, mime);
    return { vision, method: "anthropic" };
  } catch (anthropicErr) {
    const anthropicMsg = String(
      anthropicErr instanceof Error ? anthropicErr.message : anthropicErr,
    );
    console.warn("[api/search/image] anthropic:", anthropicMsg);

    if (process.env.GEMINI_API_KEY?.trim()) {
      try {
        const vision = await extractImageSearchQueryGemini(buffer, mime);
        return { vision, method: "gemini" };
      } catch (geminiErr) {
        console.warn(
          "[api/search/image] gemini:",
          geminiErr instanceof Error ? geminiErr.message : geminiErr,
        );
      }
    }

    if (isAnthropicQuotaError(anthropicMsg) || /GEMINI_API_KEY|Gemini HTTP/i.test(anthropicMsg)) {
      return { fallback: "client-ocr" };
    }

    return { fallback: "client-ocr" };
  }
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
    if ("fallback" in resolved) {
      return NextResponse.json(
        {
          ok: false,
          fallback: "client-ocr",
          error: "Görsel analiz kotası dolu; görseldeki yazılar taranacak.",
        },
        { status: 502 },
      );
    }

    const searchQ = buildSearchQ(resolved.vision);
    const { canonical, source } = await searchCatalog(searchQ);
    const catalogMatch = visualCatalogMatch(searchQ, canonical);

    return NextResponse.json({
      ok: true,
      query: searchQ,
      vision: resolved.vision,
      method: resolved.method,
      hits: catalogMatch ? canonical : [],
      estimatedTotalHits: catalogMatch ? canonical.length : 0,
      catalogMatch,
      source,
    });
  } catch (err) {
    console.error("[api/search/image]", err);
    const msg = err instanceof Error ? err.message : "Görsel arama hatası";
    return NextResponse.json(
      { ok: false, fallback: "client-ocr", error: msg },
      { status: 502 },
    );
  }
}
