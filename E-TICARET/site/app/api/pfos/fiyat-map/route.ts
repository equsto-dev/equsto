import { NextRequest, NextResponse } from "next/server";
import { pfosGetFiyatMap } from "@/lib/pfos-db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const fiyatMap = await pfosGetFiyatMap();

    return NextResponse.json(fiyatMap, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600"
      }
    });
  } catch (error: any) {
    console.error("PFOS fiyat-map API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to load price map"
    }, { status: 500 });
  }
}
