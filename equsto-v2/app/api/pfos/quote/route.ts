import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { PFOSRequestSchema } from "@/lib/pfos/schemas/pfos.schema";
import { getTemplate } from "@/lib/pfos/core/templates";
import { calculateQuote } from "@/lib/pfos/core/calculator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = PFOSRequestSchema.parse(body);
    const template = getTemplate(input.konsept);
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
    console.error("[PFOS /quote]", err);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
