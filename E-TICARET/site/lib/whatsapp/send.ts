import { greenApiConfigured, whatsAppMode } from "./config";
import { sendGreenApiFile, sendGreenApiText } from "./green-api";
import {
  sendWhatsAppDocument as sendMetaDocument,
  sendWhatsAppTemplate as sendMetaTemplate,
  sendWhatsAppText as sendMetaText,
  whatsAppMetaConfigured,
  type WaSendResult,
} from "./meta-client";

export type { WaSendResult };

/** Sunucudan WhatsApp mesajı gönderebilir mi (Green API veya Meta) */
export function whatsAppSendConfigured(): boolean {
  const mode = whatsAppMode();
  if (mode === "green-api") return greenApiConfigured();
  if (mode === "meta") return whatsAppMetaConfigured();
  return false;
}

/** Moda göre metin mesajı gönder */
export async function sendWhatsAppText(
  to: string,
  body: string
): Promise<WaSendResult> {
  const mode = whatsAppMode();
  if (mode === "green-api") return sendGreenApiText(to, body);
  if (mode === "meta") return sendMetaText(to, body);
  return {
    ok: false,
    error:
      "Sunucu tarafı WhatsApp kapalı (EQUSTO_WHATSAPP_MODE=link). wa.me linki veya kedi sohbet kullanın.",
  };
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode = "tr",
  components?: unknown[]
): Promise<WaSendResult> {
  const mode = whatsAppMode();
  if (mode === "meta") {
    return sendMetaTemplate(to, templateName, languageCode, components);
  }
  return {
    ok: false,
    error: "Şablon mesajları yalnızca Meta Cloud API modunda desteklenir",
  };
}

/** PDF / belge gönder (Green API veya Meta) */
export async function sendWhatsAppDocument(
  to: string,
  file: Buffer,
  filename: string,
  caption?: string,
): Promise<WaSendResult> {
  const mode = whatsAppMode();
  if (mode === "green-api") {
    return sendGreenApiFile(to, file, filename, caption);
  }
  if (mode === "meta") {
    return sendMetaDocument(to, file, filename, caption);
  }
  return {
    ok: false,
    error:
      "Sunucu tarafı WhatsApp kapalı (EQUSTO_WHATSAPP_MODE=link). Green API veya Meta yapılandırın.",
  };
}
