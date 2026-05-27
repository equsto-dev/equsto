/** Public asset path for Besos catalogue images and drawings. */
export function besosAssetPath(rel: string | undefined | null): string {
  if (!rel) return "";
  const s = String(rel).replace(/\\/g, "/").trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  if (/^vitrum-drawings\//i.test(s)) return `/data/${s}`;
  if (/^data\//i.test(s)) return `/${s.replace(/^data\//, "data/")}`;
  return `/${s.replace(/^\.\//, "")}`;
}

export function besosModuleHref(slug: string): string {
  return `/besos/modul/${encodeURIComponent(slug)}`;
}
