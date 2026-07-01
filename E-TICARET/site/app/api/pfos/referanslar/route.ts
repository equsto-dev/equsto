import type { NextRequest } from "next/server";
import { pfosGetReferanslar } from "@/lib/pfos/api-handlers";

export const runtime = "nodejs";

/** GET /api/pfos/referanslar?konsept=&segment= */
export async function GET(req: NextRequest) {
  return pfosGetReferanslar(req);
}
