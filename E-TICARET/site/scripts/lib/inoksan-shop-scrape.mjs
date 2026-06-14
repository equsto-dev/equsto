/**
 * inoksanshop.com.tr — ürün URL keşfi + PDP açıklama
 */
import { parseShopPdpHtml } from "./inoksan-pdp-parse.mjs";
import { skuCore } from "./inoksan-enrich.mjs";

export const SHOP_ORIGIN = "https://www.inoksanshop.com.tr";
export const SHOP_UA = "Mozilla/5.0 (Equsto; +https://equsto.com) InoksanShopImport/1.0";

export function normSkuCode(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/^INO-/i, "")
    .replace(/^INT-/i, "")
    .replace(/[^A-Z0-9]/g, "");
}

export function shopSkuVariants(sku) {
  const core = skuCore(sku);
  const n = normSkuCode(sku);
  const out = new Set([
    String(sku || "").trim().toUpperCase(),
    core.toUpperCase(),
    `INO-${core}`.toUpperCase(),
    `INT-${core}`.toUpperCase(),
    n,
  ]);
  return [...out].filter(Boolean);
}

export function absShopUrl(href) {
  const u = String(href || "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u.split("?")[0];
  return `${SHOP_ORIGIN}${u.startsWith("/") ? u : `/${u}`}`.split("?")[0];
}

export function extractShopSkuFromHtml(html) {
  const patterns = [
    /Stok\s*(?:Kodu|No|#)?\s*[:：]?\s*<[^>]*>\s*([A-Z0-9][A-Z0-9\-./]{2,40})/i,
    /Stok\s*(?:Kodu|No|#)?\s*[:：]?\s*([A-Z0-9][A-Z0-9\-./]{2,40})/i,
    /SKU\s*[:：]?\s*([A-Z0-9][A-Z0-9\-./]{2,40})/i,
    /"sku"\s*:\s*"([^"]+)"/i,
    /"StockCode"\s*:\s*"([^"]+)"/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim().toUpperCase();
  }
  return "";
}

export function extractProductLinksFromHtml(html) {
  const links = new Set();
  for (const m of html.matchAll(/href="(\/[^"#?]+|https:\/\/www\.inoksanshop\.com\.tr\/[^"#?]+)"/gi)) {
    const url = absShopUrl(m[1]);
    if (!url.includes("inoksanshop.com.tr")) continue;
    if (/\/(sepet|cart|login|hesap|iletisim|hakkimizda|arama|blog|yardim)(\/|$)/i.test(url)) continue;
    links.add(url);
  }
  return [...links];
}

export function findSkuInListingHtml(html, targetSku) {
  const variants = new Set(shopSkuVariants(targetSku));
  const upper = html.toUpperCase();
  for (const v of variants) {
    if (v.length >= 3 && upper.includes(v)) {
      const idx = upper.indexOf(v);
      const slice = html.slice(Math.max(0, idx - 800), idx + 800);
      const link = slice.match(/href="([^"]+)"/i)?.[1];
      if (link) return absShopUrl(link);
    }
  }
  return "";
}

export function parseShopProductPage(html, url) {
  const parsed = parseShopPdpHtml(html);
  if (!parsed) return null;
  return {
    ...parsed,
    url,
    shopSku: extractShopSkuFromHtml(html),
  };
}

export function skuMatchesPage(pageSku, catalogSku) {
  if (!pageSku || !catalogSku) return false;
  const a = new Set(shopSkuVariants(pageSku));
  const b = shopSkuVariants(catalogSku);
  return b.some((v) => a.has(v) || a.has(normSkuCode(v)));
}
