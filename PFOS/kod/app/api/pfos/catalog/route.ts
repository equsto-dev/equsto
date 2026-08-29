import { NextRequest, NextResponse } from "next/server";
import { pfosGetDbCatalog } from "@/lib/pfos-db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const brand = req.nextUrl.searchParams.get("brand") || undefined;
    const products = await pfosGetDbCatalog(brand);

    return NextResponse.json({
      version: 1,
      updatedAt: new Date().toISOString(),
      products
    }, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600"
      }
    });
  } catch (error: any) {
    console.error("PFOS catalog API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to load catalog"
    }, { status: 500 });
  }
}
