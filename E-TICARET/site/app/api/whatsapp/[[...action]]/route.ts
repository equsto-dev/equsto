import { NextRequest } from "next/server";
import {
  waLinkGet,
  waSendPost,
  waStatusGet,
  waStatusPost,
  waWebhookGet,
  waWebhookPost,
} from "@/lib/whatsapp/api-handlers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ action?: string[] }> };

async function actionName(ctx: Ctx): Promise<string> {
  const { action } = await ctx.params;
  return action?.[0]?.toLowerCase() || "";
}

/**
 * Tek Vercel function — link / send / status / webhook
 * GET  /api/whatsapp/link
 * GET  /api/whatsapp/status  (Bearer)
 * POST /api/whatsapp/send    (Bearer)
 * POST /api/whatsapp/status  (Bearer test)
 * *    /api/whatsapp/webhook
 *
 * GET /api/whatsapp → next.config rewrite → /api/musteriler?whatsapp=1
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  switch (await actionName(ctx)) {
    case "link":
      return waLinkGet(req);
    case "status":
      return waStatusGet(req);
    case "webhook":
      return waWebhookGet(req);
    default:
      return new Response("Not Found", { status: 404 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  switch (await actionName(ctx)) {
    case "send":
      return waSendPost(req);
    case "status":
      return waStatusPost(req);
    case "webhook":
      return waWebhookPost(req);
    default:
      return new Response("Not Found", { status: 404 });
  }
}
