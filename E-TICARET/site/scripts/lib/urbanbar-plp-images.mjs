/** PLP hover image — keep in sync with lib/besos/urbanbar/plp-images.ts */

const HOVER_SKIP =
  /(?:^|[/_-])(?:range|hbrange|size-?chart|scale|bottle-?compare|comparison|dimension|measure|box-?\d|_b4\b)(?:[._-]|$)|(?:^|[/_-])box[\s-]?\d/i;

const HOVER_PREFER =
  /(?:lifestyle|in-use|styled|serve|served|filled|drink|cocktail|pour|context|urban-bar-|bar-)/i;

export function pickUrbanBarPlpHoverUrl(urls, defaultUrl) {
  if (!urls?.length || urls.length < 2) return "";
  const candidates = urls.filter((u) => u && u !== defaultUrl);
  if (!candidates.length) return "";

  const preferred = candidates.find((u) => HOVER_PREFER.test(u) && !HOVER_SKIP.test(u));
  if (preferred) return preferred;

  const lifestyle = candidates.find((u) => !HOVER_SKIP.test(u) && /\.jpe?g/i.test(u));
  if (lifestyle) return lifestyle;

  const notSkip = candidates.find((u) => !HOVER_SKIP.test(u));
  return notSkip || candidates[0] || "";
}
