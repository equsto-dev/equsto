import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveBrandRedirectPath } from "./lib/brand-shop-redirect";

/** Eski ?b= / ?slug= marka.html sorguları → /shop/marka/{slug} */
function legacyMarkaRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const isLegacyMarka =
    pathname === "/marka.html" ||
    pathname === "/marka" ||
    pathname === "/en/marka.html" ||
    pathname === "/en/marka";
  if (!isLegacyMarka) return null;

  const legacyB = (
    request.nextUrl.searchParams.get("b") ||
    request.nextUrl.searchParams.get("slug") ||
    ""
  ).trim();
  if (!legacyB) return null;

  const langPrefix = pathname.startsWith("/en/") ? "/en" : "";
  const destPath = resolveBrandRedirectPath(legacyB, langPrefix);
  if (!destPath) return null;

  const dest = request.nextUrl.clone();
  const parsed = new URL(destPath, request.url);
  dest.pathname = parsed.pathname;
  dest.search = parsed.search;

  request.nextUrl.searchParams.forEach((value, key) => {
    if (key === "b" || key === "slug") return;
    if (!dest.searchParams.has(key)) dest.searchParams.set(key, value);
  });

  return NextResponse.redirect(dest, 308);
}

export function proxy(request: NextRequest) {
  const markaRedir = legacyMarkaRedirect(request);
  if (markaRedir) return markaRedir;

  const res = NextResponse.next();
  const p = request.nextUrl.pathname;

  if ((p.startsWith("/i18n/") || p.startsWith("/locales/")) && p.endsWith(".json")) {
    res.headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
