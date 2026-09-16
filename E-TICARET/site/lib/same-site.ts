import { getSiteOrigin } from "@/lib/site-origin";

/**
 * Public POST (lead/sipariş) — tarayıcı formları same-site Origin/Referer ile gelsin.
 * curl/server-to-server: EQUSTO_ALLOW_PUBLIC_API_NO_ORIGIN=1
 * @returns hata mesajı veya null (OK)
 */
export function sameSiteBrowserError(req: Request): string | null {
  if (process.env.EQUSTO_ALLOW_PUBLIC_API_NO_ORIGIN === "1") return null;

  const origin = req.headers.get("origin")?.trim() || "";
  const referer = req.headers.get("referer")?.trim() || "";
  const site = getSiteOrigin().replace(/\/$/, "");

  const allowed = new Set<string>([
    site,
    "https://equsto.com",
    "https://www.equsto.com",
  ]);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3099");
    allowed.add("http://127.0.0.1:3099");
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  const okOrigin = Boolean(origin && [...allowed].some((a) => origin === a));
  const okReferer = Boolean(
    referer && [...allowed].some((a) => referer === a || referer.startsWith(`${a}/`)),
  );

  if (okOrigin || okReferer) return null;
  return "Geçersiz istek kaynağı";
}
