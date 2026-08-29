import { NextRequest, NextResponse } from "next/server";
import { pfosCreateTeklifSnapshot } from "@/lib/pfos-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projeRef, kalemler } = body;

    if (!kalemler) {
      return NextResponse.json({
        success: false,
        error: "Missing 'kalemler' field in request body."
      }, { status: 400 });
    }

    const snapshot = await pfosCreateTeklifSnapshot(projeRef || null, kalemler);

    return NextResponse.json({
      success: true,
      snapshotId: snapshot.id
    }, { status: 201 });
  } catch (error: any) {
    console.error("PFOS teklif-snapshot API error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to create teklif snapshot"
    }, { status: 500 });
  }
}
