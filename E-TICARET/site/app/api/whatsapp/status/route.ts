import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { notifyChannelsConfigured } from "@/lib/notify";
import {
  sendWhatsAppText,
  whatsAppEnvHints,
  whatsAppLinkReady,
  whatsAppMode,
  whatsAppNotifyTo,
  whatsAppSendConfigured,
  whatsAppWebhookConfigured,
  vitrinWhatsAppE164,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const mode = whatsAppMode();

  return adminOk({
    mode,
    linkReady: whatsAppLinkReady(),
    sendEnabled: whatsAppSendConfigured(),
    webhook: whatsAppWebhookConfigured(),
    vitrinNumber: vitrinWhatsAppE164(),
    notifyTo: whatsAppNotifyTo() || null,
    env: whatsAppEnvHints(),
    otherNotifyChannels: notifyChannelsConfigured(),
    endpoints: {
      link: "GET /api/whatsapp/link?text=…",
      webhook: "/api/whatsapp/webhook",
      send: "POST /api/whatsapp/send",
      test: "POST /api/whatsapp/status",
    },
    notes:
      mode === "link"
        ? "Varsayılan: wa.me + kedi sohbet. Sunucu gönderimi için GREEN_API veya Telegram kullanın."
        : mode === "green-api"
          ? "Green API — telefonunuzdan QR tarayın (Facebook gerekmez)."
          : "Meta Cloud API — Facebook Developer hesabı gerekir.",
  });
}

/** POST — test mesajı (WHATSAPP_NOTIFY_TO veya body.to) */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const mode = whatsAppMode();
  if (mode === "link") {
    return adminErr(
      "link modunda sunucu gönderimi yok. GET /api/whatsapp/link veya EQUSTO_WHATSAPP_MODE=green-api",
      503
    );
  }

  if (!whatsAppSendConfigured()) {
    return adminErr(`WhatsApp (${mode}) yapılandırılmamış`, 503);
  }

  const body = (await req.json().catch(() => ({}))) as { to?: string; text?: string };
  const to = String(body.to || whatsAppNotifyTo() || "").trim();
  if (!to) {
    return adminErr("WHATSAPP_NOTIFY_TO veya body.to gerekli", 400);
  }

  const text =
    String(body.text || "").trim() ||
    `Equsto WhatsApp test (${mode}) — bağlantı OK.`;

  const result = await sendWhatsAppText(to, text);
  if (!result.ok) return adminErr(result.error || "Test gönderilemedi", 502);
  return adminOk({ messageId: result.messageId, to, mode });
}
