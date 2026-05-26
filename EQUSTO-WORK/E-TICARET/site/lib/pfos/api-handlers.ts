import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { calculateQuote, PFOS_CONCEPT_BY_SLUG } from "@/lib/pfos/core";
import { getAllTemplates, getTemplate, resolveTemplateForQuote } from "@/lib/pfos/core/templates";
import {
  PFOSRequestSchema,
  KONSEPT_LABELS,
  type Konsept,
} from "@/lib/pfos/schemas/pfos.schema";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";

const M2_RANGES: Record<string, { min: number; max: number }> = {
  "all-day-dining-cafe": { min: 150, max: 400 },
  "kebap-ortadogu": { min: 200, max: 300 },
  pizzaci: { min: 80, max: 300 },
  meyhane: { min: 100, max: 500 },
  "turk-restoran": { min: 100, max: 500 },
  "coffee-shop": { min: 60, max: 300 },
  steakhouse: { min: 80, max: 250 },
  balikci: { min: 80, max: 250 },
};

export function pfosGetConcepts() {
  const templates = getAllTemplates();
  const base = templates.map((t) => ({
    konsept: t.konsept,
    label: KONSEPT_LABELS[t.konsept as Konsept] ?? t.label,
    ornekler: t.ornekler,
    m2Min: M2_RANGES[t.konsept]?.min ?? 60,
    m2Max: M2_RANGES[t.konsept]?.max ?? 500,
    itemSayisi: t.items.length,
    zorunluSayisi: t.items.filter((i) => i.tip === "zorunlu").length,
  }));
  const referansJson = [
    {
      konsept: "steakhouse",
      label: KONSEPT_LABELS.steakhouse,
      ornekler: ["Nusr-Et tarzı", "Mangal / steak"],
      m2Min: M2_RANGES.steakhouse.min,
      m2Max: M2_RANGES.steakhouse.max,
      itemSayisi: 58,
      zorunluSayisi: 58,
    },
    {
      konsept: "balikci",
      label: KONSEPT_LABELS.balikci,
      ornekler: ["Balık restoran", "Deniz ürünleri"],
      m2Min: M2_RANGES.balikci.min,
      m2Max: M2_RANGES.balikci.max,
      itemSayisi: 47,
      zorunluSayisi: 47,
    },
    {
      konsept: "coffee-shop",
      label: KONSEPT_LABELS["coffee-shop"],
      ornekler: ["Espressolab", "Gloria Jean's"],
      m2Min: M2_RANGES["coffee-shop"].min,
      m2Max: M2_RANGES["coffee-shop"].max,
      itemSayisi: 24,
      zorunluSayisi: 24,
    },
  ];
  return [...base.filter((t) => t.konsept !== "coffee-shop"), ...referansJson];
}

export function pfosGetKonseptler() {
  const templates = getAllTemplates();
  const base = templates.map((t) => ({
    slug: t.konsept,
    label: KONSEPT_LABELS[t.konsept as Konsept] ?? t.label,
    ornekler: t.ornekler,
    seatDensity: t.seatDensity,
    kalemSayisi: t.items.length,
  }));
  return [
    ...base.filter((t) => t.slug !== "coffee-shop"),
    {
      slug: "steakhouse",
      label: KONSEPT_LABELS.steakhouse,
      ornekler: ["Nusr-Et tarzı"],
      seatDensity: 1.8,
      kalemSayisi: 58,
    },
    {
      slug: "balikci",
      label: KONSEPT_LABELS.balikci,
      ornekler: ["Balık restoran"],
      seatDensity: 1.5,
      kalemSayisi: 47,
    },
    {
      slug: "coffee-shop",
      label: KONSEPT_LABELS["coffee-shop"],
      ornekler: ["Espressolab", "Gloria Jean's"],
      seatDensity: 1.5,
      kalemSayisi: 24,
    },
  ];
}

export async function pfosPostQuote(req: NextRequest) {
  try {
    const body = await req.json();
    const input = PFOSRequestSchema.parse(body);
    const template = await resolveTemplateForQuote(
      input.konsept,
      input.m2,
      input.altTip,
    );
    const response = await calculateQuote(input, template);
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Geçersiz istek", details: err.flatten() },
        { status: 400 },
      );
    }
    if (err instanceof Error && err.message.startsWith("Bilinmeyen konsept")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[PFOS quote]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

export async function pfosPostCalculate(req: NextRequest) {
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
      fiyatStratejisi: body.fiyatStratejisi ?? TEKLIF_DEFAULT_FIYAT_STRATEJISI,
    });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek gövdesi" }, { status: 400 });
  }

  const staticTpl = PFOS_CONCEPT_BY_SLUG[pfosReq.konsept];
  if (!staticTpl && !["steakhouse", "balikci"].includes(pfosReq.konsept)) {
    return NextResponse.json(
      {
        error: "Bilinmeyen konsept",
        konseptler: [
          ...Object.keys(PFOS_CONCEPT_BY_SLUG),
          "steakhouse",
          "balikci",
        ],
      },
      { status: 404 },
    );
  }

  try {
    const template = await resolveTemplateForQuote(
      pfosReq.konsept as Konsept,
      pfosReq.m2,
    );
    const data = await calculateQuote(pfosReq, template);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Hesaplama hatası";
    console.error("[PFOS calculate]", e);
    return NextResponse.json({ error: msg }, { status: 503 });
  }
}
