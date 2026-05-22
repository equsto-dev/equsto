import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** GET /api/pfos — keşif (404 yerine yönlendirme) */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PFOS API",
    endpoints: {
      konseptler: "GET /api/pfos/konseptler",
      calculate: "POST /api/pfos/calculate",
    },
    example: {
      calculate: {
        konsept: "pizzaci",
        m2: 180,
        fiyatStratejisi: "orta",
      },
    },
  });
}
