import { NextRequest, NextResponse } from "next/server";
import { pfosResolveKeys } from "@/lib/pfos-db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const konseptSlug = req.nextUrl.searchParams.get("konseptSlug") || "*";
    const keysStr = req.nextUrl.searchParams.get("keys") || "";
    
    if (!keysStr) {
      return NextResponse.json({
        success: false,
        error: "Missing 'keys' search parameter."
      }, { status: 400 });
    }

    const keys = keysStr.split(",").map(k => k.trim()).filter(Boolean);
    const resolved = await pfosResolveKeys(konseptSlug, keys);

    return NextResponse.json({
      success: true,
      resolved
    }, { status: 200 });
  } catch (error: any) {
    console.error("PFOS resolve API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to resolve keys"
    }, { status: 500 });
  }
}
