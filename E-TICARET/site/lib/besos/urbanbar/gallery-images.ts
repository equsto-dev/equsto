/** Urban Bar yerel katalog görselleri henüz deploy edilmediyse atla — Shopify CDN yeterli
 * KİLİT: public/besos-urbanbar-images-KILIT.txt */
export function isUrbanBarLocalCatalogPath(url: string): boolean {
  const s = String(url || "").trim();
  return !/^https?:\/\//i.test(s) && /(^|\/)images\/catalog\/urbanbar\//i.test(s);
}

export function resolveUrbanBarGalleryImages(urls: (string | undefined | null)[]): string[] {
  const out: string[] = [];
  for (const raw of urls) {
    const s = String(raw ?? "").trim();
    if (!s || isUrbanBarLocalCatalogPath(s)) continue;
    const resolved = /^https?:\/\//i.test(s) ? s : s.startsWith("/") ? s : `/${s}`;
    if (!out.includes(resolved)) out.push(resolved);
  }
  return out;
}
