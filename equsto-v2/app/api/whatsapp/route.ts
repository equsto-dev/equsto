import { NextRequest } from "next/server";
import { adminErr, adminOk } from "@/lib/admin-response";
import { db } from "@/lib/db";
import {
  musteriToAdmin,
  normalizeMusteriPayload,
  validatePublicMusteriPayload,
} from "@/lib/musteri";

export const dynamic = "force-dynamic";

const DEFAULT_PHONE = process.env.EQUSTO_WHATSAPP_E164?.trim() || "905326842608";

/**
 * GET /api/whatsapp — numara + ön metin (contact.js uyumlu)
 * POST /api/whatsapp — mesaj lead kaydı (/api/musteriler ile aynı)
 */
export async function GET() {
  return adminOk({
    phone: DEFAULT_PHONE,
    e164: DEFAULT_PHONE,
    prefill: "Merhaba, equsto.com üzerinden yazıyorum.",
    label: "EQUSTO WhatsApp",
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const merged = {
    ...body,
    kaynak: body.kaynak ?? "whatsapp-api",
  };
  const data = normalizeMusteriPayload(merged);
  const err = validatePublicMusteriPayload(data);
  if (err) return adminErr(err, 400);

  try {
    const row = await db.musteri.create({ data });
    return adminOk({ success: true, data: musteriToAdmin(row) }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kayıt başarısız";
    return adminErr(msg, 503);
  }
}
