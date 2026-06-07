import { greenApiConfigured, normalizeWaRecipient } from "./config";
import type { WaSendResult } from "./meta-client";

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

/** Green API — QR ile bağlanır, Facebook hesabı gerekmez */
export async function sendGreenApiText(
  to: string,
  body: string
): Promise<WaSendResult> {
  if (!greenApiConfigured()) {
    return { ok: false, error: "Green API yapılandırılmamış" };
  }

  const chatId = chatIdFromE164(to);
  if (!chatId) return { ok: false, error: "Geçersiz alıcı numarası" };

  const message = String(body || "").trim().slice(0, 4096);
  if (!message) return { ok: false, error: "Mesaj boş" };

  const id = greenApiInstanceId();
  const token = greenApiToken();
  const r = await fetch(
    `https://api.green-api.com/waInstance${id}/sendMessage/${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, message }),
    }
  );

  const json = (await r.json().catch(() => ({}))) as {
    idMessage?: string;
    message?: string;
  };

  if (!r.ok) {
    return {
      ok: false,
      error: json.message || (await r.text().catch(() => "")).slice(0, 240) || `HTTP ${r.status}`,
      status: r.status,
    };
  }

  return { ok: true, messageId: json.idMessage, status: r.status };
}

/** Green API — dosya (PDF vb.) gönder */
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

  const id = greenApiInstanceId();
  const token = greenApiToken();
  const form = new FormData();
  form.append("chatId", chatId);
  form.append(
    "file",
    new Blob([new Uint8Array(file)], { type: "application/pdf" }),
    fileName.slice(0, 120),
  );
  if (caption?.trim()) {
    form.append("caption", caption.trim().slice(0, 1024));
  }

  const r = await fetch(
    `https://api.green-api.com/waInstance${id}/sendFileByUpload/${token}`,
    { method: "POST", body: form },
  );

  const json = (await r.json().catch(() => ({}))) as {
    idMessage?: string;
    message?: string;
  };

  if (!r.ok) {
    return {
      ok: false,
      error:
        json.message ||
        (await r.text().catch(() => "")).slice(0, 240) ||
        `HTTP ${r.status}`,
      status: r.status,
    };
  }

  return { ok: true, messageId: json.idMessage, status: r.status };
}

export type GreenApiInboundMessage = {
  from: string;
  messageId: string;
  text: string;
  profileName: string;
};

/** Green API webhook gövdesinden gelen metin mesajları */
export function parseGreenApiInboundMessages(body: unknown): GreenApiInboundMessage[] {
  const root = body as {
    typeWebhook?: string;
    idMessage?: string;
    senderData?: { sender?: string; senderName?: string; chatId?: string };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
      extendedTextMessageData?: { text?: string };
    };
  };

  if (root.typeWebhook !== "incomingMessageReceived") return [];

  const type = root.messageData?.typeMessage || "";
  if (type !== "textMessage" && type !== "extendedTextMessage") return [];

  const text =
    root.messageData?.textMessageData?.textMessage ||
    root.messageData?.extendedTextMessageData?.text ||
    "";
  const sender = String(root.senderData?.sender || root.senderData?.chatId || "");
  const from = sender.replace(/@c\.us$/i, "");
  const messageId = String(root.idMessage || "");
  if (!from || !messageId) return [];

  return [
    {
      from,
      messageId,
      text: String(text).trim(),
      profileName: String(root.senderData?.senderName || "").trim(),
    },
  ];
}
