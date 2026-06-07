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
import { notifyCustomerLeadAck, notifyNewLead } from "@/lib/notify";
import { requireMemberSession, type MemberSessionPayload } from "@/lib/member-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id?: string[] }> };

async function resolveId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  if (!id?.length) return null;
  return id.join("/");
}

const DEFAULT_WHATSAPP =
  process.env.EQUSTO_WHATSAPP_E164?.trim() || "905326840152";

export async function GET(req: NextRequest, ctx: Ctx) {
  const segment = await resolveId(ctx);
  if (req.nextUrl.searchParams.get("whatsapp") === "1") {
    return adminOk({
      phone: DEFAULT_WHATSAPP,
      e164: DEFAULT_WHATSAPP,
      prefill: "Merhaba, equsto.com üzerinden yazıyorum.",
      label: "EQUSTO WhatsApp",
    });
  }

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
  const kaynak = String(body.kaynak ?? "").trim();
  let memberSession: { session: MemberSessionPayload } | null = null;
  if (kaynak === "whatsapp-modal") {
    const check = await requireMemberSession(req, body);
    if (check instanceof Response) return check;
    memberSession = check;
  }
  const data = normalizeMusteriPayload(body);
  if (memberSession) {
    const u = memberSession.session.user;
    if (!data.tel && u.telefon) data.tel = u.telefon.trim();
    if (!data.mail && u.email) data.mail = u.email.trim();
    if ((!data.yetkili || data.yetkili === "Ziyaretçi") && u.name) {
      data.yetkili = u.name.trim();
    }
  }
  const err = validatePublicMusteriPayload(data);
  if (err) return adminErr(err, 400);

  try {
    const row = await db.musteri.create({ data });
    void notifyNewLead(row).catch((e) => {
      console.error("[notify] lead", e);
    });
    if (kaynak === "whatsapp-modal") {
      void notifyCustomerLeadAck(row).catch((e) => {
        console.error("[notify] customer wa ack", e);
      });
    }
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
