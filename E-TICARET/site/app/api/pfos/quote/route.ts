import type { NextRequest } from "next/server";
import { pfosPostQuote } from "@/lib/pfos/api-handlers";

export const runtime = "nodejs";

/** POST /api/pfos/quote */
export async function POST(req: NextRequest) {
  return pfosPostQuote(req);
}
