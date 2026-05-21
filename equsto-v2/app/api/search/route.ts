import { NextRequest } from "next/server";
import { fallbackCatalogSearch } from "@/lib/catalog-search-fallback";
import {
  getMeiliAdmin,
  getMeiliConfigStatus,
  PRODUCTS_INDEX,
} from "@/lib/meilisearch";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 20), 50);
  const check = req.nextUrl.searchParams.get("check") === "1";

  const cfg = getMeiliConfigStatus();

  if (check || !q) {
    if (!q) {
      return Response.json({
        configured: cfg.ok,
        missing: cfg.missing,
        index: cfg.index,
        hint: cfg.ok
          ? "q parametresi ile arayın: ?q=izgara"
          : "Vercel → Settings → Environment Variables; sonra Redeploy",
      });
    }
  }

  if (!q) {
    return Response.json({ hits: [], query: "" });
  }

  const client = getMeiliAdmin();
  if (!client) {
    const fb = fallbackCatalogSearch(q, limit);
    return Response.json({
      query: q,
      hits: fb.hits,
      estimatedTotalHits: fb.estimatedTotalHits,
      source: "fallback",
      warning:
        "Meilisearch yapılandırılmadı — ekipmanlar.json üzerinde yerel arama. MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY ekleyin.",
      missing: cfg.missing,
    });
  }

  try {
    const res = await client.index(PRODUCTS_INDEX).search(q, { limit });
    return Response.json({
      query: q,
      hits: res.hits,
      estimatedTotalHits: res.estimatedTotalHits,
      source: "meilisearch",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Arama hatası";
    console.error("[api/search] Meilisearch:", msg);

    const fb = fallbackCatalogSearch(q, limit);
    if (fb.hits.length) {
      return Response.json({
        query: q,
        hits: fb.hits,
        estimatedTotalHits: fb.estimatedTotalHits,
        source: "fallback",
        warning: `Meilisearch erişilemedi (${msg}). Geçici olarak katalog dosyasında arandı.`,
        index: PRODUCTS_INDEX,
      });
    }

    return Response.json(
      {
        error: msg,
        index: PRODUCTS_INDEX,
        hint:
          "Cloud instance çalışıyor mu? npm run search:health && npm run search:index",
      },
      { status: 502 },
    );
  }
}
