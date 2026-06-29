import { NextRequest } from "next/server";
import { assertAdminBearer, readBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  getPfosFeedbackById,
  updatePfosFeedbackDurum,
} from "@/lib/pfos/feedback-log";
import {
  PFOS_FEEDBACK_DURUMLAR,
  type PfosFeedbackDurum,
} from "@/lib/pfos/feedback-types";

export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ id: string }> };

/** Admin — tek geri bildirim detayı */
export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(_req);
  if (denied) return denied;

  const { id } = await ctx.params;
  try {
    const data = await getPfosFeedbackById(id);
    if (!data) return adminErr("Geri bildirim bulunamadı", 404);
    return adminOk({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Detay alınamadı";
    return adminErr(msg, 503);
  }
}

/** Admin — durum güncelle (reviewed | dismissed) */
export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const durum = String(body.durum ?? "").trim() as PfosFeedbackDurum;

  if (!PFOS_FEEDBACK_DURUMLAR.includes(durum) || durum === "pending_review") {
    return adminErr("Geçersiz durum (reviewed | dismissed)", 400);
  }

  const reviewedBy =
    body.reviewedBy != null
      ? String(body.reviewedBy)
      : body.reviewed_by != null
        ? String(body.reviewed_by)
        : readBearer(req) || "admin";

  try {
    const row = await updatePfosFeedbackDurum(id, durum, reviewedBy);
    return adminOk({ data: row });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Güncellenemedi";
    return adminErr(msg, 503);
  }
}
