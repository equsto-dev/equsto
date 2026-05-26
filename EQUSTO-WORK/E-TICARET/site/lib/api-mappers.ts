import type { Product, Brand, Category, ProductImage } from "@/lib/prisma";

export type ProductWithRelations = Product & {
  brand: Brand;
  category: Category;
  images: ProductImage[];
};

/** admin.html / ecom-data.js ile uyumlu ürün DTO */
export function productToAdminDto(p: ProductWithRelations) {
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    modelCode: p.modelCode,
    name: p.name,
    description: p.description ?? "",
    brand: p.brand.slug,
    brandName: p.brand.name,
    category: p.category.slug,
    categoryName: p.category.name,
    specs: p.specs,
    priceListTl: p.priceListTl != null ? Number(p.priceListTl) : null,
    priceCurrency: p.priceCurrency,
    status: p.status,
    image: primary?.url ?? null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt, order: i.order })),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function productToSearchDoc(p: ProductWithRelations) {
  return {
    id: p.id,
    slug: p.slug,
    modelCode: p.modelCode,
    name: p.name,
    brand: p.brand.name,
    brandSlug: p.brand.slug,
    category: p.category.name,
    categorySlug: p.category.slug,
    description: p.description ?? "",
    status: p.status,
  };
}
