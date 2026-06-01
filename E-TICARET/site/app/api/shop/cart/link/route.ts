import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  guestTokenFromCartKey,
  normalizeShopCartItems,
  randomLinkCode,
  resolveShopCartKey,
} from "@/lib/shop-cart";

export const dynamic = "force-dynamic";

const CODE_TTL_MS = 15 * 60 * 1000;

function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** POST { action: "create", syncToken, memberEmail? } | { action: "join", code } */
export async function POST(req: NextRequest) {
  let body: {
    action?: string;
    syncToken?: string;
    memberEmail?: string;
    code?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Geçersiz JSON" }, 400);
  }

  const action = String(body.action ?? "").toLowerCase();

  if (action === "create") {
    const cartKey = resolveShopCartKey(body.syncToken, body.memberEmail);
    if (!cartKey) {
      return json({ success: false, error: "syncToken veya memberEmail gerekli" }, 400);
    }
    try {
      const now = Date.now();
      await db.shopCartLinkCode.deleteMany({
        where: { cartKey, expiresAt: { lt: new Date(now) } },
      });
      let code = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        code = randomLinkCode();
        try {
          await db.shopCartLinkCode.create({
            data: {
              code,
              cartKey,
              expiresAt: new Date(now + CODE_TTL_MS),
            },
          });
          break;
        } catch {
          code = "";
        }
      }
      if (!code) return json({ success: false, error: "Kod üretilemedi" }, 503);
      return json({
        success: true,
        code,
        expiresAt: new Date(now + CODE_TTL_MS).toISOString(),
      });
    } catch (e) {
      console.error("[shop/cart/link create]", e);
      return json({ success: false, error: "Kod oluşturulamadı" }, 503);
    }
  }

  if (action === "join") {
    const code = String(body.code ?? "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (code.length < 6) {
      return json({ success: false, error: "Geçerli 6 karakterlik kod girin" }, 400);
    }
    try {
      const link = await db.shopCartLinkCode.findUnique({ where: { code } });
      if (!link || link.expiresAt.getTime() < Date.now()) {
        return json({ success: false, error: "Kod geçersiz veya süresi dolmuş" }, 404);
      }
      const row = await db.shopCart.findUnique({ where: { cartKey: link.cartKey } });
      const items = normalizeShopCartItems(row?.items ?? []);
      const syncToken = guestTokenFromCartKey(link.cartKey);
      const memberEmail = link.cartKey.startsWith("email:")
        ? link.cartKey.slice(6)
        : undefined;
      return json({
        success: true,
        items,
        syncToken: syncToken ?? undefined,
        memberEmail,
        cartKey: link.cartKey,
      });
    } catch (e) {
      console.error("[shop/cart/link join]", e);
      return json({ success: false, error: "Kod ile eşitleme başarısız" }, 503);
    }
  }

  return json({ success: false, error: "action: create | join" }, 400);
}
