/** KİLİT: public/cdn-asset-urls-KILIT.txt — Faz B CloudFront img src */
import { SHOP_ASSET_V } from "@/lib/shop/assets";

/** docs/s3-upload-manifest.json cdnEnvHint — istemci güvenli (fs yok) */
const DEFAULT_CDN = "https://dqb0g8etbedva.cloudfront.net";

export function publicAssetCdnBase(): string {
  const env = process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim().replace(/\/$/, "");
  return env || DEFAULT_CDN;
}

function normalizePublicPath(path: string): string {
  const s = String(path || "").trim();
  if (!s || /^https?:\/\//i.test(s)) return s;
  return s.startsWith("/") ? s : `/${s}`;
}

function relFromPublicPath(publicPath: string): string {
  return publicPath.replace(/^\//, "");
}

function encodeRelPath(rel: string): string {
  return rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
}

/** Pimak katalog yolu → CDN'deki legacy equsto yolu (shop PLP ile uyumlu). */
function resolvePimakCatalogPath(publicPath: string): string {
  const norm = normalizePublicPath(publicPath);
  const rel = relFromPublicPath(norm);
  if (/^images\/catalog\/pimak\/davlumbaz-/i.test(rel)) {
    return norm.replace(/\/catalog\/pimak\//, "/catalog/equsto/");
  }
  if (/^images\/catalog\/pimak\/pimak-/i.test(rel)) {
    return norm.replace(/\/catalog\/pimak\/pimak-/, "/catalog/equsto/equsto-pimak-");
  }
  return norm;
}

export function isCdnPublicPath(publicPath: string): boolean {
  const rel = relFromPublicPath(publicPath);
  if (/^images\//i.test(rel)) return true;
  if (/^data\/caglayan-market\//i.test(rel)) return true;
  if (/^data\/prosogutma-market\//i.test(rel)) return true;
  if (/^data\/vitrum-drawings\//i.test(rel)) return true;
  if (/^data\/advanced-cuisine-clear-ice\//i.test(rel)) return true;
  if (/^data\/electrolux-professional\//i.test(rel)) return true;
  return false;
}

/** /images/… veya tam URL → CloudFront (Faz B) + cache bust */
export function publicAssetUrl(path: string, version = SHOP_ASSET_V): string {
  const norm = resolvePimakCatalogPath(normalizePublicPath(path));
  if (/^https?:\/\//i.test(norm)) {
    const sep = norm.includes("?") ? "&" : "?";
    return `${norm}${sep}v=${version}`;
  }

  let href = norm;
  if (isCdnPublicPath(norm)) {
    href = `${publicAssetCdnBase()}/${encodeRelPath(relFromPublicPath(norm))}`;
  }

  const sep = href.includes("?") ? "&" : "?";
  return `${href}${sep}v=${version}`;
}
