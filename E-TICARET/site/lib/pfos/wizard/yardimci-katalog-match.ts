import { db } from "@/lib/db";
import { enrichEslesmisGorsel, pfosGorselFileExists } from "@/lib/pfos/core/katalog-gorsel";
import { matchShopCatalog } from "@/lib/pfos/core/shop-catalog-match";
import { normalizeTipKodu, resolveTipKodu } from "@/lib/pfos/core/tip-kodu";
import type { EslesmisUrun } from "@/lib/pfos/schemas/pfos.schema";

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

function typesMatch(dbType: string | null | undefined, reqType: string): boolean {
  if (!dbType) return false;
  return normalizeTipKodu(resolveTipKodu(dbType)) === normalizeTipKodu(reqType);
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
    olcu: null,
    elektrikGucuKw: dec(product.elektrikGucuKw),
    gazGucuKw: dec(product.gazGucuKw),
    fiyat: dec(product.priceListTl) ?? 0,
    doviz: mapDoviz(product.priceCurrency),
    gorselUrl: product.images[0]?.url ?? null,
  };
}

function isPseudoPfosLink(urun: EslesmisUrun | null | undefined): boolean {
  const id = String(urun?.id ?? "");
  const slug = String(urun?.slug ?? "");
  return id.startsWith("pfos-link-") || slug.startsWith("pfos-link-");
}

function hasRailGorsel(urun: EslesmisUrun | null | undefined): urun is EslesmisUrun {
  const url = String(urun?.gorselUrl ?? "").trim();
  if (!url) return false;
  if (pfosGorselFileExists(url)) return true;
  // Docker/CDN — dosya kontrolü başarısız olsa da geçerli yol kabul et
  return url.startsWith("/data/") || url.startsWith("http");
}

function dbRowSkipsTip(name: string, tip: string): boolean {
  const n = name.toLocaleLowerCase("tr");
  const tipNorm = normalizeTipKodu(tip);
  if (
    tipNorm === "firin_arabasi" &&
    /tepsi\s*arab|bakertop|fırın\s*için\s*tepsi|firin\s*icin\s*tepsi/.test(n)
  ) {
    return true;
  }
  return false;
}

async function dbUrunForTip(tipKodu: string): Promise<EslesmisUrun | null> {
  const tip = resolveTipKodu(tipKodu);
  if (!tip) return null;
  const products = await db.product.findMany({
    where: {
      pfosUrunTipi: { not: null },
      pfosAktif: true,
      ecommerceAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
      images: { some: {} },
    },
    include: {
      brand: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
    },
    orderBy: { priceListTl: "asc" },
    take: 60,
  });
  for (const row of products) {
    if (!typesMatch(row.pfosUrunTipi, tip)) continue;
    if (dbRowSkipsTip(row.name, tip)) continue;
    const urun = productToEslesmis(row);
    const enriched = await enrichEslesmisGorsel(urun);
    if (hasRailGorsel(enriched)) return enriched;
  }
  return null;
}

/** Rail için görseli olan gerçek katalog ürünü — pfos-link yer tutucuları atlanır */
export async function matchYardimciRailUrun(tipKodu: string): Promise<EslesmisUrun | null> {
  const tip = resolveTipKodu(tipKodu);
  if (!tip) return null;

  const dbFirst = await dbUrunForTip(tip);
  if (hasRailGorsel(dbFirst)) return dbFirst;

  const legacy = await matchShopCatalog(tip, "ekonomik");
  const enriched = legacy ? await enrichEslesmisGorsel(legacy) : null;
  if (!hasRailGorsel(enriched)) return null;
  if (isPseudoPfosLink(enriched)) return null;
  return enriched;
}

export async function slugRailUrun(slug: string): Promise<EslesmisUrun | null> {
  const clean = slug.replace(/^ecom_/, "").trim();
  if (!clean) return null;
  const product = await db.product.findFirst({
    where: {
      slug: clean,
      ecommerceAktif: true,
      status: "PUBLISHED",
      priceListTl: { gt: 0 },
    },
    include: {
      brand: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
    },
  });
  if (!product) return null;
  const urun = productToEslesmis(product);
  const enriched = (await enrichEslesmisGorsel(urun)) ?? urun;
  return hasRailGorsel(enriched) ? enriched : null;
}
