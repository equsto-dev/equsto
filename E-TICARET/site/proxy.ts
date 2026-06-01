import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveBrandRedirectPath } from "./lib/brand-shop-redirect";

/** Eski ?b= / ?slug= marka sorguları → /shop/marka/{slug} veya departman ?marka= */
function legacyMarkaRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const langPrefix = pathname.startsWith("/en/") || pathname === "/en" ? "/en" : "";
  const isLegacyMarka =
    pathname === "/marka.html" ||
    pathname === "/marka" ||
    pathname === "/en/marka.html" ||
    pathname === "/en/marka";
  const isShopMarkaHub =
    pathname === "/shop/marka" ||
    pathname === "/shop/marka/" ||
    pathname === "/en/shop/marka" ||
    pathname === "/en/shop/marka/";
  if (!isLegacyMarka && !isShopMarkaHub) return null;

  const legacyB = (
    request.nextUrl.searchParams.get("b") ||
    request.nextUrl.searchParams.get("slug") ||
    ""
  ).trim();
  if (!legacyB) return null;

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

/** Eski /shop/sogutma/… içecek SKU yolları → /shop/icecek/… (aynı ürün slug) */
function legacySogutmaIcecekProductRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const m = pathname.match(/^(\/en)?\/shop\/sogutma\/([^/]+)\/?$/i);
  if (!m) return null;
  const low = decodeURIComponent(m[2]).toLowerCase();
  const beverageSlug =
    /meyve-suyu-sogutma|kopuklu-ayran|k[oö]p[uü]kl[uü]-ayran|ayran-makin|slush|serbet|sherbet|granita|limonata|8477-|9868-|vitrifrigo|sut-sogutucu|süt-soğutucu|bardak-isit|bardak-ısıt|ice-slush|buzlu-serbet|meyve-suyu-so[gğ]utma/i.test(
      low,
    );
  if (!beverageSlug) return null;
  const dest = request.nextUrl.clone();
  dest.pathname = (m[1] || "") + "/shop/icecek/" + m[2];
  return NextResponse.redirect(dest, 308);
}

/** Yanlış soğutma/set-ustu yolu — sebze doğrama → hazirlik */
function legacyWrongDeptSebzeDogramaRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const m = pathname.match(/^(\/en)?\/shop\/(sogutma|set-ustu-mutfak)\/([^/]+)\/?$/i);
  if (!m) return null;
  const slug = decodeURIComponent(m[3]).toLowerCase();
  if (!/robot-coupe|sebze-dograma|9840-cl|cl60d|cl50d|cl52d|cl55d/i.test(slug)) {
    return null;
  }
  const dest = request.nextUrl.clone();
  dest.pathname = (m[1] || "") + "/shop/hazirlik/" + m[3];
  return NextResponse.redirect(dest, 308);
}

/** Eski set-ustu Robot Coupe / sebze doğrama → /shop/hazirlik/… */
function legacySetUstuSebzeDogramaRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const m = pathname.match(/^(\/en)?\/shop\/set-ustu-mutfak\/([^/]+)\/?$/i);
  if (!m) return null;
  const slug = decodeURIComponent(m[2]).toLowerCase();
  if (
    !/robot-coupe|sebze-dograma|9840-cl|cl60|cl50|cl52|cl55|cl60d/i.test(slug)
  ) {
    return null;
  }
  const dest = request.nextUrl.clone();
  dest.pathname = (m[1] || "") + "/shop/hazirlik/" + m[2];
  return NextResponse.redirect(dest, 308);
}

/** Eski hazirlik/tezgah pizza soğutma üniteleri → /shop/sogutma/… */
function legacyHazirlikPzcSogutmaRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const m = pathname.match(/^(\/en)?\/shop\/(hazirlik|tezgah)\/([^/]+)\/?$/i);
  if (!m) return null;
  const slug = decodeURIComponent(m[3]).toLowerCase();
  if (!/pzc\d{2}|79e3-pzc|pizza-hazirlik|soguk-hazirlik/i.test(slug)) return null;
  const dest = request.nextUrl.clone();
  dest.pathname = (m[1] || "") + "/shop/sogutma/" + m[3];
  return NextResponse.redirect(dest, 308);
}

/** www → apex (tek kanonik host + geçerli SSL). */
function wwwToApexRedirect(request: NextRequest): NextResponse | null {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host !== "www.equsto.com") return null;
  const url = request.nextUrl.clone();
  url.protocol = "https:";
  url.host = "equsto.com";
  return NextResponse.redirect(url, 308);
}

export function proxy(request: NextRequest) {
  const wwwRedir = wwwToApexRedirect(request);
  if (wwwRedir) return wwwRedir;

  const markaRedir = legacyMarkaRedirect(request);
  if (markaRedir) return markaRedir;

  const icecekRedir = legacySogutmaIcecekProductRedirect(request);
  if (icecekRedir) return icecekRedir;

  const pzcRedir = legacyHazirlikPzcSogutmaRedirect(request);
  if (pzcRedir) return pzcRedir;

  const sebzeRedir =
    legacyWrongDeptSebzeDogramaRedirect(request) ||
    legacySetUstuSebzeDogramaRedirect(request);
  if (sebzeRedir) return sebzeRedir;

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
