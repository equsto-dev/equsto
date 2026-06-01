import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** www → apex (SSL + tek kanonik host; Vercel domain + middleware). */
export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host === "www.equsto.com") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = "equsto.com";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css|woff2?|txt|xml|json)$).*)",
  ],
};
