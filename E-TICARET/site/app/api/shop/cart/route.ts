import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
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

function readKey(req: NextRequest, body?: { syncToken?: string; memberEmail?: string }) {
  const q = req.nextUrl.searchParams;
  const syncToken = body?.syncToken ?? q.get("syncToken");
  const memberEmail = body?.memberEmail ?? q.get("memberEmail");
  return resolveShopCartKey(syncToken, memberEmail);
}

export async function GET(req: NextRequest) {
  const cartKey = readKey(req);
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
  let body: { syncToken?: string; memberEmail?: string; items?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }
  const cartKey = readKey(req, body);
  if (!cartKey) {
    return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
  }
  const items = normalizeShopCartItems(body.items ?? []);
  try {
    const row = await db.shopCart.upsert({
      where: { cartKey },
      create: { cartKey, items: shopCartItemsToJson(items) },
      update: { items: shopCartItemsToJson(items) },
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
