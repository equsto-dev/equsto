import landings from "@/lib/geo/landings.json";
import landingsEn from "@/lib/geo/landings-en.json";

export const runtime = "nodejs";

function stripMeta(raw: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "version" || k === "source") continue;
    out[k] = v;
  }
  return out;
}

/** Blog / GEO rehber sayfaları (TR + EN) — Vercel’de statik /data bazen erişilemez */
export async function GET() {
  const merged = {
    ...stripMeta(landings as Record<string, unknown>),
    ...stripMeta(landingsEn as Record<string, unknown>),
  };
  return Response.json(merged, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
  });
}
