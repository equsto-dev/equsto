import { NextRequest } from "next/server";
import {
  waLinkGet,
  waSendPost,
  waStatusGet,
  waStatusPost,
  waWebhookGet,
  waWebhookPost,
} from "@/lib/whatsapp/api-handlers";
import { getTempWhatsAppFile } from "@/lib/whatsapp/temp-file-store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ action?: string[] }> };

async function actionParts(ctx: Ctx): Promise<string[]> {
  const { action } = await ctx.params;
  return (action || []).map((s) => s.toLowerCase());
}

/**
 * Tek Vercel function — link / send / status / webhook / temp-file
 * GET  /api/whatsapp/link
 * GET  /api/whatsapp/status  (Bearer)
 * GET  /api/whatsapp/temp-file/:id  (Green API sendFileByUrl)
 * POST /api/whatsapp/send    (Bearer)
 * POST /api/whatsapp/status  (Bearer test)
 * *    /api/whatsapp/webhook
 *
 * GET /api/whatsapp → next.config rewrite → /api/musteriler?whatsapp=1
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const parts = await actionParts(ctx);
  const name = parts[0] || "";
  switch (name) {
    case "link":
      return waLinkGet(req);
    case "status":
      return waStatusGet(req);
    case "webhook":
      return waWebhookGet(req);
    case "temp-file": {
      const entry = getTempWhatsAppFile(parts[1] || "");
      if (!entry) return new Response("Not Found", { status: 404 });
      return new Response(new Uint8Array(entry.buf), {
        status: 200,
        headers: {
          "Content-Type": entry.contentType,
          "Content-Disposition": `inline; filename="${entry.fileName.replace(/"/g, "")}"`,
          "Cache-Control": "no-store",
          "Content-Length": String(entry.buf.length),
        },
      });
    }
    default:
      return new Response("Not Found", { status: 404 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  switch ((await actionParts(ctx))[0] || "") {
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
