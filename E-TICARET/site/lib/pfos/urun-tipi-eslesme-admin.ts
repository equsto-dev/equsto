import type { PfosKategoriKodu } from "@/lib/prisma";
import { db } from "@/lib/db";

export type PfosUrunTipiEslesmeRow = {
  id: string;
  konsept_slug: string;
  pfos_urun_tipi: string;
  pfos_kategori_kodu: string;
  pfos_alt_kod: string | null;
  product_id: string;
  product_sku: string | null;
  product_ad: string;
  oncelik: number;
  zorunlu: boolean;
};

export async function listPfosUrunTipiEslesme(opts?: {
  konseptSlug?: string;
  pfosUrunTipi?: string;
  limit?: number;
}): Promise<PfosUrunTipiEslesmeRow[]> {
  const limit = Math.min(Math.max(opts?.limit ?? 300, 1), 2000);
  const rows = await db.pfosUrunTipiEslesme.findMany({
    where: {
      ...(opts?.konseptSlug ? { konseptSlug: opts.konseptSlug.trim() } : {}),
      ...(opts?.pfosUrunTipi ? { pfosUrunTipi: opts.pfosUrunTipi.trim() } : {}),
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
    },
    orderBy: [{ konseptSlug: "asc" }, { pfosUrunTipi: "asc" }, { oncelik: "desc" }],
    take: limit,
  });

  return rows.map((r) => ({
    id: r.id,
    konsept_slug: r.konseptSlug,
    pfos_urun_tipi: r.pfosUrunTipi,
    pfos_kategori_kodu: r.pfosKategoriKodu,
    pfos_alt_kod: r.pfosAltKod,
    product_id: r.productId,
    product_sku: r.product.sku,
    product_ad: r.product.name,
    oncelik: r.oncelik,
    zorunlu: r.zorunlu,
  }));
}

export type UpsertUrunTipiEslesmeInput = {
  konseptSlug: string;
  pfosUrunTipi: string;
  pfosKategoriKodu: PfosKategoriKodu;
  productId: string;
  pfosAltKod?: string | null;
  oncelik?: number;
  zorunlu?: boolean;
};

export async function upsertPfosUrunTipiEslesme(
  input: UpsertUrunTipiEslesmeInput,
): Promise<PfosUrunTipiEslesmeRow> {
  const konseptSlug = input.konseptSlug.trim();
  const pfosUrunTipi = input.pfosUrunTipi.trim();
  const productId = input.productId.trim();
  if (!konseptSlug || !pfosUrunTipi || !productId) {
    throw new Error("konseptSlug, pfosUrunTipi ve productId zorunlu");
  }

  const row = await db.pfosUrunTipiEslesme.upsert({
    where: {
      konseptSlug_pfosUrunTipi_productId: {
        konseptSlug,
        pfosUrunTipi,
        productId,
      },
    },
    create: {
      konseptSlug,
      pfosUrunTipi,
      pfosKategoriKodu: input.pfosKategoriKodu,
      productId,
      pfosAltKod: input.pfosAltKod?.trim() || null,
      oncelik: input.oncelik ?? 0,
      zorunlu: !!input.zorunlu,
    },
    update: {
      pfosKategoriKodu: input.pfosKategoriKodu,
      pfosAltKod: input.pfosAltKod?.trim() || null,
      oncelik: input.oncelik ?? 0,
      zorunlu: !!input.zorunlu,
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
    },
  });

  return {
    id: row.id,
    konsept_slug: row.konseptSlug,
    pfos_urun_tipi: row.pfosUrunTipi,
    pfos_kategori_kodu: row.pfosKategoriKodu,
    pfos_alt_kod: row.pfosAltKod,
    product_id: row.productId,
    product_sku: row.product.sku,
    product_ad: row.product.name,
    oncelik: row.oncelik,
    zorunlu: row.zorunlu,
  };
}

export async function deletePfosUrunTipiEslesme(id: string): Promise<boolean> {
  const res = await db.pfosUrunTipiEslesme.deleteMany({ where: { id } });
  return res.count > 0;
}
