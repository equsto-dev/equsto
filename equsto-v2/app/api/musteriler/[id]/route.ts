import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import { musteriToAdmin, normalizeAdminMusteriPayload } from "@/lib/musteri";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data = normalizeAdminMusteriPayload(body);
  if (!data.firma && !data.yetkili) {
    return adminErr("Firma veya yetkili adı zorunlu", 400);
  }

  try {
    const row = await db.musteri.update({ where: { id }, data });
    return adminOk({ data: musteriToAdmin(row) });
  } catch {
    return adminErr("Müşteri bulunamadı", 404);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  try {
    await db.musteri.delete({ where: { id } });
    return adminOk({ deleted: id });
  } catch {
    return adminErr("Müşteri bulunamadı", 404);
  }
}
