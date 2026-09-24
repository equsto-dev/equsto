/** Kanonik site kökü — metadata, JSON fetch, feed linkleri */
export function getSiteOrigin(): string {
  const pub =
    process.env["NEXT_PUBLIC_SITE_ORIGIN"]?.trim() ||
    process.env["NEXT_PUBLIC_SITE_URL"]?.trim() ||
    "";
  if (pub) return pub.replace(/\/$/, "");
  return "https://equsto.com";
}
