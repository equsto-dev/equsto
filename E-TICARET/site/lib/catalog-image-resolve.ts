import fs from "node:fs";
import path from "node:path";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const CAFEMARKT_IMG_DIR = "images/catalog/cafemarkt";

/** witcdn.cafemarkt.com/… → yerel katalog yolu */
export function cafemarktWitUrlToLocalRel(url: string): string {
  const m = String(url || "").match(/witcdn\.cafemarkt\.com\/([^?#]+)/i);
  if (!m) return "";
  try {
    return `${CAFEMARKT_IMG_DIR}/${decodeURIComponent(m[1])}`;
  } catch {
    return `${CAFEMARKT_IMG_DIR}/${m[1]}`;
  }
}

export function isWitCdnCafemarktUrl(url: string): boolean {
  return /witcdn\.cafemarkt\.com/i.test(String(url || ""));
}

export function localCatalogFileExists(rel: string): boolean {
  const norm = String(rel || "")
    .replace(/\\/g, "/")
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
  if (!norm.startsWith("images/")) return false;
  return fs.existsSync(path.join(PUBLIC_ROOT, norm));
}

/** Katalog satırı görseli → site kök yolu (/images/… veya /data/…). witcdn canlıda kullanılmaz. */
export function resolveCatalogImagePath(raw: string): string {
  const pick = String(raw || "").trim().replace(/\\/g, "/").replace(/^\.\//, "");
  if (!pick) return "";

  if (/^https?:\/\//i.test(pick)) {
    if (isWitCdnCafemarktUrl(pick)) {
      const rel = cafemarktWitUrlToLocalRel(pick);
      if (rel && localCatalogFileExists(rel)) return `/${rel}`;
      return "";
    }
    return pick;
  }

  if (pick.startsWith("data/")) return `/${pick}`;
  if (pick.startsWith("images/")) return `/${pick}`;
  if (pick.startsWith("/")) return pick;
  return `/data/${pick.replace(/^data\//, "")}`;
}

export function resolveCatalogImageFromRow(row: Record<string, unknown>): string {
  const imgs = row.images;
  if (!Array.isArray(imgs) || !imgs.length) return "";
  for (const raw of imgs) {
    const resolved = resolveCatalogImagePath(String(raw || ""));
    if (resolved) return resolved;
  }
  return "";
}
