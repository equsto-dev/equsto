import { NextRequest } from "next/server";
import {
  handleGreenApiInboundMessage,
  handleInboundWhatsAppMessage,
  parseGreenApiInboundMessages,
  parseInboundWhatsAppMessages,
  verifyWhatsAppSignature,
  whatsAppMode,
  whatsAppVerifyToken,
  whatsAppWebhookConfigured,
} from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/**
 * WhatsApp webhook — Meta (hub.*) veya Green API (typeWebhook)
 * Callback URL: https://equsto.com/api/whatsapp/webhook
 */
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  const expected = whatsAppVerifyToken();
  if (mode === "subscribe" && token && expected && token === expected && challenge) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
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
