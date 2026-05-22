import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import {
  musteriToAdmin,
  normalizeAdminMusteriPayload,
  normalizeMusteriPayload,
  validatePublicMusteriPayload,
} from "@/lib/musteri";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id?: string[] }> };

async function resolveId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  if (!id?.length) return null;
  return id.join("/");
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const segment = await resolveId(ctx);
  if (segment) {
    return adminErr("Tek müşteri GET desteklenmiyor", 405);
  }

  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const rows = await db.musteri.findMany({
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    return adminOk({ data: rows.map(musteriToAdmin), count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Liste alınamadı";
    return adminErr(msg, 503);
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const segment = await resolveId(ctx);
  if (segment) return adminErr("POST yalnızca /api/musteriler", 400);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const data = normalizeMusteriPayload(body);
  const err = validatePublicMusteriPayload(data);
  if (err) return adminErr(err, 400);

  try {
    const row = await db.musteri.create({ data });
    return adminOk({ data: musteriToAdmin(row) }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(`Müşteri kaydı yapılamadı: ${msg}`, 503);
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const id = await resolveId(ctx);
  if (!id) return adminErr("Müşteri id gerekli", 400);

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

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const id = await resolveId(ctx);
  if (!id) return adminErr("Müşteri id gerekli", 400);

  try {
    await db.musteri.delete({ where: { id } });
    return adminOk({ deleted: id });
  } catch {
    return adminErr("Müşteri bulunamadı", 404);
  }
}
