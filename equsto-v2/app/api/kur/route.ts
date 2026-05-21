import { getTcmbEurEfektifSatis, kurToApiPayload } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";

const REVALIDATE_SEC = Number(process.env.TCMB_KUR_REVALIDATE_SEC ?? "60") || 60;

/**
 * GET /api/kur — TCMB EUR efektif satış (varsayılan ~60 sn önbellek, TCMB_KUR_REVALIDATE_SEC=0 → her istekte taze)
 */
export async function GET() {
  const kur = await getTcmbEurEfektifSatis();
  const body = kurToApiPayload(kur);
  const maxAge = REVALIDATE_SEC > 0 ? REVALIDATE_SEC : 0;
  return Response.json(body, {
    headers: {
      "Cache-Control":
        maxAge > 0
          ? `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 10}`
          : "no-store",
    },
  });
}
