/** Public asset path for Besos catalogue images and drawings. */
import { publicAssetUrl } from "@/lib/public-asset-url";

export function besosAssetPath(rel: string | undefined | null): string {
  if (!rel) return "";
  const s = String(rel).replace(/\\/g, "/").trim();
  if (/^https?:\/\//i.test(s)) return s;
  let local = s;
  if (/^vitrum-drawings\//i.test(s)) local = `/data/${s}`;
  else if (s.startsWith("/")) local = s;
  else if (/^data\//i.test(s)) local = `/${s.replace(/^\/+/, "")}`;
  else local = `/${s.replace(/^\.\//, "")}`;
  if (/^\/(images|data)\//i.test(local)) return publicAssetUrl(local);
  return local;
}

export function besosModuleHref(slug: string): string {
  return `/besos/modul/${encodeURIComponent(slug)}`;
}
