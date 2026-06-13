export type UrbanBarSpec = { key: string; value: string };

export function decodeHtml(s: string): string {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

export function stripTags(html: string): string {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
}

export function sanitizeProductHtml(html: string): string {
  if (!html) return "";
  return String(html)
    .replace(/\sdata-start="[^"]*"/g, "")
    .replace(/\sdata-end="[^"]*"/g, "")
    .replace(
      /href="\/(blogs|pages|products|collections)([^"]*)"/gi,
      'href="https://www.urbanbar.com/$1$2" target="_blank" rel="noopener noreferrer"',
    )
    .trim();
}

export function parseDescriptionHtml(descriptionHtml: string): {
  introHtml: string;
  features: string[];
  featuresHtml: string;
} {
  const html = String(descriptionHtml || "");
  const introParts: string[] = [];
  const features: string[] = [];
  let featuresHtml = "";

  const featuresHeadingRe = /<h[34][^>]*>\s*Product Features:?\s*<\/h[34]>/i;
  const featuresMatch = html.match(featuresHeadingRe);

  if (featuresMatch?.index != null) {
    const before = html.slice(0, featuresMatch.index);
    const after = html.slice(featuresMatch.index + featuresMatch[0].length);
    introParts.push(before.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "").trim());

    const ulMatch = after.match(/<ul>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      featuresHtml = `<ul>${ulMatch[1]}</ul>`;
      const liRe = /<li>([\s\S]*?)<\/li>/gi;
      let m: RegExpExecArray | null;
      while ((m = liRe.exec(ulMatch[1]))) {
        const text = stripTags(m[1]);
        if (text) features.push(text);
      }
    } else {
      introParts.push(after);
    }
  } else {
    const ulMatch = html.match(/<ul>([\s\S]*?)<\/ul>/i);
    if (ulMatch && html.indexOf("<ul>") < 800) {
      introParts.push(html.slice(0, html.indexOf("<ul>")).trim());
      featuresHtml = `<ul>${ulMatch[1]}</ul>`;
      const liRe = /<li>([\s\S]*?)<\/li>/gi;
      let m: RegExpExecArray | null;
      while ((m = liRe.exec(ulMatch[1]))) {
        const text = stripTags(m[1]);
        if (text) features.push(text);
      }
    } else {
      introParts.push(html);
    }
  }

  return {
    introHtml: sanitizeProductHtml(introParts.filter(Boolean).join("\n")),
    features,
    featuresHtml: sanitizeProductHtml(featuresHtml),
  };
}

export function mergeSpecifications(...lists: UrbanBarSpec[][]): UrbanBarSpec[] {
  const out: UrbanBarSpec[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const s of list || []) {
      const k = String(s.key || "").toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push({ key: s.key, value: s.value });
    }
  }
  return out;
}
