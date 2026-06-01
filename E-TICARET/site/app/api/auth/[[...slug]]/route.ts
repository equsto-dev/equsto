import { NextRequest } from "next/server";
import {
  getMemberIdByToken,
  getSessionByToken,
  googleClientId,
  loginWithEmail,
  loginWithGoogle,
  readBearerToken,
  readTokenFromBody,
  registerWithEmail,
  revokeSession,
  sessionResponse,
  updateMemberCart,
} from "@/lib/member-auth";
import { normalizeShopCartItems } from "@/lib/shop-cart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug?: string[] }> };

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function err(message: string, status = 400) {
  return json({ success: false, error: message }, status);
}

async function action(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { slug } = await ctx.params;
  const path = (slug || []).join("/") || "config";
  const method = req.method.toUpperCase();

  if (path === "config" && method === "GET") {
    return json({
      success: true,
      googleClientId: googleClientId() || undefined,
      appleClientId: process.env.EQUSTO_APPLE_CLIENT_ID?.trim() || undefined,
    });
  }

  let body: Record<string, unknown> = {};
  if (method === "POST" || method === "PUT") {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  }

  if (path === "login" && method === "POST") {
    try {
      const session = await loginWithEmail(
        String(body.email || ""),
        String(body.password || ""),
        typeof body.syncToken === "string" ? body.syncToken : null,
      );
      return json(sessionResponse(session));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Giriş başarısız", 401);
    }
  }

  if (path === "register" && method === "POST") {
    try {
      const session = await registerWithEmail(
        String(body.email || ""),
        String(body.password || ""),
        String(body.name || ""),
      );
      return json(sessionResponse(session));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Kayıt başarısız", 400);
    }
  }

  if (path === "google" && method === "POST") {
    try {
      const credential = String(body.credential || body.id_token || "");
      if (!credential) return err("Google credential gerekli", 400);
      const session = await loginWithGoogle(
        credential,
        typeof body.syncToken === "string" ? body.syncToken : null,
      );
      return json(sessionResponse(session));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Google girişi başarısız", 401);
    }
  }

  if (path === "logout" && method === "POST") {
    await revokeSession(readBearerToken(req) || readTokenFromBody(body));
    return json({ success: true });
  }

  const token = readBearerToken(req) || readTokenFromBody(body);

  if (path === "me" && method === "GET") {
    const session = await getSessionByToken(token);
    if (!session) return err("Oturum geçersiz", 401);
    return json({
      success: true,
      user: session.user,
      items: session.items,
      expiresAt: session.expiresAt,
    });
  }

  if (path === "me" && method === "PUT") {
    const memberId = await getMemberIdByToken(token);
    if (!memberId) return err("Oturum geçersiz", 401);
    const items = await updateMemberCart(memberId, normalizeShopCartItems(body.items));
    return json({ success: true, items });
  }

  if (path === "cart" && method === "GET") {
    const session = await getSessionByToken(token);
    if (!session) return err("Oturum geçersiz", 401);
    return json({ success: true, items: session.items });
  }

  if (path === "cart" && (method === "PUT" || method === "POST")) {
    const memberId = await getMemberIdByToken(token);
    if (!memberId) return err("Oturum geçersiz", 401);
    const items = await updateMemberCart(memberId, normalizeShopCartItems(body.items));
    return json({ success: true, items });
  }

  return err("Bilinmeyen auth yolu: " + path, 404);
}

export async function GET(req: NextRequest, ctx: Ctx) {
  return action(req, ctx);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  return action(req, ctx);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  return action(req, ctx);
}
