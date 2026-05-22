import { NextResponse } from "next/server";
import { getAllTemplates } from "@/lib/pfos/core/templates";
import { KONSEPT_LABELS } from "@/lib/pfos/schemas/pfos.schema";

export const runtime = "nodejs";

const M2_RANGES: Record<string, { min: number; max: number }> = {
  "all-day-dining-cafe": { min: 200, max: 400 },
  "kebap-ortadogu": { min: 200, max: 300 },
  pizzaci: { min: 80, max: 300 },
  meyhane: { min: 100, max: 500 },
  "turk-restoran": { min: 100, max: 500 },
  "coffee-shop": { min: 60, max: 300 },
};

export async function GET() {
  const templates = getAllTemplates();
  const concepts = templates.map((t) => ({
    konsept: t.konsept,
    label: KONSEPT_LABELS[t.konsept as keyof typeof KONSEPT_LABELS] ?? t.label,
    ornekler: t.ornekler,
    m2Min: M2_RANGES[t.konsept]?.min ?? 60,
    m2Max: M2_RANGES[t.konsept]?.max ?? 500,
    itemSayisi: t.items.length,
    zorunluSayisi: t.items.filter((i) => i.tip === "zorunlu").length,
  }));
  return NextResponse.json(concepts, { status: 200 });
}
