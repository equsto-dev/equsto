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
  "kebap-ortadogu": { min: 300, max: 500 },
  pizzaci: { min: 80, max: 500 },
  meyhane: { min: 100, max: 500 },
  "turk-restoran": { min: 100, max: 500 },
  "coffee-shop": { min: 60, max: 300 },
  steakhouse: { min: 80, max: 250 },
  balikci: { min: 80, max: 250 },
  italyan: { min: 100, max: 300 },
  birahane: { min: 100, max: 300 },
  pastane: { min: 100, max: 200 },
  pideci: { min: 100, max: 250 },
  sushi: { min: 40, max: 100 },
  "sarkuteri-kiosk": { min: 25, max: 80 },
  "hamburger-kiosk": { min: 60, max: 100 },
  "hotdog-kiosk": { min: 25, max: 60 },
  tavukcu: { min: 80, max: 150 },
  restoran: { min: 500, max: 1000 },
  "kokteyl-kahve": { min: 30, max: 50 },
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
    {
      konsept: "italyan",
      label: KONSEPT_LABELS.italyan,
      ornekler: ["Trattoria", "Osteria"],
      m2Min: M2_RANGES.italyan.min,
      m2Max: M2_RANGES.italyan.max,
      itemSayisi: 89,
      zorunluSayisi: 89,
    },
    {
      konsept: "all-day-dining-cafe",
      label: KONSEPT_LABELS["all-day-dining-cafe"],
      ornekler: ["The House Café", "Big Chefs"],
      m2Min: M2_RANGES["all-day-dining-cafe"].min,
      m2Max: M2_RANGES["all-day-dining-cafe"].max,
      itemSayisi: 89,
      zorunluSayisi: 89,
    },
    {
      konsept: "birahane",
      label: KONSEPT_LABELS.birahane,
      ornekler: ["Mikro birahane", "Craft beer pub"],
      m2Min: M2_RANGES.birahane.min,
      m2Max: M2_RANGES.birahane.max,
      itemSayisi: 27,
      zorunluSayisi: 27,
    },
    {
      konsept: "pastane",
      label: KONSEPT_LABELS.pastane,
      ornekler: ["Butik pastane", "Patisserie"],
      m2Min: M2_RANGES.pastane.min,
      m2Max: M2_RANGES.pastane.max,
      itemSayisi: 43,
      zorunluSayisi: 43,
    },
    {
      konsept: "pizzaci",
      label: KONSEPT_LABELS.pizzaci,
      ornekler: ["Mialiento Avcılar", "Pizza Il Forno"],
      m2Min: M2_RANGES.pizzaci.min,
      m2Max: M2_RANGES.pizzaci.max,
      itemSayisi: 69,
      zorunluSayisi: 69,
    },
    {
      konsept: "pideci",
      label: KONSEPT_LABELS.pideci,
      ornekler: ["Lahmacun & pide salonu", "Taş fırın pideci"],
      m2Min: M2_RANGES.pideci.min,
      m2Max: M2_RANGES.pideci.max,
      itemSayisi: 50,
      zorunluSayisi: 50,
    },
    {
      konsept: "sushi",
      label: KONSEPT_LABELS.sushi,
      ornekler: ["Sushi bar", "Omakase"],
      m2Min: M2_RANGES.sushi.min,
      m2Max: M2_RANGES.sushi.max,
      itemSayisi: 27,
      zorunluSayisi: 27,
    },
    {
      konsept: "sarkuteri-kiosk",
      label: KONSEPT_LABELS["sarkuteri-kiosk"],
      ornekler: ["Gurme şarküteri kiosk", "AVM şarküteri"],
      m2Min: M2_RANGES["sarkuteri-kiosk"].min,
      m2Max: M2_RANGES["sarkuteri-kiosk"].max,
      itemSayisi: 23,
      zorunluSayisi: 23,
    },
    {
      konsept: "hamburger-kiosk",
      label: KONSEPT_LABELS["hamburger-kiosk"],
      ornekler: ["QSR burger kiosk", "AVM hamburger"],
      m2Min: M2_RANGES["hamburger-kiosk"].min,
      m2Max: M2_RANGES["hamburger-kiosk"].max,
      itemSayisi: 22,
      zorunluSayisi: 22,
    },
    {
      konsept: "hotdog-kiosk",
      label: KONSEPT_LABELS["hotdog-kiosk"],
      ornekler: ["Sosisli kiosk", "AVM hot dog"],
      m2Min: M2_RANGES["hotdog-kiosk"].min,
      m2Max: M2_RANGES["hotdog-kiosk"].max,
      itemSayisi: 16,
      zorunluSayisi: 16,
    },
    {
      konsept: "tavukcu",
      label: KONSEPT_LABELS.tavukcu,
      ornekler: ["Pilic çevirme", "Fried chicken salonu"],
      m2Min: M2_RANGES.tavukcu.min,
      m2Max: M2_RANGES.tavukcu.max,
      itemSayisi: 28,
      zorunluSayisi: 28,
    },
    {
      konsept: "restoran",
      label: KONSEPT_LABELS.restoran,
      ornekler: [
        "Büyük yemek rezervasyonları",
        "Düğün & özel organizasyon",
        "Eğlence & etkinlik",
      ],
      m2Min: M2_RANGES.restoran.min,
      m2Max: M2_RANGES.restoran.max,
      itemSayisi: 110,
      zorunluSayisi: 110,
    },
    {
      konsept: "kokteyl-kahve",
      label: KONSEPT_LABELS["kokteyl-kahve"],
      ornekler: ["No Fish Today", "Kokteyl & espresso bar"],
      m2Min: M2_RANGES["kokteyl-kahve"].min,
      m2Max: M2_RANGES["kokteyl-kahve"].max,
      itemSayisi: 18,
      zorunluSayisi: 18,
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
    {
      slug: "italyan",
      label: KONSEPT_LABELS.italyan,
      ornekler: ["Trattoria", "Osteria"],
      seatDensity: 1.6,
      kalemSayisi: 89,
    },
    {
      slug: "all-day-dining-cafe",
      label: KONSEPT_LABELS["all-day-dining-cafe"],
      ornekler: ["The House Café", "Big Chefs"],
      seatDensity: 1.5,
      kalemSayisi: 89,
    },
    {
      slug: "birahane",
      label: KONSEPT_LABELS.birahane,
      ornekler: ["Mikro birahane", "Craft beer pub"],
      seatDensity: 1.5,
      kalemSayisi: 27,
    },
    {
      slug: "pastane",
      label: KONSEPT_LABELS.pastane,
      ornekler: ["Butik pastane", "Patisserie"],
      seatDensity: 1.4,
      kalemSayisi: 43,
    },
    {
      slug: "pizzaci",
      label: KONSEPT_LABELS.pizzaci,
      ornekler: ["Mialiento Avcılar", "Pizza Il Forno"],
      seatDensity: 1.5,
      kalemSayisi: 69,
    },
    {
      slug: "pideci",
      label: KONSEPT_LABELS.pideci,
      ornekler: ["Lahmacun & pide salonu", "Taş fırın pideci"],
      seatDensity: 1.5,
      kalemSayisi: 50,
    },
    {
      slug: "sushi",
      label: KONSEPT_LABELS.sushi,
      ornekler: ["Sushi bar", "Omakase"],
      seatDensity: 1.8,
      kalemSayisi: 27,
    },
    {
      slug: "sarkuteri-kiosk",
      label: KONSEPT_LABELS["sarkuteri-kiosk"],
      ornekler: ["Gurme şarküteri kiosk", "AVM şarküteri"],
      seatDensity: 0,
      kalemSayisi: 23,
    },
    {
      slug: "hamburger-kiosk",
      label: KONSEPT_LABELS["hamburger-kiosk"],
      ornekler: ["QSR burger kiosk", "AVM hamburger"],
      seatDensity: 0,
      kalemSayisi: 22,
    },
    {
      slug: "hotdog-kiosk",
      label: KONSEPT_LABELS["hotdog-kiosk"],
      ornekler: ["Sosisli kiosk", "AVM hot dog"],
      seatDensity: 0,
      kalemSayisi: 16,
    },
    {
      slug: "tavukcu",
      label: KONSEPT_LABELS.tavukcu,
      ornekler: ["Pilic çevirme", "Fried chicken salonu"],
      seatDensity: 1.6,
      kalemSayisi: 28,
    },
    {
      slug: "restoran",
      label: KONSEPT_LABELS.restoran,
      ornekler: [
        "Büyük yemek rezervasyonları",
        "Düğün & özel organizasyon",
        "Eğlence & etkinlik",
      ],
      seatDensity: 1.2,
      kalemSayisi: 110,
    },
    {
      slug: "kokteyl-kahve",
      label: KONSEPT_LABELS["kokteyl-kahve"],
      ornekler: ["No Fish Today", "Kokteyl & espresso bar"],
      seatDensity: 0,
      kalemSayisi: 18,
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
  if (
    !staticTpl &&
    ![
      "steakhouse",
      "balikci",
      "italyan",
      "birahane",
      "pastane",
      "pizzaci",
      "pideci",
      "sushi",
      "sarkuteri-kiosk",
      "hamburger-kiosk",
      "hotdog-kiosk",
      "tavukcu",
      "all-day-dining-cafe",
      "restoran",
      "kokteyl-kahve",
      "coffee-shop",
    ].includes(pfosReq.konsept)
  ) {
    return NextResponse.json(
      {
        error: "Bilinmeyen konsept",
        konseptler: [
          ...Object.keys(PFOS_CONCEPT_BY_SLUG),
          "steakhouse",
          "balikci",
          "italyan",
          "birahane",
          "pastane",
          "pizzaci",
          "pideci",
          "sushi",
          "sarkuteri-kiosk",
          "hamburger-kiosk",
          "hotdog-kiosk",
          "tavukcu",
          "all-day-dining-cafe",
          "restoran",
          "kokteyl-kahve",
          "coffee-shop",
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
