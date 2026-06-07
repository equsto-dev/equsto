import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import {
  createTeklif,
  isTeklifDurum,
  teklifToAdmin,
} from "@/lib/teklif";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      const row = await db.teklif.findUnique({ where: { id: segments[0] } });
      if (!row) return adminErr("Teklif bulunamadı", 404);
      return adminOk({ data: teklifToAdmin(row) });
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
    const rows = await db.teklif.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return adminOk({ data: rows.map(teklifToAdmin), count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Liste alınamadı";
    return adminErr(msg, 503);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const segments = await resolveSegments(ctx);
  if (segments.length > 0) return adminErr("POST yalnızca /api/teklifler", 400);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const result = await createTeklif(body);
    return adminOk(
      {
        data: result.teklif,
        customer_email: result.customerEmail,
        customer_whatsapp: result.customerWhatsApp,
        gonderim_kanali: String(body.gonderim_kanali ?? body.kanal ?? "email"),
      },
      201,
    );
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
    return adminErr("PATCH /api/teklifler/:id/durum gerekli", 400);
  }

  const id = segments[0];
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const durum = String(body.durum ?? "").trim();
  if (!isTeklifDurum(durum)) {
    return adminErr("Geçersiz durum", 400);
  }

  try {
    const row = await db.teklif.update({
      where: { id },
      data: { durum },
    });
    return adminOk({ data: teklifToAdmin(row) });
  } catch {
    return adminErr("Teklif bulunamadı", 404);
  }
}
