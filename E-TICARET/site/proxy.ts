import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveBrandRedirectPath } from "./lib/brand-shop-redirect";

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
  "kuvetler",
  "market-reyonlari",
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
  "/en",
  "/en/pfos",
  "/en/besos",
  "/en/contact",
  "/en/login",
  "/en/admin",
  "/en/marka",
  "/en/arama",
  "/en/search",
  "/en/cart",
  "/en/about",
  "/en/project-factory",
  "/en/story",
  "/en/hakkimizda",
  "/en/buradan-basladi",
  "/en/sepet",
]);

function isLegacyHtmlPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, "") || "/";
  if (p.startsWith("/api") || p.startsWith("/_next") || p.startsWith("/yonetim")) {
    return false;
  }
  if (p.endsWith(".html")) return true;
  if (EXACT_HTML.has(p)) return true;
  if (DEPT_SLUGS.some((s) => p === `/shop/${s}` || p === `/en/shop/${s}`)) return true;
  if (p.startsWith("/en/shop/") && p.split("/").length >= 5) return true;
  if (p.startsWith("/en/besos/modul/")) return true;
  if (
    p.startsWith("/steakhouse") ||
    p.startsWith("/bulut-mutfak") ||
    p.startsWith("/cafe-kurulumu") ||
    p.startsWith("/catering") ||
    p.startsWith("/fine-dining") ||
    p.startsWith("/all-day-dining") ||
    p.startsWith("/fast-food") ||
    p.startsWith("/market-kasap") ||
    p.startsWith("/projeler") ||
    p.startsWith("/rehber/") ||
    p.startsWith("/endustriyel-mutfak") ||
    p.startsWith("/restoran-mutfak") ||
    p.startsWith("/otel-mutfak") ||
    p.startsWith("/oztiryakiler-ekipmani") ||
    p.startsWith("/soguk-oda") ||
    p.startsWith("/havuzlu-dolap") ||
    p.startsWith("/endustriyel-pisirme") ||
    p.startsWith("/mutfak-teklif-platformu") ||
    p.startsWith("/bar-tasarimi") ||
    p === "/blog" ||
    p === "/buradan-basladi" ||
    p.startsWith("/hakkimizda") ||
    p === "/en/blog" ||
    p.startsWith("/en/projects") ||
    p.startsWith("/en/guides/") ||
    /^\/en\/(steakhouse|cloud|cafe|catering|fast-food|fine-dining|all-day|market|industrial|commercial|restaurant|hotel|oztiryakiler|cold|deli|kitchen|bar)-/.test(
      p
    )
  ) {
    return true;
  }
  return false;
}

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
