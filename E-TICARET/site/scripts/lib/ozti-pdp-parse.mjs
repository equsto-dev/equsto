/**
 * oztiryakiler.com.tr — WP REST / WooCommerce PDP → açıklama + teknik tablo
 */
import { kodSoftKey, normKod } from "./ozti-enrich.mjs";

export function decodeHtmlEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

const KOD_IN_HTML =
  /(?:Ürün Kodu|Product Code|URUN\s*KODU)<\/th>\s*[\s\S]{0,80}?([0-9]{2,4}[A-Z0-9]*\.[A-Z0-9][A-Z0-9.\-]{1,48})/i;

/** Slug sonundan kod tahmini — 7865-n1-80908-10 → 7865.N1.80908.10; 79e3-46nmv-03 → 79E3.46NMV.03 */
export function kodFromOztiSlug(slug) {
  const s = String(slug || "").trim();
  const alnum = s.match(/-(\d{2,4}[a-z0-9]*)-((?:[a-z0-9]+-)+[a-z0-9]+)$/i);
  if (alnum) {
    return normKod(`${alnum[1]}.${alnum[2].replace(/-/g, ".")}`);
  }
  const m = s.match(/(\d{4})-([a-z0-9]+(?:-[a-z0-9]+)*)$/i);
  if (!m) return "";
  return normKod(`${m[1]}.${m[2].replace(/-/g, ".")}`);
}

export function extractOztiKodFromHtml(html, slug) {
  const src = String(html || "");
  const tdMatch = src.match(
    /<th[^>]*>\s*(?:Ürün Kodu|Product Code|URUN\s*KODU)\s*<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
  );
  if (tdMatch) {
    const kod = stripHtml(tdMatch[1]).replace(/\s+/g, "");
    if (kod && /[0-9A-Z]/i.test(kod)) return normKod(kod);
  }
  const m = src.match(KOD_IN_HTML);
  if (m) return normKod(m[1]);
  return kodFromOztiSlug(slug);
}

export function parseOztiExcerptBullets(excerptHtml) {
  const text = stripHtml(excerptHtml);
  return [...new Set(splitOztiBulletText(text))];
}

/** WP excerpt — satır, • veya " * " ile ayrılmış maddeler */
export function splitOztiBulletText(text) {
  const raw = String(text || "").trim();
  if (!raw) return [];
  let parts;
  if (/\n\s*[•·\-–—*]/.test(raw)) {
    parts = raw.split(/\n\s*[•·\-–—*]\s*/);
  } else if (/\s\*\s/.test(raw)) {
    parts = raw.split(/\s*\*\s+/);
  } else {
    parts = raw.split(/\r?\n/);
  }
  return parts
    .map((l) => l.replace(/^[•\-–—*·]+\s*/, "").trim())
    .filter((l) => l.length > 4);
}

/** content.rendered — tablo öncesi kısa açıklama */
export function parseOztiContentBullets(contentHtml) {
  const beforeTable = String(contentHtml || "").split(/<table/i)[0];
  if (!beforeTable || beforeTable.length < 20) return [];
  return parseOztiExcerptBullets(beforeTable);
}

/** Teknik tablo — th/td veya düz metin satırları */
export function parseOztiSpecsTable(contentHtml) {
  const html = String(contentHtml || "");
  const specs = [];
  const seen = new Set();

  for (const tr of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const th = tr[1].match(/<th[^>]*>([\s\S]*?)<\/th>/i)?.[1];
    const td = tr[1].match(/<td[^>]*>([\s\S]*?)<\/td>/i)?.[1];
    if (!th || !td) continue;
    const k = stripHtml(th).replace(/:$/, "");
    const v = stripHtml(td);
    if (!k || !v || /^ürün kodu$/i.test(k) || /^product code$/i.test(k)) continue;
    const line = `${k}: ${v}`;
    const key = k.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    specs.push(line);
  }

  return specs;
}

export function isOztiTurkishProduct(product) {
  const content = product?.content?.rendered || "";
  const link = String(product?.link || product?.guid?.rendered || "");
  if (/oztiryakiler\.com\.tr/i.test(link)) return true;
  if (/Ürün Kodu/i.test(content)) return true;
  if (/Product Code/i.test(content)) return false;
  return /[çğıöşüÇĞİÖŞÜ]/.test(`${product?.title?.rendered || ""}${product?.excerpt?.rendered || ""}`);
}

export function parseOztiWpProduct(product) {
  if (!product) return null;
  const excerpt = product.excerpt?.rendered || "";
  const content = product.content?.rendered || "";
  const kod = extractOztiKodFromHtml(content, product.slug);
  if (!kod) return null;

  const bullets = parseOztiExcerptBullets(excerpt);
  const allBullets = bullets.length ? bullets : parseOztiContentBullets(content);
  const specs = parseOztiSpecsTable(content);
  if (!allBullets.length && !specs.length) return null;

  const description = allBullets.length
    ? allBullets.map((b) => `* ${b}`).join("\n")
    : specs.slice(0, 12).map((s) => `* ${s}`).join("\n");

  const url =
    (product.link && /oztiryakiler\.com\.tr/i.test(product.link)
      ? product.link
      : product.guid?.rendered) || product.link || "";

  return {
    kod,
    kodSoft: kodSoftKey(kod),
    title: stripHtml(product.title?.rendered || ""),
    description,
    bullets: allBullets,
    specs,
    url: String(url || "").split("?")[0],
    wpId: product.id,
    slug: product.slug,
    lang: isOztiTurkishProduct(product) ? "tr" : "en",
    source: "oztiryakiler.com.tr",
  };
}

/** HTML PDP (yedek) — örnek: scripts/_tmp-ozti-page.html */
export function parseOztiPdpHtml(html, url) {
  const block =
    html.match(
      /class="woocommerce-product-details__short-description"[^>]*>([\s\S]*?)<\/div>/i,
    )?.[1] || "";
  const content =
    html.match(/id="teknikOzelliker"[\s\S]*?<table[^>]*>([\s\S]*?)<\/table>/i)?.[1] ||
    html.match(/<table class="product-details"[^>]*>([\s\S]*?)<\/table>/i)?.[1] ||
    "";

  const kod =
    extractOztiKodFromHtml(content, "") ||
    normKod(
      stripHtml(html.match(/class="product-code"[^>]*>([\s\S]*?)<\/h6>/i)?.[1] || "").replace(
        /-tr$/i,
        "",
      ),
    );

  if (!kod) return null;

  const bullets = parseOztiExcerptBullets(block);
  const specs = parseOztiSpecsTable(`<table>${content}</table>`);
  const description = bullets.length
    ? bullets.map((b) => `• ${b}`).join("\n")
    : specs.slice(0, 8).map((s) => `• ${s}`).join("\n");

  if (!description) return null;

  return {
    kod,
    kodSoft: kodSoftKey(kod),
    description,
    bullets,
    specs,
    url: url || "",
    source: "oztiryakiler.com.tr-html",
    lang: "tr",
  };
}
