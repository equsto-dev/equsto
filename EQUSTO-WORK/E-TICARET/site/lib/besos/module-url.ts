import type { BesosProduct } from "./types";

function stripDiacritics(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Legacy `vitrumModuleSlug` — slug from code when no explicit slug exists. */
export function vitrumModuleSlug(p: BesosProduct | null | undefined): string {
  if (!p) return "";
  if (p.slug?.trim()) return p.slug.trim();
  const raw = p.code || p.name || (p.page != null ? `modul-p${p.page}` : "");
  let slug = stripDiacritics(String(raw))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (p.page != null) slug = slug || `modul-p${p.page}`;
  return slug;
}

export function besosModuleHrefFromProduct(p: BesosProduct): string {
  const slug = vitrumModuleSlug(p);
  return slug ? `/besos/modul/${encodeURIComponent(slug)}` : "/besos";
}
