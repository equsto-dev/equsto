function normSku(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

/** PFOS teklif / UI — katalog görsel yolu → tarayıcı URL */
export function normalizePfosGorselUrl(
  url: string | null | undefined,
): string | null {
  const raw = String(url ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  let rel = raw.replace(/^\.\//, "").replace(/^\/+/, "");
  if (rel.startsWith("data/")) return `/${rel}`;
  if (rel.startsWith("images/")) return `/data/${rel}`;
  return raw.startsWith("/") ? raw : `/${raw}`;
}

/** Öztiryakiler SKU → `images/catalog/ozti/web/ozti-….jpg` (ozti-enrich ile hizalı) */
export function oztiWebImageRelFromSku(sku: string): string | null {
  const k = normSku(sku);
  if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return null;
  const slug =
    "ozti-" +
    k
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "");
  return `images/catalog/ozti/web/${slug}.jpg`;
}

/** Portashelf ölçü SKU → yuksel PDF INOX LIGHT görseli */
export function portashelfGorselRelFromSku(sku: string): string | null {
  const m = /^(\d+)-x-(\d+)-x-(\d+)$/i.exec(String(sku ?? "").trim());
  if (!m) return null;
  return `images/catalog/yuksel/yuksel-${m[1]}-x-${m[2]}-x-${m[3]}_1.jpg`;
}

/** Equsto SKU → `images/catalog/equsto/equsto-12070-08/` */
export function equstoGorselRelFromSku(sku: string): string | null {
  const k = normSku(sku);
  const m = /^EQUSTO\.(\d{4,5})\.(\d{2})$/i.exec(k);
  if (!m) return null;
  const slug = `equsto-${m[1]}-${m[2]}`.toLowerCase();
  return `images/catalog/equsto/${slug}`;
}
