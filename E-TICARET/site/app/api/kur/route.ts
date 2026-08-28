import { tcmbKurHttpResponse } from "@/lib/tcmb-kur";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/kur — TCMB EUR efektif satış (canlı, kısa önbellek). ?format=raw → ham kur */
export async function GET(req: Request) {
  const url = new URL(req.url);
  return tcmbKurHttpResponse(url.searchParams);
}