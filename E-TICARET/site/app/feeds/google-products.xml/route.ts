import { NextRequest } from "next/server";
import { buildGoogleMerchantFeedXml } from "@/lib/google-merchant-feed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get("stats") === "1") {
    const { stats, origin } = await buildGoogleMerchantFeedXml({
      includeQuoteOnly: sp.get("includeQuote") === "1",
    });
    return Response.json(
      {
        ok: true,
        origin,
        feedUrl: `${origin}/feeds/google-products.xml`,
        stats,
      },
      {
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  const limit = sp.get("limit") ? Math.min(Number(sp.get("limit")), 50000) : undefined;

  const { xml, stats } = await buildGoogleMerchantFeedXml({
    includeQuoteOnly: sp.get("includeQuote") === "1",
    limit: Number.isFinite(limit) && limit! > 0 ? limit : undefined,
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Equsto-Feed-Items": String(stats.included),
    },
  });
}
