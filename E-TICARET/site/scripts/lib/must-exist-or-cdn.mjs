/**
 * Deploy kilidi — dosya diskte yoksa CloudFront/S3 (Faz B untrack sonrası).
 */
import fs from "node:fs";
import path from "node:path";
import { assetCdnBase } from "./asset-cdn-base.mjs";

function encodeRel(rel) {
  return rel
    .split("/")
    .map((seg) => (seg ? encodeURIComponent(seg) : ""))
    .join("/");
}

/** public/images/foo.png → images/foo.png */
function publicRel(rel) {
  return rel.replace(/^public[/\\]/, "").replace(/\\/g, "/");
}

export async function mustExistOrCdn(siteDir, rel, fail, logPrefix = "[verify]") {
  const abs = path.join(siteDir, rel);
  if (fs.existsSync(abs)) return;

  const base = assetCdnBase(siteDir);
  if (!base) {
    fail(`eksik dosya: ${rel} (CDN env yok — NEXT_PUBLIC_ASSET_CDN_URL veya manifest)`);
    return;
  }

  const url = `${base}/${encodeRel(publicRel(rel))}`;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.ok) {
      console.log(`${logPrefix} CDN OK: ${publicRel(rel)}`);
      return;
    }
    fail(`eksik dosya: ${rel} (CDN ${res.status})`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    fail(`eksik dosya: ${rel} (CDN: ${msg})`);
  }
}
