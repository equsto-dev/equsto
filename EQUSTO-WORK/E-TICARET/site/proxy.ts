import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** next.config headers yalnızca *.html URL’lerine uygulanır; /pfos gibi rewrite’lar için */
const DEPT_SLUGS = [
  "pisirme",
  "sogutma",
  "kahve",
  "yikama",
  "hazirlik",
  "icecek",
  "tezgah",
  "dolap",
  "davlumbaz",
  "tasima",
  "araba",
  "istif",
  "set-ustu-mutfak",
];

const EXACT_HTML = new Set([
  "/",
  "/pfos",
  "/besos",
  "/bar-design",
  "/admin",
  "/contact",
  "/login",
  "/marka",
  "/arama",
  "/geo-landing.html",
]);

function isLegacyHtmlPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p.startsWith("/api") || p.startsWith("/_next") || p.startsWith("/yonetim")) {
    return false;
  }
  if (p.endsWith(".html")) return true;
  if (EXACT_HTML.has(p)) return true;
  if (DEPT_SLUGS.some((s) => p === `/shop/${s}`)) return true;
  if (
    p.startsWith("/steakhouse") ||
    p.startsWith("/bulut-mutfak") ||
    p.startsWith("/cafe-kurulumu") ||
    p.startsWith("/catering") ||
    p.startsWith("/fine-dining") ||
    p.startsWith("/all-day-dining") ||
    p.startsWith("/fast-food") ||
    p.startsWith("/projeler") ||
    p.startsWith("/rehber/")
  ) {
    return true;
  }
  return false;
}

export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  const p = request.nextUrl.pathname;

  if (isLegacyHtmlPath(p)) {
    res.headers.set("Content-Type", "text/html; charset=utf-8");
  }
  if (p.startsWith("/i18n/") && p.endsWith(".json")) {
    res.headers.set("Content-Type", "application/json; charset=utf-8");
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
