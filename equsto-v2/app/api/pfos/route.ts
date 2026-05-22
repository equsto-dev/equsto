import { NextRequest, NextResponse } from "next/server";
import {
  pfosGetConcepts,
  pfosGetKonseptler,
  pfosPostCalculate,
  pfosPostQuote,
} from "@/lib/pfos/api-handlers";

export const runtime = "nodejs";

/** GET /api/pfos — keşif veya ?action=concepts|konseptler */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "";

  if (action === "concepts") {
    return NextResponse.json(pfosGetConcepts(), { status: 200 });
  }
  if (action === "konseptler") {
    return NextResponse.json({ success: true, konseptler: pfosGetKonseptler() });
  }

  return NextResponse.json({
    success: true,
    message: "PFOS API",
    endpoints: {
      concepts: "GET /api/pfos?action=concepts",
      konseptler: "GET /api/pfos?action=konseptler",
      quote: "POST /api/pfos?action=quote",
      calculate: "POST /api/pfos?action=calculate",
    },
    legacyPaths: [
      "/api/pfos/concepts",
      "/api/pfos/konseptler",
      "/api/pfos/quote",
      "/api/pfos/calculate",
    ],
    example: { konsept: "coffee-shop", m2: 80 },
  });
}

/** POST /api/pfos?action=quote|calculate */
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "quote";
  if (action === "calculate") return pfosPostCalculate(req);
  return pfosPostQuote(req);
}
