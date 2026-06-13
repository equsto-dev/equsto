/**
 * urbanbar.com ürün sayfası HTML → yapılandırılmış PDP alanları
 */

export function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

export function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<[^>]+>/g, " "));
}

/** urbanbar.com göreli linkleri koru veya dış link bırak */
export function sanitizeProductHtml(html) {
  if (!html) return "";
  return String(html)
    .replace(/\sdata-start="[^"]*"/g, "")
    .replace(/\sdata-end="[^"]*"/g, "")
    .replace(/href="\/(blogs|pages|products|collections)([^"]*)"/gi, 'href="https://www.urbanbar.com/$1$2" target="_blank" rel="noopener noreferrer"')
    .trim();
}

export function extractRteSection(pageHtml, heading) {
  const re = new RegExp(
    `<h2[^>]*>\\s*${heading}:?\\s*<\\/h2>\\s*<div class="rte--product[^"]*"[^>]*>([\\s\\S]*?)<\\/div>`,
    "i",
  );
  const m = String(pageHtml || "").match(re);
  return m ? sanitizeProductHtml(m[1]) : "";
}

export function parseSpecListFromHtml(html) {
  const specs = [];
  const block = String(html || "");
  const liRe = /<li>([^<:]+):\s*([^<]*)<\/li>/gi;
  let m;
  while ((m = liRe.exec(block))) {
    const key = decodeHtml(m[1]);
    const value = decodeHtml(m[2]);
    if (key && value) specs.push({ key, value });
  }
  if (specs.length) return specs;

  // Fallback: düz metin "Weight:350g"
  for (const part of stripTags(block).split(/[,;]/)) {
    const idx = part.indexOf(":");
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key && value) specs.push({ key, value });
  }
  return specs;
}

export function parseDescriptionHtml(descriptionHtml) {
  const html = String(descriptionHtml || "");
  const introParts = [];
  const features = [];
  let featuresHtml = "";

  const featuresHeadingRe = /<h[34][^>]*>\s*Product Features:?\s*<\/h[34]>/i;
  const featuresMatch = html.match(featuresHeadingRe);

  if (featuresMatch) {
    const before = html.slice(0, featuresMatch.index);
    const after = html.slice(featuresMatch.index + featuresMatch[0].length);
    introParts.push(before.replace(/<h2[^>]*>[\s\S]*?<\/h2>/gi, "").trim());

    const ulMatch = after.match(/<ul>([\s\S]*?)<\/ul>/i);
    if (ulMatch) {
      featuresHtml = `<ul>${ulMatch[1]}</ul>`;
      const liRe = /<li>([\s\S]*?)<\/li>/gi;
      let m;
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
      const before = html.slice(0, html.indexOf("<ul>"));
      introParts.push(before.trim());
      featuresHtml = `<ul>${ulMatch[1]}</ul>`;
      const liRe = /<li>([\s\S]*?)<\/li>/gi;
      let m;
      while ((m = liRe.exec(ulMatch[1]))) {
        const text = stripTags(m[1]);
        if (text) features.push(text);
      }
    } else {
      introParts.push(html);
    }
  }

  const introHtml = sanitizeProductHtml(introParts.filter(Boolean).join("\n"));
  return {
    introHtml,
    features,
    featuresHtml: sanitizeProductHtml(featuresHtml),
  };
}

export function parsePagePdpDetails(pageHtml) {
  const html = String(pageHtml || "");
  const specificationsHtml = extractRteSection(html, "Specifications");
  const productCareHtml = extractRteSection(html, "Product Care");
  const safetyLabelsHtml = extractRteSection(html, "Product Safety Labels");

  const inStock =
    /\bIn stock\b/i.test(html) && !/\bOut of stock\b/i.test(html.slice(0, html.indexOf("Specifications") || html.length));

  return {
    specifications: parseSpecListFromHtml(specificationsHtml),
    specificationsHtml: specificationsHtml || "",
    productCareHtml,
    safetyLabelsHtml,
    inStock,
  };
}

export function variantFacts(variants) {
  const v = Array.isArray(variants) ? variants[0] : variants;
  if (!v) return {};
  const specs = [];
  if (v.grams != null && Number(v.grams) > 0) {
    specs.push({ key: "Weight", value: `${v.grams}g` });
  }
  if (v.sku) specs.push({ key: "SKU", value: String(v.sku) });
  return {
    sku: v.sku || "",
    priceGbp: v.priceGbp ?? null,
    available: v.available !== false,
    grams: v.grams ?? null,
    variantSpecs: specs,
  };
}

export function mergeSpecifications(pageSpecs, variantSpecs, extraSpecs = []) {
  const out = [];
  const seen = new Set();
  for (const list of [pageSpecs, variantSpecs, extraSpecs]) {
    for (const s of list || []) {
      const k = String(s.key || "").toLowerCase();
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push({ key: s.key, value: s.value });
    }
  }
  return out;
}
