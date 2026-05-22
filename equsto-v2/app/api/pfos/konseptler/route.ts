import { NextResponse } from "next/server";
import { PFOS_CONCEPT_TEMPLATES } from "@/lib/pfos/core";
import { KONSEPT_LABELS, type Konsept } from "@/lib/pfos/schemas/pfos.schema";

export const runtime = "nodejs";

export async function GET() {
  const konseptler = PFOS_CONCEPT_TEMPLATES.map((t) => ({
    slug: t.konsept,
    label: KONSEPT_LABELS[t.konsept as Konsept] ?? t.label,
    ornekler: t.ornekler,
    seatDensity: t.seatDensity,
    kalemSayisi: t.items.length,
  }));

  return NextResponse.json({ success: true, konseptler });
}
