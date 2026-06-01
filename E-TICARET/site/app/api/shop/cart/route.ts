import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  getSessionByToken,
  mergeGuestShopCartIntoMember,
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

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

async function readKey(
  req: NextRequest,
  body?: { syncToken?: string; memberEmail?: string; token?: string },
) {
  const q = req.nextUrl.searchParams;
  const syncToken = body?.syncToken ?? q.get("syncToken");
  let memberEmail = body?.memberEmail ?? q.get("memberEmail");
  const token =
    readBearerToken(req) ||
    readTokenFromBody(body as Record<string, unknown> | undefined) ||
    q.get("access_token");
  if (token) {
    const session = await getSessionByToken(token);
    if (session?.user?.email) memberEmail = session.user.email;
  }
  const cartKey = resolveShopCartKey(syncToken, memberEmail);
  return { cartKey, syncToken, memberEmail: memberEmail ?? null };
}

export async function GET(req: NextRequest) {
  const { cartKey } = await readKey(req);
  if (!cartKey) {
    return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
  }
  try {
    const row = await db.shopCart.findUnique({ where: { cartKey } });
    const items = normalizeShopCartItems(row?.items ?? []);
    return json({ success: true, items, cartKey, updatedAt: row?.updatedAt?.toISOString() ?? null });
  } catch (e) {
    console.error("[shop/cart GET]", e);
    return json({ success: false, error: "Sepet okunamadı" }, 503);
  }
}

export async function PUT(req: NextRequest) {
  let body: { syncToken?: string; memberEmail?: string; items?: unknown; token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }
  const { cartKey, syncToken, memberEmail } = await readKey(req, body);
  if (!cartKey) {
    return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
  }
  const incoming = normalizeShopCartItems(body.items ?? []);
  try {
    if (memberEmail && syncToken) {
      await mergeGuestShopCartIntoMember(syncToken, memberEmail);
    }
    const existing = await db.shopCart.findUnique({ where: { cartKey } });
    const merged = existing
      ? mergeShopCartItems(existing.items, incoming)
      : incoming;
    const row = await db.shopCart.upsert({
      where: { cartKey },
      create: { cartKey, items: shopCartItemsToJson(merged) },
      update: { items: shopCartItemsToJson(merged) },
    });
    return json({
      success: true,
      items: normalizeShopCartItems(row.items),
      cartKey,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error("[shop/cart PUT]", e);
    return json({ success: false, error: "Sepet kaydedilemedi" }, 503);
  }
}
