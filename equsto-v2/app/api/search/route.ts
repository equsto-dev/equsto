import { NextRequest } from "next/server";
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

  if (check || !q) {
    const cfg = getMeiliConfigStatus();
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
    const cfg = getMeiliConfigStatus();
    return Response.json(
      {
        error: "Meilisearch yapılandırılmadı",
        missing: cfg.missing,
        hint:
          "Vercel’de MEILISEARCH_HOST + MEILISEARCH_MASTER_KEY (Production) kaydedin, Root Directory = equsto-v2, ardından Redeploy. Tanı: /api/search?check=1",
      },
      { status: 503 }
    );
  }

  try {
    const res = await client.index(PRODUCTS_INDEX).search(q, { limit });
    return Response.json({
      query: q,
      hits: res.hits,
      estimatedTotalHits: res.estimatedTotalHits,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Arama hatası";
    console.error("[api/search]", msg);
    return Response.json(
      { error: msg, index: PRODUCTS_INDEX, hint: "MEILISEARCH_HOST anahtar/host doğru mu?" },
      { status: 502 }
    );
  }
}
