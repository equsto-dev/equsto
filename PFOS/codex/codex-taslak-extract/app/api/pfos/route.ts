import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/pfos — keşif veya ?action=concepts|konseptler */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "";

  if (action === "concepts") {
    const { pfosGetConcepts } = await import("@/lib/pfos/api-handlers");
    return NextResponse.json(pfosGetConcepts(), { status: 200 });
  }
  if (action === "konseptler") {
    const { pfosGetKonseptler } = await import("@/lib/pfos/api-handlers");
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
      projects: "GET /api/pfos/projects",
    },
    admin: ["/api/urunler", "/api/market?kind=kur", "/api/musteriler?whatsapp=1"],
    example: { konsept: "coffee-shop", m2: 80 },
  });
}

/** POST /api/pfos?action=quote|calculate */
export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action")?.trim() || "quote";
  const { pfosPostCalculate, pfosPostQuote } = await import("@/lib/pfos/api-handlers");
  if (action === "calculate") return pfosPostCalculate(req);
  return pfosPostQuote(req);
}
