import { NextRequest, NextResponse } from "next/server";
import { searchCatalogByImageEmbedding } from "@/lib/search/visual-embedding-search";

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

    const visual = await searchCatalogByImageEmbedding(buffer, mime);

    if (!visual.ok) {
      return NextResponse.json({
        ok: false,
        error: visual.error || "Görsel arama sonucu bulunamadı.",
        method: visual.method,
        source: visual.source,
        indexReady: visual.indexReady,
        suggestUrl: visual.suggestUrl,
        scores: visual.scores.slice(0, 5),
      }, { status: visual.indexReady ? 404 : 503 });
    }

    return NextResponse.json({
      ok: true,
      visualSearch: true,
      method: visual.method,
      source: visual.source,
      hits: visual.hits,
      scores: visual.scores.slice(0, visual.hits.length),
      estimatedTotalHits: visual.hits.length,
      catalogMatch: true,
      suggestUrl: null,
    });
  } catch (err) {
    console.error("[api/search/image]", err);
    const msg = err instanceof Error ? err.message : "Görsel arama hatası";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
