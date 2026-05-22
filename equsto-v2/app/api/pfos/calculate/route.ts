import { NextRequest, NextResponse } from "next/server";
import { calculateQuote, PFOS_CONCEPT_BY_SLUG } from "@/lib/pfos/core";
import type { FiyatStratejisi, PFOSRequest } from "@/lib/pfos/schemas/pfos.schema";

export const runtime = "nodejs";

const FIYAT_STR: FiyatStratejisi[] = ["ekonomik", "orta", "premium"];

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  const konsept = String(body.konsept || "").trim();
  const m2 = Number(body.m2);
  if (!konsept) {
    return NextResponse.json({ error: "konsept zorunlu" }, { status: 400 });
  }
  if (!Number.isFinite(m2) || m2 <= 0) {
    return NextResponse.json({ error: "m2 pozitif sayı olmalı" }, { status: 400 });
  }

  const template = PFOS_CONCEPT_BY_SLUG[konsept];
  if (!template) {
    return NextResponse.json(
      {
        error: "Bilinmeyen konsept",
        konseptler: Object.keys(PFOS_CONCEPT_BY_SLUG),
      },
      { status: 404 },
    );
  }

  const fsRaw = String(body.fiyatStratejisi || "orta").trim() as FiyatStratejisi;
  const fiyatStratejisi = FIYAT_STR.includes(fsRaw) ? fsRaw : "orta";

  const pfosReq: PFOSRequest = {
    konsept,
    m2,
    fiyatStratejisi,
    sehir: body.sehir != null ? String(body.sehir) : undefined,
  };

  try {
    const data = await calculateQuote(pfosReq, template);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Hesaplama hatası";
    console.error("[POST /api/pfos/calculate]", e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
