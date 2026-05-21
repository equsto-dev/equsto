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

/** GET /api/musteriler — admin listesi */
export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  try {
    const rows = await db.musteri.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
    return adminOk({ data: rows.map(musteriToAdmin), count: rows.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Liste alınamadı";
    return adminErr(msg, 503);
  }
}

/**
 * POST /api/musteriler — WhatsApp kartı / iletişim (auth yok)
 * contact.js: kaynak whatsapp-modal | iletisim-fab
 */
export async function POST(req: NextRequest) {
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
