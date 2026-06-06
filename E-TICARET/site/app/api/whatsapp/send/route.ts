import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import {
  sendWhatsAppTemplate,
  sendWhatsAppText,
  whatsAppMode,
  whatsAppSendConfigured,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type SendBody = {
  to?: string;
  text?: string;
  template?: string;
  language?: string;
  components?: unknown[];
};

/**
 * Bearer ile WhatsApp mesajı gönder (green-api veya meta modu)
 * POST /api/whatsapp/send
 */
export async function POST(req: NextRequest) {
  const denied = assertAdminBearer(req);
  if (denied) return denied;

  const mode = whatsAppMode();
  if (mode === "link") {
    return adminErr(
      "link modu: sunucu gönderimi kapalı. GET /api/whatsapp/link veya EQUSTO_WHATSAPP_MODE=green-api",
      503
    );
  }

  if (!whatsAppSendConfigured()) {
    return adminErr(`WhatsApp (${mode}) yapılandırılmamış`, 503);
  }

  const body = (await req.json().catch(() => ({}))) as SendBody;
  const to = String(body.to || "").trim();
  if (!to) return adminErr("to (E.164) gerekli", 400);

  if (body.template) {
    const result = await sendWhatsAppTemplate(
      to,
      body.template,
      body.language || "tr",
      body.components
    );
    if (!result.ok) return adminErr(result.error || "Gönderilemedi", result.status || 502);
    return adminOk({ messageId: result.messageId, type: "template", mode });
  }

  const text = String(body.text || "").trim();
  if (!text) return adminErr("text veya template gerekli", 400);

  const result = await sendWhatsAppText(to, text);
  if (!result.ok) return adminErr(result.error || "Gönderilemedi", result.status || 502);
  return adminOk({ messageId: result.messageId, type: "text", mode });
}
