import { NextRequest } from "next/server";

function syncTokenCookie(syncToken: string | null | undefined): string | null {
  const tok = String(syncToken ?? "").trim().toLowerCase();
  if (!/^[0-9a-f-]{36}$/.test(tok)) return null;
  return `equsto_cart_sync=${tok}; Path=/; Max-Age=31536000; Secure; SameSite=Lax`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const syncToken = q.get("syncToken");
  const next = q.get("next") || "/sepet";
  const headers = new Headers();
  const ck = syncTokenCookie(syncToken);
  if (ck) headers.set("Set-Cookie", ck);
  headers.set("Location", next);
  return new Response(null, { status: 302, headers });
}

