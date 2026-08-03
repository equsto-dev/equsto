import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { notifyNewLead } from "@/lib/notify";
import { whatsAppAppSecret } from "./config";
import { markWhatsAppRead } from "./meta-client";
import { extractSayfaUrlFromWhatsAppText } from "./sayfa-url";

export type InboundWhatsAppMessage = {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text: string;
  profileName: string;
};

function extractText(msg: Record<string, unknown>): string {
  const t = msg.type;
  if (t === "text") {
    const body = (msg.text as { body?: string } | undefined)?.body;
    return String(body || "").trim();
  }
  if (t === "button") {
    return String((msg.button as { text?: string } | undefined)?.text || "").trim();
  }
  if (t === "interactive") {
    const i = msg.interactive as
      | { button_reply?: { title?: string }; list_reply?: { title?: string } }
      | undefined;
    return String(i?.button_reply?.title || i?.list_reply?.title || "").trim();
  }
  return "";
}

/** Meta webhook gövdesinden gelen metin mesajları */
export function parseInboundWhatsAppMessages(
  body: unknown
): InboundWhatsAppMessage[] {
  const out: InboundWhatsAppMessage[] = [];
  const root = body as {
    entry?: {
      changes?: {
        value?: {
          messages?: Record<string, unknown>[];
          contacts?: { profile?: { name?: string }; wa_id?: string }[];
        };
      }[];
    }[];
  };

  for (const entry of root.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value;
      if (!value?.messages?.length) continue;
      const contacts = value.contacts || [];
      for (const msg of value.messages) {
        const from = String(msg.from || "");
        const messageId = String(msg.id || "");
        if (!from || !messageId) continue;
        const contact = contacts.find((c) => c.wa_id === from);
        out.push({
          from,
          messageId,
          timestamp: String(msg.timestamp || ""),
          type: String(msg.type || ""),
          text: extractText(msg),
          profileName: String(contact?.profile?.name || "").trim(),
        });
      }
    }
  }
  return out;
}

export function verifyWhatsAppSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = whatsAppAppSecret();
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const got = signatureHeader.slice(7);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(got));
  } catch {
    return false;
  }
}

/** Gelen mesaj → Musteri lead + Telegram/e-posta bildirimi */
export async function handleInboundWhatsAppMessage(
  msg: InboundWhatsAppMessage,
  kaynak = "whatsapp-api"
): Promise<{ saved: boolean; id?: string }> {
  void markWhatsAppRead(msg.messageId);

  const text =
    msg.text ||
    (msg.type === "text" ? "" : `[WhatsApp ${msg.type || "mesaj"}]`);

  const yetkili = msg.profileName || "WhatsApp ziyaretçi";
  const tel = msg.from.startsWith("+") ? msg.from : `+${msg.from}`;
  const sayfa = extractSayfaUrlFromWhatsAppText(text) || "whatsapp";

  try {
    const row = await db.musteri.create({
      data: {
        firma: "",
        yetkili,
        tel,
        tip: "lead",
        kaynak,
        sayfa,
        mesaj: text || null,
        not: [
          text,
          `wa_id: ${msg.from}`,
          msg.messageId ? `message_id: ${msg.messageId}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      },
    });
    void notifyNewLead(row).catch((e) => console.error("[whatsapp] notify", e));
    return { saved: true, id: row.id };
  } catch (e) {
    console.error("[whatsapp] lead save", e);
    return { saved: false };
  }
}

/** Green API webhook → lead */
export async function handleGreenApiInboundMessage(msg: {
  from: string;
  messageId: string;
  text: string;
  profileName: string;
}): Promise<{ saved: boolean; id?: string }> {
  return handleInboundWhatsAppMessage(
    {
      from: msg.from,
      messageId: msg.messageId,
      timestamp: "",
      type: "text",
      text: msg.text,
      profileName: msg.profileName,
    },
    "whatsapp-green-api"
  );
}
