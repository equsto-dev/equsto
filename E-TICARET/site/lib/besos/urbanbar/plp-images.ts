import { besosAssetPath } from "@/lib/besos/asset-path";
import type { BesosUrbanBarProduct } from "@/lib/besos/urbanbar/types";

/** Size chart / comparison shots — not lifestyle hover */
const HOVER_SKIP = /(?:^|[/_-])(?:range|hbrange|size-?chart|scale|bottle-?compare|comparison|dimension|measure|box-?\d|_b4\b)(?:[._-]|$)|(?:^|[/_-])box[\s-]?\d/i;

/** Lifestyle / in-use product shots */
const HOVER_PREFER =
  /(?:lifestyle|in-use|styled|serve|served|filled|drink|cocktail|pour|context|urban-bar-|bar-)/i;

function normalizeUrl(img: string): string {
  const s = String(img || "").trim();
  if (!s) return "";
  if (s.startsWith("http")) return s;
  return besosAssetPath(s);
}

function collectUrls(product: BesosUrbanBarProduct): string[] {
  const urls: string[] = [];
  const push = (u?: string) => {
    const n = normalizeUrl(u || "");
    if (n && !urls.includes(n)) urls.push(n);
  };

  for (const u of product.imageUrls || []) push(u);
  for (const u of product.images || []) push(u);
  push(product.imageUrl);
  push(product.image);

  return urls;
}

export function pickUrbanBarPlpHoverUrl(urls: string[], defaultUrl: string): string {
  if (urls.length < 2) return "";
  const candidates = urls.filter((u) => u && u !== defaultUrl);
  if (!candidates.length) return "";

  const preferred = candidates.find((u) => HOVER_PREFER.test(u) && !HOVER_SKIP.test(u));
  if (preferred) return preferred;

  const lifestyle = candidates.find((u) => !HOVER_SKIP.test(u) && /\.jpe?g/i.test(u));
  if (lifestyle) return lifestyle;

  const notSkip = candidates.find((u) => !HOVER_SKIP.test(u));
  return notSkip || candidates[0] || "";
}

export function resolveUrbanBarPlpImages(product: BesosUrbanBarProduct): {
  defaultUrl: string;
  hoverUrl: string;
} {
  const urls = collectUrls(product);
  const defaultUrl = urls[0] || "";
  const hoverUrl = product.plpHoverImageUrl
    ? normalizeUrl(product.plpHoverImageUrl)
    : pickUrbanBarPlpHoverUrl(urls, defaultUrl);

  return { defaultUrl, hoverUrl: hoverUrl && hoverUrl !== defaultUrl ? hoverUrl : "" };
}
