import { db } from "@/lib/db";
import { PfosKategoriKodu, Doviz } from "@prisma/client";

export interface PfosProductDto {
  id: string;
  sku: string | null;
  slug: string;
  brand: string;
  name: string;
  priceListTl: number;
  pfosUrunTipi: string | null;
  pfosKategoriKodu: PfosKategoriKodu | null;
  image: string | null;
  equstoPage: string;
}

/**
 * Converts a database Product row to the standard PFOS DTO format.
 */
export function productToPfosDto(product: any): PfosProductDto {
  const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
  const imageUrl = primaryImage ? primaryImage.url : "/images/equsto-logo.png";
  
  return {
    id: product.id,
    sku: product.sku || product.modelCode,
    slug: product.slug,
    brand: product.brand?.name || "Equsto",
    name: product.name,
    priceListTl: Number(product.priceListTl || 0),
    pfosUrunTipi: product.pfosUrunTipi,
    pfosKategoriKodu: product.pfosKategoriKodu,
    image: imageUrl,
    equstoPage: `/shop/product/${product.slug}`
  };
}

/**
 * Gets the entire catalog of products active for PFOS.
 */
export async function pfosGetDbCatalog(brand?: string): Promise<PfosProductDto[]> {
  const whereClause: any = {
    pfosAktif: true,
    priceListTl: { gt: 0 },
    status: "PUBLISHED"
  };

  if (brand) {
    whereClause.brand = {
      slug: brand.toLowerCase()
    };
  }

  const products = await db.product.findMany({
    where: whereClause,
    include: {
      brand: true,
      images: {
        orderBy: {
          order: "asc"
        }
      }
    }
  });

  return products.map(productToPfosDto);
}

/**
 * Resolves a list of SHORT keys into database products, optionally filtered by a concept.
 */
export async function pfosResolveKeys(
  konseptSlug: string = "*",
  keys: string[]
): Promise<Array<{
  key: string;
  pfosUrunTipi: string;
  pfosKategoriKodu: PfosKategoriKodu | null;
  candidates: PfosProductDto[];
}>> {
  const resolved = [];

  for (const key of keys) {
    // 1. Find matching entries in PfosUrunTipiEslesme for the concept
    const eslesmeler = await db.pfosUrunTipiEslesme.findMany({
      where: {
        konseptSlug: { in: [konseptSlug, "*"] },
        pfosUrunTipi: key
      },
      orderBy: [
        { oncelik: "desc" }
      ],
      include: {
        product: {
          include: {
            brand: true,
            images: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    let candidates = eslesmeler
      .map(e => e.product)
      .filter(p => p.pfosAktif && p.status === "PUBLISHED" && Number(p.priceListTl || 0) > 0)
      .map(productToPfosDto);

    // 2. Fallback: If no custom mapping is set, look for any product matching the pfosUrunTipi directly
    if (candidates.length === 0) {
      const fallbackProducts = await db.product.findMany({
        where: {
          pfosUrunTipi: key,
          pfosAktif: true,
          status: "PUBLISHED",
          priceListTl: { gt: 0 }
        },
        include: {
          brand: true,
          images: {
            orderBy: { order: "asc" }
          }
        },
        take: 5
      });
      candidates = fallbackProducts.map(productToPfosDto);
    }

    const firstCandidate = candidates[0];

    resolved.push({
      key,
      pfosUrunTipi: key,
      pfosKategoriKodu: firstCandidate ? firstCandidate.pfosKategoriKodu : null,
      candidates
    });
  }

  return resolved;
}

/**
 * Generates a dynamic mapping of tip_kodu -> priceListTl based on primary product choices.
 */
export async function pfosGetFiyatMap(): Promise<Record<string, number>> {
  const map: Record<string, number> = {};

  // Load all unique pfosUrunTipi keys from active products
  const products = await db.product.findMany({
    where: {
      pfosAktif: true,
      status: "PUBLISHED",
      pfosUrunTipi: { not: null },
      priceListTl: { gt: 0 }
    },
    select: {
      pfosUrunTipi: true,
      priceListTl: true
    }
  });

  // Group and assign the lowest/economic price as the default mapping if there are multiples
  for (const p of products) {
    const tip = p.pfosUrunTipi!;
    const price = Number(p.priceListTl || 0);
    if (!map[tip] || price < map[tip]) {
      map[tip] = price;
    }
  }

  return map;
}

/**
 * Creates and stores a snapshot of a proforma offer in the database.
 */
export async function pfosCreateTeklifSnapshot(
  projeRef: string | null,
  kalemler: any
): Promise<any> {
  return db.pfosTeklifSnapshot.create({
    data: {
      projeRef,
      kalemler: kalemler as any
    }
  });
}
