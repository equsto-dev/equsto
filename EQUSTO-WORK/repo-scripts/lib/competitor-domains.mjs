/**
 * Rakip / bayi site domain ve marka listesi (katalog + runtime sanitize).
 */
export const COMPETITOR_HOSTS = [
  "kariyermutfak.com",
  "www.kariyermutfak.com",
  "cafemarkt.com",
  "www.cafemarkt.com",
  "globalmutfak.com",
  "www.globalmutfak.com",
  "iles.com.tr",
  "www.iles.com.tr",
];

const HOST_RE = new RegExp(
  COMPETITOR_HOSTS.map((h) => h.replace(/\./g, "\\.")).join("|"),
  "i"
);

export const RESELLER_BRAND_PATTERNS = [
  /^kariyer(\s*mutfak)?$/i,
  /^kariyermutfak$/i,
  /^cafemarkt$/i,
  /^global\s*mutfak$/i,
  /^iles(\s*end[uü]striyel)?$/i,
];

export function normTr(s) {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/\s+/g, " ")
    .trim();
}

export function isCompetitorHost(host) {
  const h = normTr(String(host || "").replace(/^www\./, ""));
  return COMPETITOR_HOSTS.some((d) => h === d.replace(/^www\./, "") || h.endsWith("." + d.replace(/^www\./, "")));
}

export function isCompetitorUrl(url) {
  const s = String(url ?? "").trim();
  if (!s) return false;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    return isCompetitorHost(u.hostname);
  } catch {
    return HOST_RE.test(s);
  }
}

export function isResellerBrand(brand) {
  const b = normTr(brand);
  if (!b) return false;
  if (b.includes("kariyermutfak") || b.includes("kariyer mutfak")) return true;
  return RESELLER_BRAND_PATTERNS.some((re) => re.test(b));
}

/** Metin içindeki rakip URL'leri yakala */
export function extractUrlsFromText(text) {
  const t = String(text ?? "");
  const re = /https?:\/\/[^\s<"')]+/gi;
  return t.match(re) || [];
}
