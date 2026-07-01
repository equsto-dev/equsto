import type { NextRequest } from "next/server";
import { pfosPostQuotePreview } from "@/lib/pfos/api-handlers";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/pfos/quote/preview — eksik zorunlu + önerilen detay seviyesi */
export async function POST(req: NextRequest) {
  return pfosPostQuotePreview(req);
}
