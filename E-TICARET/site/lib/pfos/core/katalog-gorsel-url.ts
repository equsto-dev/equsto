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

/** ax-images 404 — aynı ürün ailesi (eq-site-urls.js OZTI_AX_PROXY ile hizalı) */
const OZTI_AX_PROXY: Record<string, string> = {
  "2919.0B390.AD01.00": "7506.0B390.00",
  "7919.47NTV.C2": "7919.37NTV.C2",
  "7919.46NTV.C2": "7919.37NTV.C2",
  "7919.47NTV.C1": "7919.37NTV.C1",
  "7919.46NTV.C1": "7919.37NTV.C1",
  "7919.36NTV.C2": "7919.36NTV.24",
  "7919.27NTV.C2": "7919.27NTV.24",
  "7919.26NTV.C2": "7919.26NTV.24",
  "7919.36NTV.C1": "7919.36NTV.24",
  "7919.27NTV.C1": "7919.27NTV.24",
  "7919.26NTV.C1": "7919.26NTV.24",
  "7919.47NTV.T1": "7919.27NTV.T1",
  "7919.37NTV.T1": "7919.27NTV.T1",
};

export function oztiAxProxyKod(sku: string): string {
  const k = normSku(sku);
  if (OZTI_AX_PROXY[k]) return OZTI_AX_PROXY[k];
  const m = k.match(/^7919\.(\d{2})NTV\.(C1|C2|T1)$/);
  if (!m) return k;
  if (m[2] === "T1" && m[1] === "27") return k;
  if (m[2] === "T1" && (m[1] === "37" || m[1] === "47" || m[1] === "46"))
    return "7919.27NTV.T1";
  if (parseInt(m[1], 10) >= 46)
    return m[2] === "C1" ? "7919.37NTV.C1" : "7919.37NTV.C2";
  if (m[2] === "C1" || m[2] === "C2") return k;
  return `7919.${m[1]}NTV.24`;
}

/** Öztiryakiler ax-images CDN — yerel dosya yokken proforma / PDF */
export function oztiAxImageUrlFromSku(sku: string): string | null {
  const k = normSku(sku);
  if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return null;
  const proxy = oztiAxProxyKod(k);
  return `https://oztiryakiler.com.tr/ax-images/images/${encodeURIComponent(proxy)}.jpg`;
}

/**
 * PFOS proforma — Öztiryakiler ax-images tercih (CloudFront yerel kopyalar eski/stub olabilir).
 * NTV cihazaltı C1/C2/T1 ve proxy tablosundaki kodlar için.
 */
export function oztiPfosPreferredGorselUrl(sku: string): string | null {
  const k = normSku(sku);
  if (!/^7919\./i.test(k)) return null;
  if (OZTI_AX_PROXY[k] || /NTV\.(C1|C2|T1)/i.test(k)) {
    return oztiAxImageUrlFromSku(k);
  }
  return null;
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

export {
  PORTASHELF_304_GORSEL_REL,
  portashelfGorselRelFromSku,
} from "./portashelf-fiyat";

/** Equsto SKU → `images/catalog/equsto/equsto-12070-08/` */
export function equstoGorselRelFromSku(sku: string): string | null {
  const k = normSku(sku);
  const m = /^EQUSTO\.(\d{4,5})\.(\d{2})$/i.exec(k);
  if (!m) return null;
  const slug = `equsto-${m[1]}-${m[2]}`.toLowerCase();
  return `images/catalog/equsto/${slug}`;
}
