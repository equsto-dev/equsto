import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import { incrementKuponUsage } from "@/lib/kupon";
import {
  createSiparis,
  isSiparisDurum,
  siparisToAdmin,
} from "@/lib/siparis";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id?: string[] }> };

async function resolveSegments(ctx: Ctx): Promise<string[]> {
  const { id } = await ctx.params;
  return id ?? [];
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const segments = await resolveSegments(ctx);

  if (segments.length === 1) {
    const denied = assertAdminBearer(req);
    if (denied) return denied;
    try {
      const row = await db.siparis.findUnique({ where: { id: segments[0] } });
      if (!row) return adminErr("Sipariş bulunamadı", 404);
      return adminOk({ data: siparisToAdmin(row) });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Detay alınamadı";
      return adminErr(msg, 503);
    }
  }

  if (segments.length > 0) {
    return adminErr("Geçersiz yol", 404);
  }

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const rows = await db.siparis.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return adminOk({ data: rows.map(siparisToAdmin), count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Liste alınamadı";
    return adminErr(msg, 503);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const segments = await resolveSegments(ctx);
  if (segments.length > 0) return adminErr("POST yalnızca /api/siparisler", 400);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const row = await createSiparis(body);
    const kupon = String(body.kupon_kod ?? "").trim();
    if (kupon) {
      await incrementKuponUsage(kupon).catch(() => {});
    }
    return adminOk({ data: row }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(msg, 400);
  }
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const segments = await resolveSegments(ctx);
  if (segments.length !== 2 || segments[1] !== "durum") {
    return adminErr("PATCH /api/siparisler/:id/durum gerekli", 400);
  }

  const id = segments[0];
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const durum = String(body.durum ?? "").trim();
  if (!isSiparisDurum(durum)) {
    return adminErr("Geçersiz durum", 400);
  }

  try {
    const row = await db.siparis.update({
      where: { id },
      data: { durum },
    });
    return adminOk({ data: siparisToAdmin(row) });
  } catch {
    return adminErr("Sipariş bulunamadı", 404);
  }
}
