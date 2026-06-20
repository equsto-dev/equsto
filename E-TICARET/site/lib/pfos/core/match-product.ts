import type { PfosKategoriKodu, Product, Brand, ProductImage } from "@/lib/prisma";
import { db } from "@/lib/db";
import type { EslesmisUrun, FiyatStratejisi } from "../schemas/pfos.schema";
import { olcuMmFromSku } from "../teklif/olcu-mm";
import { matchCatalogFallback, matchOzelImalatForSablon } from "./catalog-fallback";
import { invalidateEqustoFiyatListesiPfosCache } from "./equsto-fiyat-listesi-pfos";
import { isOzelImalatMotor } from "./ozel-imalat";
import { resolveTipKodu } from "./tip-kodu";

type CachedProduct = Product & {
  brand: Brand;
  images: ProductImage[];
};

let dbPfosSeeded: boolean | null = null;
const matchCache = new Map<string, EslesmisUrun | null>();

let globalProductsCache: CachedProduct[] | null = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

async function getCachedPfosProducts(): Promise<CachedProduct[]> {
  const now = Date.now();
  if (globalProductsCache && (now - cacheFetchedAt) < CACHE_TTL_MS) {
    return globalProductsCache;
  }

  const products = await db.product.findMany({
    where: {
      pfosAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
    },
    include: {
      brand: true,
      images: {
        where: { isPrimary: true },
        take: 1,
        orderBy: { order: "asc" },
      },
    },
  });

  globalProductsCache = products as CachedProduct[];
  cacheFetchedAt = now;
  dbPfosSeeded = products.length > 0;
  return globalProductsCache;
}

async function dbHasPfosProducts(): Promise<boolean> {
  if (dbPfosSeeded !== null) return dbPfosSeeded;
  try {
    const products = await getCachedPfosProducts();
    dbPfosSeeded = products.length > 0;
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
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  return matchCatalogFallback(urunTipi, fiyatStratejisi, sablonIsim, notlar);
}

function typesMatch(dbType: string | null | undefined, reqType: string): boolean {
  if (!dbType) return false;
  return resolveTipKodu(dbType) === resolveTipKodu(reqType);
}

export async function matchProductForMotor(
  urunTipi: string,
  kategoriKodu: string,
  fiyatStratejisi: FiyatStratejisi,
  sablonIsim?: string | null,
  notlar?: string | null,
): Promise<EslesmisUrun | null> {
  const key = `${cacheKey(urunTipi, kategoriKodu, fiyatStratejisi)}|${String(sablonIsim ?? "")}|${String(notlar ?? "")}`;
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
    const catalog = await fallbackMatch(
      urunTipi,
      fiyatStratejisi,
      sablonIsim,
      notlar,
    );
    matchCache.set(key, catalog);
    return catalog;
  }

  const allProducts = await getCachedPfosProducts();

  const sortFn = (a: CachedProduct, b: CachedProduct) => {
    const priceA = Number(a.priceListTl) || 0;
    const priceB = Number(b.priceListTl) || 0;
    return fiyatStratejisi === "premium" ? priceB - priceA : priceA - priceB;
  };

  // 1. Strict Match: both pfosUrunTipi and pfosKategoriKodu match
  const strictCandidates = allProducts.filter(
    (p) =>
      typesMatch(p.pfosUrunTipi, urunTipi) &&
      p.pfosKategoriKodu === kategoriKodu
  );

  if (strictCandidates.length > 0) {
    strictCandidates.sort(sortFn);
    const matched = productToEslesmis(strictCandidates[0]);
    matchCache.set(key, matched);
    return matched;
  }

  // 2. Loose Match: only pfosUrunTipi matches
  const looseCandidates = allProducts.filter(
    (p) => typesMatch(p.pfosUrunTipi, urunTipi)
  );

  if (looseCandidates.length > 0) {
    looseCandidates.sort(sortFn);
    const matched = productToEslesmis(looseCandidates[0]);
    matchCache.set(key, matched);
    return matched;
  }

  // 3. Fallback: match legacy files
  const catalog = await fallbackMatch(
    urunTipi,
    fiyatStratejisi,
    sablonIsim,
    notlar,
  );
  matchCache.set(key, catalog);
  return catalog;
}

export function clearMatchProductCache(): void {
  matchCache.clear();
  dbPfosSeeded = null;
  invalidateEqustoFiyatListesiPfosCache();
  globalProductsCache = null;
  cacheFetchedAt = 0;
}
