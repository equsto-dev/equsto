import { greenApiConfigured, normalizeWaRecipient } from "./config";
import type { WaSendResult } from "./meta-client";
import {
  deleteTempWhatsAppFile,
  putTempWhatsAppFile,
} from "./temp-file-store";

function env(name: string): string {
  return process.env[name]?.trim() || "";
}

export function greenApiInstanceId(): string {
  return env("GREEN_API_INSTANCE_ID");
}

export function greenApiToken(): string {
  return env("GREEN_API_TOKEN");
}

export { greenApiConfigured } from "./config";

function chatIdFromE164(e164: string): string {
  const d = normalizeWaRecipient(e164);
  return d ? `${d}@c.us` : "";
}

function greenApiApiHost(): string {
  return (env("GREEN_API_API_URL") || "https://api.green-api.com").replace(
    /\/$/,
    "",
  );
}

function siteOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.SITE_URL?.trim() ||
    "https://equsto.com"
  ).replace(/\/$/, "");
}

type GreenApiResponse = {
  idMessage?: string;
  message?: string;
  error?: string;
  urlFile?: string;
  invokeStatus?: { status?: string; description?: string };
  correspondentsStatus?: { description?: string };
};

async function readGreenApiResponse(
  response: Response,
): Promise<GreenApiResponse & { raw: string }> {
  const raw = await response.text();
  let json: GreenApiResponse = {};
  try {
    json = raw ? (JSON.parse(raw) as GreenApiResponse) : {};
  } catch {
    // Green API may return plain text for gateway/proxy errors.
  }
  return { ...json, raw };
}

function greenApiError(
  response: Response,
  result: GreenApiResponse & { raw: string },
): string {
  const invokeErr =
    result.invokeStatus?.description ||
    (result.invokeStatus?.status &&
    !/^(success|ok)$/i.test(result.invokeStatus.status)
      ? result.invokeStatus.status
      : "") ||
    result.correspondentsStatus?.description;

  const raw = invokeErr || result.message || result.error || result.raw || "";

  if (/quota|correspondents|tariff|QUOTE_/i.test(raw)) {
    return (
      "Green API aylık muhatap kotası dolmuş. " +
      "console.green-api.com üzerinden tarife yükseltin veya " +
      "yalnızca kota içindeki numaralara gönderin."
    );
  }

  if (/<\s*html[\s>]|gateway time-?out|504|502 bad gateway/i.test(raw)) {
    return `WhatsApp medya sunucusu hata verdi (HTTP ${response.status}).`;
  }

  return (
    (typeof raw === "string" && raw.trim()
      ? raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400)
      : "") || `HTTP ${response.status}`
  );
}

