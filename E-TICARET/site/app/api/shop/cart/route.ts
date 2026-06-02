import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getMemberIdByToken,
  getSessionByToken,
  clearUnifiedShopCart,
  loadUnifiedShopCart,
  persistUnifiedShopCart,
  readBearerToken,
  readTokenFromBody,
} from "@/lib/member-auth";
import {
  mergeShopCartItems,
  normalizeShopCartItems,
  resolveShopCartKey,
  shopCartItemsToJson,
} from "@/lib/shop-cart";

export const dynamic = "force-dynamic";

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

function syncTokenCookie(syncToken: string | null | undefined): Record<string, string> {
  const headers: Record<string, string> = {};
  const tok = String(syncToken ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(tok)) return headers;
  headers["Set-Cookie"] =
    `equsto_cart_sync=${tok}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
  return headers;
}

async function readKey(
  req: NextRequest,
  body?: { syncToken?: string; memberEmail?: string; token?: string },
) {
  const q = req.nextUrl.searchParams;
  const syncToken =
    body?.syncToken ?? q.get("syncToken") ?? req.cookies.get("equsto_cart_sync")?.value;
  let memberEmail = body?.memberEmail ?? q.get("memberEmail");
  const token =
    readBearerToken(req) ||
    readTokenFromBody(body as Record<string, unknown> | undefined) ||
    q.get("access_token");
  let memberId: string | null = null;
  if (token) {
    const session = await getSessionByToken(token);
    if (session?.user?.email) memberEmail = session.user.email;
    memberId = await getMemberIdByToken(token);
  }
  const cartKey = resolveShopCartKey(syncToken, memberEmail);
  return { cartKey, syncToken, memberEmail: memberEmail ?? null, memberId, token };
}

export async function GET(req: NextRequest) {
  const { cartKey, syncToken, memberEmail, memberId } = await readKey(req);
  if (!cartKey) {
    return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
  }
  try {
    const items =
      memberId || memberEmail
        ? await loadUnifiedShopCart({ syncToken, memberEmail, memberId })
        : normalizeShopCartItems(
            (await db.shopCart.findUnique({ where: { cartKey } }))?.items ?? [],
          );
    const row = await db.shopCart.findUnique({ where: { cartKey } });
    return json(
      {
        success: true,
        items,
        cartKey,
        updatedAt: row?.updatedAt?.toISOString() ?? null,
      },
      200,
      syncTokenCookie(syncToken),
    );
  } catch (e) {
    console.error("[shop/cart GET]", e);
    return json({ success: false, error: "Sepet okunamadı" }, 503);
  }
}

export async function PUT(req: NextRequest) {
  let body: {
    syncToken?: string;
    memberEmail?: string;
    items?: unknown;
    token?: string;
    replace?: boolean;
    clear?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }
  const { cartKey, syncToken, memberEmail, memberId } = await readKey(req, body);
  if (!cartKey) {
    return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
  }
  const incoming = normalizeShopCartItems(body.items ?? []);
  const replace = body.replace === true || body.clear === true;
  try {
    if (replace && incoming.length === 0) {
      const saved = await clearUnifiedShopCart({ syncToken, memberEmail, memberId });
      return json(
        {
          success: true,
          items: saved,
          cartKey,
          updatedAt: new Date().toISOString(),
        },
        200,
        syncTokenCookie(syncToken),
      );
    }

    if (memberId && memberEmail) {
      const existing = await loadUnifiedShopCart({ syncToken, memberEmail, memberId });
      const merged = replace ? incoming : mergeShopCartItems(existing, incoming);
      const saved = await persistUnifiedShopCart({
        memberId,
        memberEmail,
        items: merged,
      });
      return json(
        {
          success: true,
          items: saved,
          cartKey,
          updatedAt: new Date().toISOString(),
        },
        200,
        syncTokenCookie(syncToken),
      );
    }

    const existing = await db.shopCart.findUnique({ where: { cartKey } });
    const merged =
      replace || !existing ? incoming : mergeShopCartItems(existing.items, incoming);
    const row = await db.shopCart.upsert({
      where: { cartKey },
      create: { cartKey, items: shopCartItemsToJson(merged) },
      update: { items: shopCartItemsToJson(merged) },
    });
    return json(
      {
        success: true,
        items: normalizeShopCartItems(row.items),
        cartKey,
        updatedAt: row.updatedAt.toISOString(),
      },
      200,
      syncTokenCookie(syncToken),
    );
  } catch (e) {
    console.error("[shop/cart PUT]", e);
    return json({ success: false, error: "Sepet kaydedilemedi" }, 503);
  }
}
