/**
 * Faz B — CDN'e taşınacak public/ prefix'leri (S3, Blob, untrack ortak).
 */
import fs from "node:fs";
import path from "node:path";

export const CDN_PREFIXES = [
  "images/",
  "data/caglayan-market/",
  "data/prosogutma-market/",
  "data/vitrum-drawings/",
  "data/advanced-cuisine-clear-ice/images/",
  "data/electrolux-professional/",
];

const CDN_THRESHOLD_BYTES = 1 * 1048576;

export function isCdnMigrate(rel, bytes = 0) {
  if (rel.startsWith("images/")) return true;
  for (const prefix of CDN_PREFIXES) {
    if (prefix === "images/") continue;
    if (rel.startsWith(prefix)) return true;
  }
  if (rel.startsWith("data/") && (rel.endsWith(".pdf") || bytes > CDN_THRESHOLD_BYTES)) {
    return true;
  }
  return bytes > 5 * 1048576;
}

export function walkPublic(publicDir, base = publicDir, out = []) {
  if (!fs.existsSync(publicDir)) return out;
  for (const ent of fs.readdirSync(publicDir, { withFileTypes: true })) {
    const p = path.join(publicDir, ent.name);
    if (ent.isDirectory()) walkPublic(p, base, out);
    else {
      const rel = path.relative(base, p).replace(/\\/g, "/");
      const bytes = fs.statSync(p).size;
      out.push({ rel, bytes, abs: p });
    }
  }
  return out;
}

export function listCdnMigrateFiles(publicDir) {
  return walkPublic(publicDir).filter((f) => isCdnMigrate(f.rel, f.bytes));
}

export function cdnSyncDirs(publicDir) {
  return CDN_PREFIXES.map((prefix) => ({
    prefix,
    local: path.join(publicDir, prefix.replace(/\/$/, "")),
    s3Key: prefix.replace(/\/$/, ""),
  })).filter((d) => fs.existsSync(d.local));
}