/** Green API — QR ile bağlanır, Facebook hesabı gerekmez */
export async function sendGreenApiText(
  to: string,
  body: string,
): Promise<WaSendResult> {
  if (!greenApiConfigured()) {
    return { ok: false, error: "Green API yapılandırılmamış" };
  }

  const chatId = chatIdFromE164(to);
  if (!chatId) return { ok: false, error: "Geçersiz alıcı numarası" };

  const message = String(body || "").trim().slice(0, 4096);
  if (!message) return { ok: false, error: "Mesaj boş" };

  try {
    const id = greenApiInstanceId();
    const token = greenApiToken();
    const r = await fetch(
      `${greenApiApiHost()}/waInstance${id}/sendMessage/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
        signal: AbortSignal.timeout(30_000),
      },
    );
    const result = await readGreenApiResponse(r);

    if (!r.ok || !result.idMessage) {
      return { ok: false, error: greenApiError(r, result), status: r.status };
    }

    return { ok: true, messageId: result.idMessage, status: r.status };
  } catch (e) {
    return {
      ok: false,
      error: `Green API bağlantı hatası: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/**
 * PDF gönder — media.green-api.com upload kırık/yavaş;
 * dosyayı equsto temp URL ile api.green-api.com sendFileByUrl kullan.
 */
export async function sendGreenApiFile(
  to: string,
  file: Buffer,
  fileName: string,
  caption?: string,
): Promise<WaSendResult> {
  if (!greenApiConfigured()) {
    return { ok: false, error: "Green API yapılandırılmamış" };
  }

  const chatId = chatIdFromE164(to);
  if (!chatId) return { ok: false, error: "Geçersiz alıcı numarası" };
  if (!file?.length) return { ok: false, error: "PDF boş oluşturuldu" };

  const id = greenApiInstanceId();
  const token = greenApiToken();
  const rawName = String(fileName || "teklif").trim().slice(0, 116);
  const safeName = /\.pdf$/i.test(rawName)
    ? rawName
    : `${rawName || "teklif"}.pdf`;

  const tempId = putTempWhatsAppFile(file, safeName, "application/pdf");
  const urlFile = `${siteOrigin()}/api/whatsapp/temp-file/${tempId}`;

  try {
    const r = await fetch(
      `${greenApiApiHost()}/waInstance${id}/sendFileByUrl/${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          urlFile,
          fileName: safeName,
          ...(caption?.trim()
            ? { caption: caption.trim().slice(0, 1024) }
            : {}),
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );
    const result = await readGreenApiResponse(r);

    if (!r.ok || !result.idMessage) {
      return { ok: false, error: greenApiError(r, result), status: r.status };
    }

    return { ok: true, messageId: result.idMessage, status: r.status };
  } catch (e) {
    return {
      ok: false,
      error: `Green API PDF bağlantı hatası: ${e instanceof Error ? e.message : String(e)}`,
    };
  } finally {
    // Green API URL'yi birkaç sn içinde çeker; kısa gecikmeyle sil
    setTimeout(() => deleteTempWhatsAppFile(tempId), 120_000);
  }
}

export type GreenApiInboundMessage = {
  from: string;
  messageId: string;
  text: string;
  profileName: string;
};

export type GreenApiOutboundMessage = {
  to: string;
  messageId: string;
  text: string;
};

function parseGreenApiTextMessage(root: {
  typeWebhook?: string;
  idMessage?: string;
  senderData?: { sender?: string; senderName?: string; chatId?: string };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}): {
  type: string;
  messageId: string;
  chatId: string;
  text: string;
  senderName: string;
} | null {
  const type = root.messageData?.typeMessage || "";
  if (type !== "textMessage" && type !== "extendedTextMessage") return null;

  const text = String(
    root.messageData?.textMessageData?.textMessage ||
      root.messageData?.extendedTextMessageData?.text ||
      "",
  ).trim();
  const chatId = String(
    root.senderData?.chatId || root.senderData?.sender || "",
  );
  const messageId = String(root.idMessage || "");
  if (!chatId || !messageId) return null;

  return {
    type,
    messageId,
    chatId,
    text,
    senderName: String(root.senderData?.senderName || "").trim(),
  };
}

export function parseGreenApiInboundMessages(
  body: unknown,
): GreenApiInboundMessage[] {
  const root = body as Parameters<typeof parseGreenApiTextMessage>[0];
  if (root.typeWebhook !== "incomingMessageReceived") return [];
  const parsed = parseGreenApiTextMessage(root);
  if (!parsed || !parsed.text) return [];
  const from = parsed.chatId.replace(/@c\.us$/i, "");
  if (!from) return [];
  return [
    {
      from,
      messageId: parsed.messageId,
      text: parsed.text,
      profileName: parsed.senderName,
    },
  ];
}

export function parseGreenApiOutboundMessages(
  body: unknown,
): GreenApiOutboundMessage[] {
  const root = body as Parameters<typeof parseGreenApiTextMessage>[0];
  const hook = root.typeWebhook || "";
  if (
    hook !== "outgoingMessageReceived" &&
    hook !== "outgoingAPIMessageReceived"
  )
    return [];
  const parsed = parseGreenApiTextMessage(root);
  if (!parsed || !parsed.text) return [];
  const to = parsed.chatId.replace(/@c\.us$/i, "");
  if (!to) return [];
  return [{ to, messageId: parsed.messageId, text: parsed.text }];
}
