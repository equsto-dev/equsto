/** PLP hover image — keep in sync with lib/besos/urbanbar/plp-images.ts */

const HOVER_SKIP =
  /(?:^|[/_-])(?:range|hbrange|dims?|size-?chart|scale|bottle-?compare|comparison|dimension|measure|detail|box-?\d|_b4\b|-b4\b)(?:[._-]|$)|(?:^|[/_-])box[\s-]?\d|-dims\./i;

const HOVER_PREFER =
  /(?:lifestyle|in-use|styled|serve|served|filled|drink|cocktail|pour|context|urban-bar-|bar-|^IMG_|_IMG|\bFizz_|[-_]2\.jpe?g$)/i;

export function shouldSkipUrbanBarPlpHover(url) {
  return HOVER_SKIP.test(url);
}

export function pickUrbanBarPlpHoverUrl(urls, defaultUrl) {
  return pickUrbanBarPlpHoverCandidates(urls, defaultUrl)[0] || "";
}

export function pickUrbanBarPlpHoverCandidates(urls, defaultUrl) {
  if (!urls?.length || urls.length < 2) return [];
  const rest = urls.filter((u) => u && u !== defaultUrl);
  if (!rest.length) return [];

  const ranked = [];

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
