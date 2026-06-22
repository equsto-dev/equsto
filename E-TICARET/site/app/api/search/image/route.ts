import { NextRequest, NextResponse } from "next/server";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import {
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { getMeiliAdmin, PRODUCTS_INDEX } from "@/lib/meilisearch";
import { meiliSearchQuery } from "@/lib/search-query";
import { meiliSearchParams } from "@/lib/meili-search-params";
import { extractImageSearchQuery } from "@/lib/search/image-vision-query";
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

    const vision = await extractImageSearchQuery(buffer, mime);
    let searchQ = vision.q;
    if (vision.brand && !searchQ.toLowerCase().includes(vision.brand.toLowerCase())) {
      searchQ = `${vision.brand} ${searchQ}`.trim();
    }
    if (vision.model && !searchQ.toLowerCase().includes(vision.model.toLowerCase())) {
      searchQ = `${searchQ} ${vision.model}`.trim();
    }

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

    return NextResponse.json({
      ok: true,
      query: searchQ,
      vision,
      hits: canonical,
      estimatedTotalHits: canonical.length,
      source,
    });
  } catch (err) {
    console.error("[api/search/image]", err);
    const msg = err instanceof Error ? err.message : "Görsel arama hatası";
    const status = /yapılandırılmamış|Anthropic|çıkarılamadı/i.test(msg) ? 502 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
