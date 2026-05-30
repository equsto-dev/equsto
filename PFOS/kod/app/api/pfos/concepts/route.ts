import { NextResponse } from "next/server";
import { pfosGetConcepts } from "@/lib/pfos/api-handlers";

export const runtime = "nodejs";

/** GET /api/pfos/concepts — konsept listesi (dizi) */
export async function GET() {
  return NextResponse.json(pfosGetConcepts(), { status: 200 });
}
