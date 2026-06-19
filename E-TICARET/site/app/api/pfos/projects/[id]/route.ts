import { NextRequest, NextResponse } from "next/server";
import { loadPfosProjectDetail } from "@/lib/pfos/projects/load-project-detail";

export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ id: string }> };

/** GET /api/pfos/projects/[id] — pilot proje detayı (zone m² + dosyalar) */
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  try {
    const { id } = await ctx.params;
    const detail = await loadPfosProjectDetail(id);
    if (!detail) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }
    return NextResponse.json({ success: true, project: detail });
  } catch (e) {
    console.error("[PFOS project detail]", e);
    return NextResponse.json({ error: "Proje detayı yüklenemedi" }, { status: 500 });
  }
}
