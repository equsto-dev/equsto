/** CDN object storage — Faz B (public/images + büyük data medya) */

const CDN_PREFIXES = [
  "images/",
  "data/caglayan-market/",
  "data/prosogutma-market/",
  "data/vitrum-drawings/",
  "data/advanced-cuisine-clear-ice/images/",
] as const;

const CDN_THRESHOLD_BYTES = 1 * 1048576;

function normalizeRel(rel: string): string {
  return String(rel || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function encodeRelPath(rel: string): string {
  return normalizeRel(rel)
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
}

/** Vercel Blob / R2 public base — sonunda `/` yok */
export function getAssetCdnBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim() ||
    process.env.ASSET_CDN_URL?.trim() ||
    "";
  return raw.replace(/\/$/, "");
}

export function isCdnMigratePath(rel: string, bytes = 0): boolean {
  const r = normalizeRel(rel);
  if (!r) return false;
  if (r.startsWith("images/")) return true;
  for (const prefix of CDN_PREFIXES) {
    if (prefix === "images/") continue;
    if (r.startsWith(prefix)) return true;
  }
  if (r.startsWith("data/") && (r.endsWith(".pdf") || bytes > CDN_THRESHOLD_BYTES)) {
    return true;
  }
  return bytes > 5 * 1048576;
}

export function resolveCdnAssetUrl(pathOrUrl: string, bytes = 0): string {
  const s = String(pathOrUrl || "").trim();
  if (!s || /^https?:\/\//i.test(s)) return s;
  const base = getAssetCdnBase();
  if (!base) return "";

  let rel = normalizeRel(s);
  if (rel.startsWith("data/")) {
    if (!isCdnMigratePath(rel, bytes)) return "";
  } else if (!rel.startsWith("images/")) {
    if (/^catalog\//i.test(rel)) rel = `images/${rel}`;
    else return "";
  }
  if (!isCdnMigratePath(rel, bytes)) return "";
  return `${base}/${encodeRelPath(rel)}`;
}

export function absoluteAssetUrl(pathOrUrl: string, origin: string): string {
  const cdn = resolveCdnAssetUrl(pathOrUrl);
  if (cdn) return cdn;
  const s = String(pathOrUrl || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const base = origin.replace(/\/$/, "");
  return s.startsWith("/") ? `${base}${s}` : `${base}/${s}`;
}
