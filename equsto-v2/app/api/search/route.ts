import { NextRequest } from "next/server";
import { getMeiliAdmin, PRODUCTS_INDEX } from "@/lib/meilisearch";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 20), 50);

  if (!q) {
    return Response.json({ hits: [], query: "" });
  }

  const client = getMeiliAdmin();
  if (!client) {
    return Response.json({ error: "Meilisearch yapılandırılmadı" }, { status: 503 });
  }

  const res = await client.index(PRODUCTS_INDEX).search(q, { limit });
  return Response.json({ query: q, hits: res.hits, estimatedTotalHits: res.estimatedTotalHits });
}
