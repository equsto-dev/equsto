/** Kanonik site kökü — metadata, JSON fetch, feed linkleri */
export function getSiteOrigin(): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) {
    return prod.startsWith("http") ? prod.replace(/\/$/, "") : `https://${prod}`;
  }
  const url = process.env.VERCEL_URL?.trim();
  if (url) {
    return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  }
  const pub = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "https://equsto.com";
}
