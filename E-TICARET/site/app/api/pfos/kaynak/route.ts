import { NextResponse } from "next/server";
import { PFOS_KONSEPT_SHOP_TYPES } from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { DEFAULT_WIZARD_QUESTIONS } from "@/lib/pfos/proje-akis/wizard-questions";

export const runtime = "nodejs";

/** Kanonik konsept + soru seti v3 — admin Proje Akışı (A) birleştirme/yükleme */
export async function GET() {
  return NextResponse.json({
    success: true,
    shopTypes: PFOS_KONSEPT_SHOP_TYPES,
    questions: DEFAULT_WIZARD_QUESTIONS,
    meta: {
      konseptCount: PFOS_KONSEPT_SHOP_TYPES.length,
      soruCount: DEFAULT_WIZARD_QUESTIONS.length,
      version: "v3",
    },
  });
}
