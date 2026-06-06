import { NextRequest } from "next/server";
import { assertAdminBearer } from "@/lib/auth";
import { adminErr, adminOk } from "@/lib/admin-response";
import { notifyChannelsConfigured } from "@/lib/notify";
import {
  buildWhatsAppLink,
  handleGreenApiInboundMessage,
  handleInboundWhatsAppMessage,
  parseGreenApiInboundMessages,
  parseInboundWhatsAppMessages,
  sendWhatsAppTemplate,
  sendWhatsAppText,
  verifyWhatsAppSignature,
  vitrinWhatsAppE164,
  whatsAppEnvHints,
  whatsAppLinkReady,
  whatsAppMode,
  whatsAppNotifyTo,
  whatsAppSendConfigured,
  whatsAppVerifyToken,
  whatsAppWebhookConfigured,
} from "@/lib/whatsapp";

const DEFAULT_PREFILL = "Merhaba, equsto.com üzerinden yazıyorum.";

export async function waLinkGet(req: NextRequest) {
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

export async function waStatusGet(req: NextRequest) {
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

type SendBody = {
  to?: string;
  text?: string;
  template?: string;
  language?: string;
  components?: unknown[];
};

export async function waSendPost(req: NextRequest) {
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

export async function waStatusPost(req: NextRequest) {
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
  if (!to) return adminErr("WHATSAPP_NOTIFY_TO veya body.to gerekli", 400);

  const text =
    String(body.text || "").trim() ||
    `Equsto WhatsApp test (${mode}) — bağlantı OK.`;

  const result = await sendWhatsAppText(to, text);
  if (!result.ok) return adminErr(result.error || "Test gönderilemedi", 502);
  return adminOk({ messageId: result.messageId, to, mode });
}

export async function waWebhookGet(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const expected = whatsAppVerifyToken();
  if (mode === "subscribe" && token && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function waWebhookPost(req: NextRequest) {
  if (!whatsAppWebhookConfigured()) {
    return new Response("WhatsApp webhook not configured", { status: 503 });
  }

  const rawBody = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  const mode = whatsAppMode();

  if (mode === "green-api" || (body as { typeWebhook?: string }).typeWebhook) {
    const messages = parseGreenApiInboundMessages(body);
    const results = [];
    for (const msg of messages) {
      if (!msg.text) continue;
      results.push(await handleGreenApiInboundMessage(msg));
    }
    return Response.json({ ok: true, provider: "green-api", processed: results.length, results });
  }

  const sig = req.headers.get("x-hub-signature-256");
  if (!verifyWhatsAppSignature(rawBody, sig)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const messages = parseInboundWhatsAppMessages(body);
  const results = [];
  for (const msg of messages) {
    if (msg.type !== "text" && !msg.text) continue;
    results.push(await handleInboundWhatsAppMessage(msg, "whatsapp-cloud-api"));
  }

  return Response.json({ ok: true, provider: "meta", processed: results.length, results });
}
