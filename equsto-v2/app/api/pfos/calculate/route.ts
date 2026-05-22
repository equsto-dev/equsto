import { NextRequest, NextResponse } from "next/server";
import { calculateQuote, PFOS_CONCEPT_BY_SLUG } from "@/lib/pfos/core";
import {
  PFOSRequestSchema,
  type FiyatStratejisi,
} from "@/lib/pfos/schemas/pfos.schema";

export const runtime = "nodejs";

const FIYAT_STR: FiyatStratejisi[] = ["ekonomik", "orta", "premium"];

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  let pfosReq;
  try {
    pfosReq = PFOSRequestSchema.parse({
      ...body,
      konsept: String(body.konsept || "").trim(),
      m2: Number(body.m2),
      sehir: body.sehir != null ? String(body.sehir) : undefined,
      fiyatStratejisi: body.fiyatStratejisi ?? "orta",
    });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const template = PFOS_CONCEPT_BY_SLUG[pfosReq.konsept];
  if (!template) {
    return NextResponse.json(
      {
        error: "Bilinmeyen konsept",
        konseptler: Object.keys(PFOS_CONCEPT_BY_SLUG),
      },
      { status: 404 },
    );
  }

  try {
    const data = await calculateQuote(pfosReq, template);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Hesaplama hatası";
    console.error("[POST /api/pfos/calculate]", e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
