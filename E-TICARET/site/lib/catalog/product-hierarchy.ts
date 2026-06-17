import type { Brand, Category, Product } from "@/lib/prisma";

export const EQUSTO_KOD_PREFIX = "EQ-";

/** Excel / import-export satırı — onaylı katalog hiyerarşisi */
export type ProductCatalogRow = {
  equsto_urun_kodu: string;
  /** Marka adı (görünen isim) */
  marka: string;
  /** Marka kodu (kısa kod: PIMAK, OZTI) */
  marka_kodu: string;
  /** Üretici ürün kodu (marka öneki olmadan) */
  urun_kodu: string;
  urun_kategori: string;
  urun_alt_kategori_1: string;
  urun_alt_kategori_2: string;
  urun_alt_kategori_3: string;
  urun_alt_kategori_4: string;
  /** depth ≥ 5 alt kategoriler (sınırsız derinlik) */
  urun_alt_kategori_n: string[];
  aciklama: string;
  detay: string;
  /** en × boy × yükseklik (mm) */
  olcu: string;
  genislik_mm: number | null;
  derinlik_mm: number | null;
  yukseklik_mm: number | null;
  /** KDV hariç, döviz cinsinden */
  fiyat_kdv_haric: number | null;
  doviz: string;
  kdv_oran: number | null;
};

export type CategoryPath = {
  urunKategori: string;
  altKategoriler: string[];
};

/** Ürün kodundan marka önekini kaldırır (PIMAK.19070.04 + PIMAK → 19070.04) */
export function normalizeUrunKodu(
  brandKod: string,
  urunKodu: string,
): string {
  const bk = String(brandKod || "").trim().toUpperCase();
  let uk = String(urunKodu || "").trim();
  if (!uk) return "";
  if (bk && uk.toUpperCase().startsWith(`${bk}.`)) {
    uk = uk.slice(bk.length + 1);
  }
  return uk;
}

/** EQ-{markaKodu}.{urunKodu} — örn. EQ-PIMAK.19070.04 */
export function buildEqustoKod(brandKod: string, urunKodu: string): string {
  const bk = String(brandKod || "").trim().toUpperCase();
  const uk = normalizeUrunKodu(bk, urunKodu);
  if (!uk) return "";
  const core = bk ? `${bk}.${uk}` : uk;
  if (core.startsWith(EQUSTO_KOD_PREFIX)) return core;
  return `${EQUSTO_KOD_PREFIX}${core}`;
}

/** EQ-PIMAK.19070.04 → { brandKod: PIMAK, urunKodu: 19070.04 } */
export function parseEqustoKod(equstoKod: string): {
  brandKod: string;
  urunKodu: string;
} {
  const raw = String(equstoKod || "").trim();
  const without = raw.startsWith(EQUSTO_KOD_PREFIX)
    ? raw.slice(EQUSTO_KOD_PREFIX.length)
    : raw;
  const dot = without.indexOf(".");
  if (dot <= 0) return { brandKod: "", urunKodu: without };
  return {
    brandKod: without.slice(0, dot).toUpperCase(),
    urunKodu: without.slice(dot + 1),
  };
}

export function categoryDepthLabel(depth: number): string {
  if (depth <= 0) return "Ürün kategori";
  if (depth <= 4) return `Ürün alt kategori ${depth}`;
  return `Ürün alt kategori ${depth}`;
}

/** Kökten yaprağa kategori adları (depth sıralı) */
export function buildCategoryPath(categories: Pick<Category, "name" | "depth">[]): CategoryPath {
  const sorted = [...categories].sort((a, b) => a.depth - b.depth);
  if (sorted.length === 0) {
    return { urunKategori: "", altKategoriler: [] };
  }
  return {
    urunKategori: sorted[0]?.name ?? "",
    altKategoriler: sorted.slice(1).map((c) => c.name),
  };
}

export function formatOlcuMm(
  genislikMm: number | null | undefined,
  derinlikMm: number | null | undefined,
  yukseklikMm: number | null | undefined,
): string {
  const w = genislikMm ?? null;
  const d = derinlikMm ?? null;
  const h = yukseklikMm ?? null;
  if (w == null && d == null && h == null) return "";
  return [w ?? "—", d ?? "—", h ?? "—"].join(" × ");
}

type ProductWithRelations = Product & {
  brand: Pick<Brand, "name" | "kod">;
  categoryPath?: Pick<Category, "name" | "depth">[];
};

/** Prisma ürün + kategori yolu → dışa aktarım satırı */
export function productToCatalogRow(
  product: ProductWithRelations,
  categoryPath: Pick<Category, "name" | "depth">[] = [],
): ProductCatalogRow {
  const path = buildCategoryPath(categoryPath);
  const brandKod = product.brand.kod ?? "";
  const urunKodu =
    product.urunKodu ??
    normalizeUrunKodu(brandKod, product.sku ?? product.modelCode ?? "");
  const equstoKod =
    product.equstoKod ?? buildEqustoKod(brandKod, urunKodu);
  const alt = path.altKategoriler;

  return {
    equsto_urun_kodu: equstoKod,
    marka: product.brand.name,
    marka_kodu: brandKod,
    urun_kodu: urunKodu,
    urun_kategori: path.urunKategori,
    urun_alt_kategori_1: alt[0] ?? "",
    urun_alt_kategori_2: alt[1] ?? "",
    urun_alt_kategori_3: alt[2] ?? "",
    urun_alt_kategori_4: alt[3] ?? "",
    urun_alt_kategori_n: alt.slice(4),
    aciklama: product.description ?? "",
    detay: product.detayliAciklama ?? "",
    olcu: formatOlcuMm(product.genislikMm, product.derinlikMm, product.yukseklikMm),
    genislik_mm: product.genislikMm,
    derinlik_mm: product.derinlikMm,
    yukseklik_mm: product.yukseklikMm,
    fiyat_kdv_haric:
      product.fiyatKdvHaricDoviz != null ? Number(product.fiyatKdvHaricDoviz) : null,
    doviz: product.dovizFiyat ?? product.dovizListe ?? "EUR",
    kdv_oran: product.kdvOran != null ? Number(product.kdvOran) : null,
  };
}

/** Yeni ürün oluştururken marka kodu + ürün kodu + Equsto kodu türet */
export function deriveProductCodes(input: {
  brandKod?: string | null;
  urunKodu?: string | null;
  sku?: string | null;
  modelCode?: string;
}): { urunKodu: string; equstoKod: string; modelCode: string } {
  const brandKod = String(input.brandKod || "").trim().toUpperCase();
  const raw = String(input.urunKodu || input.sku || input.modelCode || "").trim();
  const urunKodu = normalizeUrunKodu(brandKod, raw);
  const modelCode = brandKod && urunKodu ? `${brandKod}.${urunKodu}` : raw;
  return {
    urunKodu,
    equstoKod: buildEqustoKod(brandKod, urunKodu),
    modelCode: modelCode || raw,
  };
}
