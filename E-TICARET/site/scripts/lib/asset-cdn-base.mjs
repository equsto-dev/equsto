/**
 * CloudFront kökü — env önce, yoksa docs/s3-upload-manifest.json (Faz B Vercel build).
 */
import fs from "node:fs";
import path from "node:path";

export function assetCdnBase(siteDir) {
  const fromEnv = (
    process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim() ||
    process.env.AWS_CLOUDFRONT_URL?.trim() ||
    process.env.ASSET_CDN_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (!siteDir) return "";
  try {
    const manifestPath = path.join(siteDir, "docs/s3-upload-manifest.json");
    const hint = JSON.parse(fs.readFileSync(manifestPath, "utf8")).cdnEnvHint;
    if (typeof hint === "string" && /^https?:\/\//i.test(hint)) {
      return hint.replace(/\/$/, "");
    }
  } catch {
    /* manifest yok veya bozuk */
  }
  return "";
}

/** Vercel/CI — env boşsa manifest'ten doldur (build + verify). */
export function ensureAssetCdnEnv(siteDir) {
  if (process.env.NEXT_PUBLIC_ASSET_CDN_URL?.trim()) return assetCdnBase(siteDir);
  const base = assetCdnBase(siteDir);
  if (base) {
    process.env.NEXT_PUBLIC_ASSET_CDN_URL = base;
    console.log("[asset-cdn] NEXT_PUBLIC_ASSET_CDN_URL ← docs/s3-upload-manifest.json");
  }
  return base;
}
