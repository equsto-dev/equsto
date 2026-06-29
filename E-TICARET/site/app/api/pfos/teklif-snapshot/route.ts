import { NextRequest, NextResponse } from "next/server";
import { pfosCreateTeklifSnapshot } from "@/lib/pfos-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projeRef,
      kalemler,
      konsept,
      referansId,
      referansListeKey,
      referans_liste_key,
      m2,
      guvenSkoru,
      guven_skoru,
      requestJson,
      request_json,
    } = body;

    if (!kalemler) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing 'kalemler' field in request body.",
        },
        { status: 400 },
      );
    }

    const snapshot = await pfosCreateTeklifSnapshot(projeRef || null, kalemler, {
      konsept: konsept != null ? String(konsept) : null,
      referansId: referansId != null ? String(referansId) : null,
      referansListeKey:
        referansListeKey != null
          ? String(referansListeKey)
          : referans_liste_key != null
            ? String(referans_liste_key)
            : null,
      m2: m2 != null ? Number(m2) : null,
      guvenSkoru:
        guvenSkoru != null
          ? Number(guvenSkoru)
          : guven_skoru != null
            ? Number(guven_skoru)
            : null,
      requestJson: requestJson ?? request_json ?? null,
    });

    return NextResponse.json(
      {
        success: true,
        snapshotId: snapshot.id,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("PFOS teklif-snapshot API error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create teklif snapshot";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
