import { besosAssetPath } from "@/lib/besos/asset-path";
import { isUrbanBarLocalCatalogPath } from "@/lib/besos/urbanbar/gallery-images";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

/** Size chart / comparison / pack shots — not lifestyle hover */
const HOVER_SKIP =
  /(?:^|[/_-])(?:range|hbrange|dims?|size-?chart|scale|bottle-?compare|comparison|dimension|measure|detail|box-?\d|_b4\b|-b4\b)(?:[._-]|$)|(?:^|[/_-])box[\s-]?\d|-dims\./i;

/** Lifestyle / in-use product shots */
const HOVER_PREFER =
  /(?:lifestyle|in-use|styled|serve|served|filled|drink|cocktail|pour|context|urban-bar-|bar-|^IMG_|_IMG|\bFizz_|[-_]2\.jpe?g$)/i;

function normalizeUrl(img: string): string {
  const s = String(img || "").trim();
  if (!s) return "";
  if (isUrbanBarLocalCatalogPath(s)) return "";
  if (s.startsWith("http")) return s;
  return besosAssetPath(s);
}

function isShopifyCdn(url: string): boolean {
  return /cdn\.shopify\.com/i.test(url);
}

function collectUrls(product: BesosUrbanBarProduct): string[] {
  const urls: string[] = [];
  const push = (u?: string) => {
    const n = normalizeUrl(u || "");
    if (n && !urls.includes(n)) urls.push(n);
  };

  for (const u of product.imageUrls || []) push(u);
  push(product.imageUrl);
  for (const u of product.images || []) push(u);
  push(product.image);

  return urls;
}

export function shouldSkipUrbanBarPlpHover(url: string): boolean {
  return HOVER_SKIP.test(url);
}

export function pickUrbanBarPlpHoverUrl(urls: string[], defaultUrl: string): string {
  const candidates = pickUrbanBarPlpHoverCandidates(urls, defaultUrl);
  return candidates[0] || "";
}

export function pickUrbanBarPlpHoverCandidates(urls: string[], defaultUrl: string): string[] {
  if (urls.length < 2) return [];
  const rest = urls.filter((u) => u && u !== defaultUrl);
  if (!rest.length) return [];

  const ranked: string[] = [];

  // Urban Bar PLP: 2. görsel (index 1) hover — en yaygın kural
  if (urls[1] && urls[1] !== defaultUrl && !shouldSkipUrbanBarPlpHover(urls[1])) {
    ranked.push(urls[1]);
  }

  for (const u of rest) {
    if (HOVER_PREFER.test(u) && !shouldSkipUrbanBarPlpHover(u)) ranked.push(u);
  }

  for (const u of rest) {
    if (!shouldSkipUrbanBarPlpHover(u) && /\.(jpe?g|webp)$/i.test(u)) ranked.push(u);
  }

  for (const u of rest) {
    if (!shouldSkipUrbanBarPlpHover(u) && /\.png$/i.test(u)) ranked.push(u);
  }

  for (const u of rest) {
    if (!shouldSkipUrbanBarPlpHover(u)) ranked.push(u);
  }

  for (const u of rest) ranked.push(u);

  return [...new Set(ranked)];
}

export function resolveUrbanBarPlpImages(product: BesosUrbanBarProduct): {
  defaultUrl: string;
  hoverUrl: string;
  hoverCandidates: string[];
} {
  const urls = collectUrls(product);
  const defaultUrl = urls[0] || "";
  const hoverCandidates = product.plpHoverImageUrl
    ? [
        normalizeUrl(product.plpHoverImageUrl),
        ...pickUrbanBarPlpHoverCandidates(urls, defaultUrl),
      ].filter((u, i, arr) => u && u !== defaultUrl && arr.indexOf(u) === i)
    : pickUrbanBarPlpHoverCandidates(urls, defaultUrl);

  const hoverUrl = hoverCandidates[0] || "";

  return {
    defaultUrl,
    hoverUrl,
    hoverCandidates,
  };
}

export { isShopifyCdn };
