/**
 * prosogutma slug + Excel modüler uzunlukları → varyant listesi
 * (PDF/tablo boş kaldığında devreye girer)
 */
import { resolveSlugMap } from "./proso-prosogutma-slug-map.mjs";

function normFam(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/\s+V2\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Excel indeksinden aile adına göre tüm genişlikler (L: mm). */
export function widthsForExcelFams(index, excelFamList) {
  const widths = new Set();
  if (!index || !excelFamList?.length) return [];
  for (const fam of excelFamList) {
    const nf = normFam(fam);
    for (const key of index.keys()) {
      if (!key.startsWith(`${nf}|`)) continue;
      const w = Number(key.split("|")[1]);
      if (Number.isFinite(w) && w >= 625) widths.add(w);
    }
  }
  return [...widths].sort((a, b) => a - b);
}

/**
 * @param {{ slug?: string, title?: string, baslik?: string }} product
 * @param {Map<string, { fam: string, width: number }>} index
 */
export function expandVariantsFromSlugExcel(product, index) {
  const slug = product.slug;
  if (!slug || !index?.size) return [];

  const map = resolveSlugMap(slug);
  if (!map?.modelKod || !map.excelFam?.length) return [];

  const widths = widthsForExcelFams(index, map.excelFam);
  if (!widths.length && map.defaultWidth) widths.push(map.defaultWidth);
  if (!widths.length) return [];

  return widths.map((genislik_mm) => ({
    modelKod: map.modelKod,
    genislik_mm,
    derinlik_mm: 0,
    yukseklik_mm: 0,
  }));
}
