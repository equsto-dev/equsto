import { getTcmbEurEfektifSatis, kurToApiPayload } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";

/**
 * GET /api/kur — TCMB EUR efektif satış (günlük, ~1 saat önbellek)
 * Örnek: { "success": true, "rate": 52.94, "type": "efektif_satis", "date": "20.05.2026" }
 */
export async function GET() {
  const kur = await getTcmbEurEfektifSatis();
  const body = kurToApiPayload(kur);
  return Response.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
