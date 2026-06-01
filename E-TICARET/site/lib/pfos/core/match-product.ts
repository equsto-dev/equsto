import type { PfosKategoriKodu } from "@/lib/prisma";
import { db } from "@/lib/db";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { olcuMmFromSku } from "../teklif/olcu-mm";
import { matchCatalogFallback, matchOzelImalatForSablon } from "./catalog-fallback";
import { isOzelImalatMotor } from "./ozel-imalat";

let dbPfosSeeded: boolean | null = null;
const matchCache = new Map<string, EslesmisUrun | null>();

async function dbHasPfosProducts(): Promise<boolean> {
  if (dbPfosSeeded !== null) return dbPfosSeeded;
  try {
    const count = await db.product.count({
      where: { pfosUrunTipi: { not: null }, pfosAktif: true },
      take: 1,
    });
    dbPfosSeeded = count > 0;
  } catch {
    dbPfosSeeded = false;
  }
  return dbPfosSeeded;
}

function cacheKey(
  urunTipi: string,
  kategoriKodu: string,
  fiyatStratejisi: FiyatStratejisi,
): string {
  return `${urunTipi}|${kategoriKodu}|${fiyatStratejisi}`;
}

function mapDoviz(currency: string | null | undefined): "EUR" | "TRY" | "USD" {
  const c = String(currency || "TRY").toUpperCase();
  if (c === "EUR" || c === "USD") return c;
  return "TRY";
}

function dec(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function productToEslesmis(product: {
  id: string;
  slug: string;
  sku: string | null;
  name: string;
  model: string | null;
  elektrikGucuKw: unknown;
  gazGucuKw: unknown;
  priceListTl: unknown;
  priceCurrency: string;
  dovizListe?: string | null;
  brand: { name: string };
  images: { url: string }[];
}): EslesmisUrun {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    ad: product.name,
    marka: product.brand.name,
    model: product.model,
    olcu: olcuMmFromSku(product.sku),
    elektrikGucuKw: dec(product.elektrikGucuKw),
    gazGucuKw: dec(product.gazGucuKw),
    fiyat: dec(product.priceListTl) ?? 0,
    doviz: mapDoviz(product.priceCurrency || product.dovizListe),
    gorselUrl: product.images[0]?.url ?? null,
  };
}

async function fallbackMatch(
  urunTipi: string,
  fiyatStratejisi: FiyatStratejisi,
  sablonIsim?: string | null,
): Promise<EslesmisUrun | null> {
  return matchCatalogFallback(urunTipi, fiyatStratejisi, sablonIsim);
}

export async function matchProductForMotor(
  urunTipi: string,
  kategoriKodu: string,
  fiyatStratejisi: FiyatStratejisi,
  sablonIsim?: string | null,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  const key = `${cacheKey(urunTipi, kategoriKodu, fiyatStratejisi)}|${String(sablonIsim ?? "")}`;
  if (matchCache.has(key)) return matchCache.get(key)!;

  if (isOzelImalatMotor({ sablonIsim, urunTipi })) {
    const ozel = await matchOzelImalatForSablon(
      String(sablonIsim ?? ""),
      urunTipi,
      notlar,
    );
    matchCache.set(key, ozel);
    return ozel;
  }

  if (!(await dbHasPfosProducts())) {
    const catalog = await fallbackMatch(urunTipi, fiyatStratejisi, sablonIsim);
    matchCache.set(key, catalog);
    return catalog;
  }

  const orderBy =
    fiyatStratejisi === "premium"
      ? ({ priceListTl: "desc" } as const)
      : ({ priceListTl: "asc" } as const);

  const product = await db.product.findFirst({
    where: {
      pfosUrunTipi: urunTipi,
      pfosKategoriKodu: kategoriKodu as PfosKategoriKodu,
      pfosAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
    },
    include: {
      brand: true,
      images: { where: { isPrimary: true }, take: 1, orderBy: { order: "asc" } },
    },
    orderBy,
  });

  if (!product) {
    const loose = await db.product.findFirst({
      where: {
        pfosUrunTipi: urunTipi,
        pfosAktif: true,
        status: "PUBLISHED",
        priceListTl: { gt: 0 },
      },
      include: {
        brand: true,
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy,
    });
    if (!loose) {
      const catalog = await fallbackMatch(urunTipi, fiyatStratejisi, sablonIsim);
      matchCache.set(key, catalog);
      return catalog;
    }
    const matched = productToEslesmis(loose);
    matchCache.set(key, matched);
    return matched;
  }

  const matched = productToEslesmis(product);
  matchCache.set(key, matched);
  return matched;
}

export function clearMatchProductCache(): void {
  matchCache.clear();
  dbPfosSeeded = null;
}
