import { NextRequest } from "next/server";
import {
  fallbackCatalogSearch,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { mergeSearchHits, mergeSearchHitsDiverse } from "@/lib/merge-search-hits";
import {
  getMeiliAdmin,
  getMeiliConfigStatus,
  PRODUCTS_INDEX,
} from "@/lib/meilisearch";
import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import { searchDeptsForQuery } from "@/lib/search-synonyms";
import { searchMeiliMulti } from "@/lib/meili-multi-search";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (sp.get("health") === "1") {
    const { getMeiliAdmin, getMeiliConfigStatus } = await import("@/lib/meilisearch");
    const cfg = getMeiliConfigStatus();
    if (!cfg.ok) {
      return Response.json(
        {
          ok: false,
          missing: cfg.missing,
          index: cfg.index,
          hint: "Vercel env ekleyip Production Redeploy yapın (Root Directory: equsto-v2).",
        },
        { status: 503 },
      );
    }
    const client = getMeiliAdmin();
    if (!client) {
      return Response.json({ ok: false, error: "client" }, { status: 503 });
    }
    try {
      const index = client.index(cfg.index);
      const stats = await index.getStats();
      return Response.json({
        ok: true,
        index: cfg.index,
        documents: stats.numberOfDocuments,
        hostPreview: cfg.hostPreview,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Meilisearch bağlantı hatası";
      return Response.json({ ok: false, index: cfg.index, error: msg }, { status: 502 });
    }
  }

  const q = sp.get("q")?.trim() || "";
  const isSuggest = sp.get("suggest") === "1";
  const limit = isSuggest
    ? Math.min(Number(sp.get("limit") || 12), 15)
    : Math.min(Number(sp.get("limit") || 48), 100);
  const offset = isSuggest ? 0 : Math.max(Number(sp.get("offset") || 0), 0);
  const check = sp.get("check") === "1";

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

  const scopedDepts = searchDeptsForQuery(q) ?? undefined;
  const fetchLimit = Math.min(limit + offset + (isSuggest ? 0 : limit), isSuggest ? limit : 200);
  const fbLimit = Math.min(fetchLimit * 2, 300);

  const client = getMeiliAdmin();
  if (!client) {
    const fb = await fallbackCatalogSearch(q, limit, { depts: scopedDepts });
    return Response.json({
      query: q,
      hits: fb.hits,
      estimatedTotalHits: fb.estimatedTotalHits,
      source: "fallback",
      warning:
        "Meilisearch yapılandırılmadı — katalog JSON üzerinde yerel arama. MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY ekleyin.",
      missing: cfg.missing,
    });
  }

  try {
    const [meili, fb] = await Promise.all([
      searchMeiliMulti(client, PRODUCTS_INDEX, q, fetchLimit),
      fallbackCatalogSearch(q, fbLimit, { depts: scopedDepts }),
    ]);

    const mergeFn = isSuggest ? mergeSearchHitsDiverse : mergeSearchHits;
    const merged = mergeFn(meili.hits, fb.hits, fetchLimit);
    const pageHits = merged.slice(offset, offset + limit);
    const usedFallback = pageHits.some(
      (h) => !meili.hits.some((m) => m.id === h.id),
    );
    const total = Math.max(
      meili.estimatedTotalHits,
      fb.estimatedTotalHits,
      merged.length,
    );
    const hits = await canonicalizeSearchHits(pageHits);

    return Response.json({
      query: q,
      hits,
      offset,
      limit,
      estimatedTotalHits: total,
      hasMore: offset + hits.length < total,
      source: "hybrid",
      warning: usedFallback
        ? "Sonuçlar Meilisearch ile katalog aramasının birleşiminden oluşturuldu."
        : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Arama hatası";
    console.error("[api/search] Meilisearch:", msg);

    const fb = await fallbackCatalogSearch(q, limit, { depts: scopedDepts });
    if (fb.hits.length) {
      return Response.json({
        query: q,
        hits: await canonicalizeSearchHits(fb.hits),
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
