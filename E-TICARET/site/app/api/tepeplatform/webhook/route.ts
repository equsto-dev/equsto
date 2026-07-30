import { NextRequest } from "next/server";
import { applyTepeplatformWebhook } from "@/lib/odeme/tepeplatform-checkout";
import {
  tepeplatformApiSecret,
  tepeplatformConfigured,
  verifyWebhookSignature,
} from "@/lib/odeme/tepeplatform";

export const dynamic = "force-dynamic";

/**
 * TepePlatform → equsto webhook.
 * Partner kaydında: https://equsto.com/api/tepeplatform/webhook
 */
export async function POST(req: NextRequest) {
  if (!tepeplatformConfigured()) {
    return Response.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-tp-signature");
  if (!verifyWebhookSignature(rawBody, signature, tepeplatformApiSecret())) {
    return Response.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event =
    String(req.headers.get("x-tp-event") || body.event || "").trim() ||
    "unknown";

  const result = await applyTepeplatformWebhook(event, {
    ...body,
    sessionId: String(
      body.sessionId || req.headers.get("x-tp-session-id") || "",
    ).trim() || undefined,
    event,
  });

  if (!result.ok) {
    // Sipariş bulunamadı — TepePlatform retry etmesin diye 200 (veya 404)
    console.warn("[tepeplatform webhook] siparis yok", event, body.orderRef);
    return Response.json({ ok: false, error: "order_not_found" }, { status: 404 });
  }

  return Response.json({
    ok: true,
    duplicate: Boolean(result.duplicate),
    siparisNo: result.siparisNo,
  });
}
