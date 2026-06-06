import { NextRequest } from "next/server";
import { adminOk } from "@/lib/admin-response";
import {
  buildWhatsAppLink,
  vitrinWhatsAppE164,
  whatsAppLinkReady,
  whatsAppMode,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const DEFAULT_PREFILL = "Merhaba, equsto.com üzerinden yazıyorum.";

/**
 * wa.me / web.whatsapp.com linki — Facebook gerekmez
 * GET /api/whatsapp/link?text=…&target=app|web
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const text = sp.get("text")?.trim() || DEFAULT_PREFILL;
  const target = sp.get("target") === "web" ? "web" : "app";
  const phone = sp.get("phone")?.trim() || vitrinWhatsAppE164();

  if (!whatsAppLinkReady() && !phone) {
    return Response.json(
      { ok: false, error: "WhatsApp vitrin numarası yapılandırılmamış" },
      { status: 503 }
    );
  }

  const link = buildWhatsAppLink(text, target, phone);

  return adminOk({
    mode: whatsAppMode(),
    ...link,
    prefill: text,
    label: "EQUSTO WhatsApp",
    hint: "Sunucu gönderimi için EQUSTO_WHATSAPP_MODE=green-api (QR) veya Telegram/e-posta bildirimleri kullanın.",
  });
}
