/** Mağaza vitrininde yalnızca Atalay PDF kataloğu (PFOS/BESOS ayrı). */

export function isAtalayCatalogRow(row: {
  kaynak?: string;
  kaynak_fiyat_listesi?: string;
  brand?: string;
  b?: string;
  image?: string;
  images?: string[];
  img?: string;
} | null | undefined): boolean {
  if (!row) return false;
  const k = String(row.kaynak || row.kaynak_fiyat_listesi || "");
  if (/^atalay-2025/i.test(k)) return true;
  if (/atalay/i.test(String(row.brand || row.b || ""))) return true;
  let img = "";
  if (Array.isArray(row.images) && row.images[0]) img = String(row.images[0]);
  else img = String(row.image || row.img || "");
  img = img.replace(/\\/g, "/");
  if (/catalog\/atalay\//i.test(img)) return true;
  return false;
}
