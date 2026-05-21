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
import { expandSearchQueries } from "@/lib/search-synonyms";

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

  const meiliQueries = expandSearchQueries(q);

  try {
    let meiliHits: CatalogSearchHit[] = [];
    let estimatedTotalHits = 0;

    for (const mq of meiliQueries) {
      const res = await client.index(PRODUCTS_INDEX).search(mq, { limit });
      estimatedTotalHits = Math.max(
        estimatedTotalHits,
        res.estimatedTotalHits ?? 0,
      );
      if (res.hits?.length) {
        meiliHits = res.hits as CatalogSearchHit[];
        break;
      }
    }

    const fb = fallbackCatalogSearch(q, limit);
    const merged = mergeSearchHits(meiliHits, fb.hits, limit);

    const usedFallback = merged.length > meiliHits.length || meiliHits.length === 0;
    const total = Math.max(estimatedTotalHits, fb.estimatedTotalHits, merged.length);

    return Response.json({
      query: q,
      hits: merged,
      estimatedTotalHits: total,
      source: usedFallback && meiliHits.length === 0 ? "fallback" : "hybrid",
      warning:
        usedFallback && meiliHits.length === 0
          ? "İndeks eksik veya eşleşmedi — tam katalogdan (5252+ ürün) tamamlandı. npm run search:index ile indeksi güncelleyin."
          : usedFallback
            ? "Bazı sonuçlar katalog dosyasından eklendi."
            : undefined,
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
