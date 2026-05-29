import { catalogUrlSlug } from "@/lib/catalog-product-slug";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import { resolveShopDept } from "@/lib/shop/category-dept";
import { isShopDeptSlug } from "@/lib/shop/depts";

export type CatalogRow = Record<string, unknown>;

export type MerchantFeedItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  priceTry: number;
  brand: string;
  mpn: string;
  availability: "in_stock" | "out_of_stock";
  productType: string;
};

export type MerchantFeedStats = {
  totalRows: number;
  included: number;
  skippedNoPrice: number;
  skippedQuoteOnly: number;
  skippedNoImage: number;
  skippedNoDept: number;
  skippedInvalid: number;
};

export function getSiteOrigin(): string {
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return prod.startsWith("http") ? prod.replace(/\/$/, "") : `https://${prod}`;
  const url = process.env.VERCEL_URL?.trim();
  if (url) return url.startsWith("http") ? url.replace(/\/$/, "") : `https://${url}`;
  const pub = process.env.NEXT_PUBLIC_SITE_ORIGIN?.trim();
  if (pub) return pub.replace(/\/$/, "");
  return "https://equsto.com";
}

function parseTrAmount(fragment: string): number {
  const n = parseFloat(
    String(fragment || "")
      .replace(/\.(?=\d{3}(\D|$))/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** KDV dahil TRY — Shopping için tüketici fiyatı. */
export function resolveMerchantPriceTry(row: CatalogRow): number {
  const fiyatTl = Number(row.fiyat_tl);
  const raw = String(row.price || "");

  const dahil = raw.match(/K\s*D\s*V\s*Dahil[^\d]*([\d.,]+)/i);
  if (dahil) {
    const v = parseTrAmount(dahil[1]);
    if (v > 0) return v;
  }

  const haric = raw.match(/([\d.,]+)\s*\+\s*K\s*D\s*V/i);
  if (haric) {
    const v = parseTrAmount(haric[1]);
    if (v > 0) return Math.round(v * 1.2 * 100) / 100;
  }

  if (Number.isFinite(fiyatTl) && fiyatTl > 0) {
    return Math.round(fiyatTl * 1.2 * 100) / 100;
  }

  const digits = raw.replace(/[^\d,.\-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  const n = parseFloat(digits);
  if (Number.isFinite(n) && n > 0) return Math.round(n * 100) / 100;

  return 0;
}

export function isQuoteOnlyProduct(row: CatalogRow): boolean {
  const p = String(row.price || "").toLowerCase();
  if (/teklif\s*için|fiyat\s*alınız|fiyat\s*aliniz|iletişime\s*geç|contact\s*for\s*price|price\s*on\s*request/i.test(p)) {
    return true;
  }
  if (/€|eur\b/.test(p) && !/₺|tl\b|try\b/i.test(p)) return true;
  return false;
}

function productImagePath(row: CatalogRow): string {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs.length) return "";
  const pick = pickMerchantHeroImage(imgs);
  if (!pick) return "";
  let rel = String(pick).replace(/\\/g, "/").replace(/^\.\//, "");
  if (rel.startsWith("http://") || rel.startsWith("https://")) return rel;
  if (rel.startsWith("data/")) rel = rel.slice(5);
  if (rel.startsWith("/")) return rel;
  if (rel.startsWith("images/")) return `/${rel}`;
  return `/data/${rel}`;
}

/** GMC: teknik çizim / kesit değil; kapak veya ilk foto. */
function isMerchantTechnicalImg(rel: string): boolean {
  const fn = String(rel || "").split("?")[0].split("/").pop()?.toLowerCase() || "";
  if (/kesit|wireframe|placeholder|model-\d+\./i.test(fn)) return true;
  return false;
}

function pickMerchantHeroImage(images: unknown[]): string {
  for (const raw of images) {
    const fn = String(raw || "").split("/").pop()?.toLowerCase() || "";
    if (/kapak/i.test(fn)) return String(raw);
  }
  for (const raw of images) {
    if (!isMerchantTechnicalImg(String(raw))) return String(raw);
  }
  return String(images[0] || "");
}

export function absoluteAssetUrl(pathOrUrl: string, origin: string): string {
  const s = String(pathOrUrl || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = origin.replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}

function cleanDescription(row: CatalogRow, maxLen = 5000): string {
  const parts = [
    String(row.name || ""),
    String(row.brand || ""),
    String(row.specs || ""),
    String(row.aciklama || ""),
  ].filter(Boolean);
  return parts
    .join("\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function feedTitle(row: CatalogRow): string {
  const name = String(row.name || "").trim();
  const brand = String(row.brand || "").trim();
  if (!name) return "";
  const combined = brand && !name.toLowerCase().includes(brand.toLowerCase().slice(0, 12))
    ? `${brand} ${name}`
    : name;
  return combined.slice(0, 150);
}

function feedId(row: CatalogRow, dept: string): string {
  const sku = String(row.sku || row.model || "").trim();
  if (sku) return sku.replace(/[^\w.\-+]/g, "_").slice(0, 50);
  const slug = catalogUrlSlug(row);
  return `${dept}__${slug}`.slice(0, 50);
}

export function rowToMerchantItem(
  row: CatalogRow,
  origin: string,
  opts?: { includeQuoteOnly?: boolean },
): MerchantFeedItem | null {
  if (opts?.includeQuoteOnly !== true && isQuoteOnlyProduct(row)) return null;

  const dept = resolveShopDept(row);
  if (!dept || !isShopDeptSlug(dept)) return null;

  const slug = catalogUrlSlug(row);
  if (!slug) return null;

  const title = feedTitle(row);
  if (!title) return null;

  const priceTry = resolveMerchantPriceTry(row);
  if (!(priceTry > 0)) return null;

  const imagePath = productImagePath(row);
  if (!imagePath) return null;

  const link = `${origin}/shop/${dept}/${encodeURIComponent(slug)}`;
  const brand = String(row.brand || "Equsto").trim().slice(0, 70);
  const mpn = String(row.sku || row.model || slug).trim().slice(0, 70);

  return {
    id: feedId(row, dept),
    title,
    description: cleanDescription(row),
    link,
    imageLink: absoluteAssetUrl(imagePath, origin),
    priceTry,
    brand,
    mpn,
    availability: "in_stock",
    productType: String(row.category || dept).slice(0, 100),
  };
}

export async function loadCatalogRows(): Promise<CatalogRow[]> {
  const raw = await loadEkipmanlarJson();
  return Array.isArray(raw) ? (raw as CatalogRow[]) : [];
}

export async function buildMerchantFeedItems(opts?: {
  includeQuoteOnly?: boolean;
  limit?: number;
}): Promise<{ items: MerchantFeedItem[]; stats: MerchantFeedStats }> {
  const origin = getSiteOrigin();
  const rows = await loadCatalogRows();
  const stats: MerchantFeedStats = {
    totalRows: rows.length,
    included: 0,
    skippedNoPrice: 0,
    skippedQuoteOnly: 0,
    skippedNoImage: 0,
    skippedNoDept: 0,
    skippedInvalid: 0,
  };

  const items: MerchantFeedItem[] = [];
  const seenIds = new Set<string>();

  for (const row of rows) {
    if (opts?.includeQuoteOnly !== true && isQuoteOnlyProduct(row)) {
      stats.skippedQuoteOnly++;
      continue;
    }

    const dept = resolveShopDept(row);
    if (!dept || !isShopDeptSlug(dept)) {
      stats.skippedNoDept++;
      continue;
    }

    if (!productImagePath(row)) {
      stats.skippedNoImage++;
      continue;
    }

    if (resolveMerchantPriceTry(row) <= 0) {
      stats.skippedNoPrice++;
      continue;
    }

    const item = rowToMerchantItem(row, origin, opts);
    if (!item) {
      stats.skippedInvalid++;
      continue;
    }

    if (seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    items.push(item);

    if (opts?.limit && items.length >= opts.limit) break;
  }

  stats.included = items.length;
  return { items, stats };
}

export function escapeXml(text: string): string {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatGooglePriceTry(amount: number): string {
  return `${amount.toFixed(2)} TRY`;
}

export function buildGoogleMerchantXml(items: MerchantFeedItem[], origin: string): string {
  const channelTitle = "Equsto — Endüstriyel Mutfak Ekipmanları";
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "  <channel>",
    `    <title>${escapeXml(channelTitle)}</title>`,
    `    <link>${escapeXml(origin)}</link>`,
    `    <description>${escapeXml("Equsto katalog ürün feed — Google Merchant Center")}</description>`,
  ];

  for (const item of items) {
    lines.push("    <item>");
    lines.push(`      <g:id>${escapeXml(item.id)}</g:id>`);
    lines.push(`      <g:title>${escapeXml(item.title)}</g:title>`);
    lines.push(`      <g:description>${escapeXml(item.description)}</g:description>`);
    lines.push(`      <g:link>${escapeXml(item.link)}</g:link>`);
    lines.push(`      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`);
    lines.push("      <g:condition>new</g:condition>");
    lines.push(`      <g:availability>${item.availability}</g:availability>`);
    lines.push(`      <g:price>${escapeXml(formatGooglePriceTry(item.priceTry))}</g:price>`);
    lines.push(`      <g:brand>${escapeXml(item.brand)}</g:brand>`);
    if (item.mpn) lines.push(`      <g:mpn>${escapeXml(item.mpn)}</g:mpn>`);
    lines.push("      <g:identifier_exists>false</g:identifier_exists>");
    if (item.productType) {
      lines.push(`      <g:product_type>${escapeXml(item.productType)}</g:product_type>`);
    }
    lines.push("    </item>");
  }

  lines.push("  </channel>", "</rss>");
  return lines.join("\n");
}

export async function buildGoogleMerchantFeedXml(opts?: {
  includeQuoteOnly?: boolean;
  limit?: number;
}): Promise<{ xml: string; stats: MerchantFeedStats; origin: string }> {
  const origin = getSiteOrigin();
  const { items, stats } = await buildMerchantFeedItems(opts);
  const xml = buildGoogleMerchantXml(items, origin);
  return { xml, stats, origin };
}
