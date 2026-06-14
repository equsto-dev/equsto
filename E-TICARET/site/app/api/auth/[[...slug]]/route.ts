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
  updateMemberProfilePhone,
  updateMemberProfileAddress,
} from "@/lib/member-auth";
import {
  requestMemberPasswordReset,
  resetMemberPasswordWithCode,
} from "@/lib/member-password-reset";
import { normalizeShopCartItems } from "@/lib/shop-cart";
import { db } from "@/lib/db";

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
        String(body.telefon || body.phone || ""),
        typeof body.syncToken === "string" ? body.syncToken : null,
      );
      return json(sessionResponse(session));
    } catch (e) {
      return err(e instanceof Error ? e.message : "Kayıt başarısız", 400);
    }
  }

  if (path === "forgot-password" && method === "POST") {
    try {
      const result = await requestMemberPasswordReset(String(body.email || ""));
      return json({ success: true, message: result.message });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Kod gönderilemedi", 400);
    }
  }

  if (path === "reset-password" && method === "POST") {
    try {
      await resetMemberPasswordWithCode(
        String(body.email || ""),
        String(body.code || ""),
        String(body.password || ""),
        String(body.passwordConfirm || body.password2 || ""),
      );
      return json({ success: true, message: "Şifreniz güncellendi. Giriş yapabilirsiniz." });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Şifre güncellenemedi", 400);
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

  if (path === "dashboard" && method === "GET") {
    const session = await getSessionByToken(token);
    const memberId = await getMemberIdByToken(token);
    if (!session || !memberId) return err("Oturum geçersiz", 401);

    const orders = await db.siparis.findMany({
      where: {
        OR: [
          { musteriId: memberId },
          { musteriMail: session.user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const quotes = await db.teklif.findMany({
      where: {
        OR: [
          { musteriId: memberId },
          { musteriMail: session.user.email },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return json({
      success: true,
      orders,
      quotes,
    });
  }

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
    const replace = body.replace === true || body.clear === true;
    const items = await updateMemberCart(
      memberId,
      normalizeShopCartItems(body.items),
      replace,
    );
    return json({ success: true, items });
  }

  if (path === "profile" && method === "PUT") {
    const memberId = await getMemberIdByToken(token);
    if (!memberId) return err("Oturum geçersiz", 401);
    const hasPhone = body.telefon !== undefined || body.phone !== undefined;
    const hasAddress = body.teslimatAdres !== undefined;
    if (!hasPhone && !hasAddress) {
      return err("Güncellenecek profil alanı belirtilmedi", 400);
    }
    try {
      let user: Awaited<ReturnType<typeof updateMemberProfilePhone>> | null = null;
      if (hasPhone) {
        user = await updateMemberProfilePhone(
          memberId,
          String(body.telefon || body.phone || ""),
        );
      }
      if (hasAddress) {
        user = await updateMemberProfileAddress(memberId, body.teslimatAdres);
      }
      if (!user) return err("Profil güncellenemedi", 400);
      return json({ success: true, user });
    } catch (e) {
      return err(e instanceof Error ? e.message : "Profil güncellenemedi", 400);
    }
  }

  if (path === "cart" && method === "GET") {
    const session = await getSessionByToken(token);
    if (!session) return err("Oturum geçersiz", 401);
    return json({ success: true, items: session.items });
  }

  if (path === "cart" && (method === "PUT" || method === "POST")) {
    const memberId = await getMemberIdByToken(token);
    if (!memberId) return err("Oturum geçersiz", 401);
    const replace = body.replace === true || body.clear === true;
    const items = await updateMemberCart(
      memberId,
      normalizeShopCartItems(body.items),
      replace,
    );
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
