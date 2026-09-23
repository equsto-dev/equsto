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
    invokeStatus?: { status?: string; description?: string };
    correspondentsStatus?: { description?: string };
  };

  const invokeErr =
    json.invokeStatus?.description ||
    (json.invokeStatus?.status &&
    !/^(success|ok)$/i.test(json.invokeStatus.status)
      ? json.invokeStatus.status
      : "") ||
    json.correspondentsStatus?.description;

  if (!r.ok || invokeErr || !json.idMessage) {
    return {
      ok: false,
      error:
        invokeErr ||
        json.message ||
        (!json.idMessage ? "Green API idMessage döndürmedi" : `HTTP ${r.status}`),
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
  if (!file?.length) return { ok: false, error: "PDF boş oluşturuldu" };

  const id = greenApiInstanceId();
  const token = greenApiToken();
  const rawName = String(fileName || "teklif").trim().slice(0, 116);
  const safeName = /\.pdf$/i.test(rawName)
    ? rawName
    : `${rawName || "teklif"}.pdf`;
  const form = new FormData();
  form.append("chatId", chatId);
  form.append("fileName", safeName);
  form.append(
    "file",
    new Blob([new Uint8Array(file)], { type: "application/pdf" }),
    safeName,
  );
  if (caption?.trim()) {
    form.append("caption", caption.trim().slice(0, 1024));
  }

  // Dosya yükleme için Green API media host kullanılır (api host değil)
  const r = await fetch(
    `https://media.green-api.com/waInstance${id}/sendFileByUpload/${token}`,
    { method: "POST", body: form },
  );

  // Response body yalnızca bir kez okunur; böylece JSON olmayan hata cevapları da kaybolmaz.
  const raw = await r.text();
  let json: { idMessage?: string; message?: string; error?: string } = {};
  try {
    json = raw ? (JSON.parse(raw) as typeof json) : {};
  } catch {
    // Green API bazı hatalarda JSON yerine düz metin döndürebilir.
  }

  if (!r.ok) {
    return {
      ok: false,
      error:
        json.message ||
        json.error ||
        raw.slice(0, 500) ||
        `HTTP ${r.status}`,
      status: r.status,
    };
  }

  if (!json.idMessage) {
    return {
      ok: false,
      error: raw.slice(0, 500) || "Green API idMessage döndürmedi",
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
}): { type: string; messageId: string; chatId: string; text: string; senderName: string } | null {
  const type = root.messageData?.typeMessage || "";
  if (type !== "textMessage" && type !== "extendedTextMessage") return null;

  const text = String(
    root.messageData?.textMessageData?.textMessage ||
      root.messageData?.extendedTextMessageData?.text ||
      "",
  ).trim();
  const chatId = String(root.senderData?.chatId || root.senderData?.sender || "");
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

/** Green API — telefondan/API'den giden müşteri mesajları */
export function parseGreenApiOutboundMessages(body: unknown): GreenApiOutboundMessage[] {
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

  const hook = root.typeWebhook || "";
  if (hook !== "outgoingMessageReceived" && hook !== "outgoingAPIMessageReceived") {
    return [];
  }

  const parsed = parseGreenApiTextMessage(root);
  if (!parsed || !parsed.text) return [];

  const to = parsed.chatId.replace(/@c\.us$/i, "");
  if (!to) return [];

  return [{ to, messageId: parsed.messageId, text: parsed.text }];
}
