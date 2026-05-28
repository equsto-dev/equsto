import landings from "@/lib/geo/landings.json";

export const runtime = "nodejs";

/** Blog / GEO rehber sayfaları — geo-landings.json (Vercel’de statik /data bazen erişilemez) */
export async function GET() {
  return Response.json(landings, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
