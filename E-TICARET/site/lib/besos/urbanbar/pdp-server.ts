import type { Metadata } from "next";
import { absoluteAssetUrl, cleanDescription, feedTitle, resolveMerchantPriceTry } from "@/lib/google-merchant-feed";
import { type PdpSsrPayload } from "@/lib/shop/pdp-server";
import { getSiteOrigin } from "@/lib/site-origin";
import type { BesosLocale } from "../locale";
import {
  besosUrbanBarProductHref,
  besosUrbanBarProductSlug,
  type BesosUrbanBarSectionKey,
} from "./catalog";
import { loadBesosUrbanBarCatalog } from "./load-data";
import type { BesosUrbanBarProduct } from "./types";

function slugCandidates(pathSlug: string): string[] {
  const raw = decodeURIComponent(pathSlug || "").trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  const out = new Set<string>([lower, lower.replace(/_/g, "-")]);
  return [...out];
}

function productMatchesSlug(product: BesosUrbanBarProduct, slug: string): boolean {
  const candidates = slugCandidates(slug);
  const keys = [
    product.handle,
    product.equstoId,
    product.equstoId?.split("__").pop(),
    product.code,
    besosUrbanBarProductSlug(product),
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase().replace(/_/g, "-"));

  return candidates.some((c) => keys.includes(c.replace(/_/g, "-")));
}

export async function findBesosUrbanBarProduct(
  sectionKey: BesosUrbanBarSectionKey,
  pathSlug: string,
): Promise<BesosUrbanBarProduct | null> {
  const catalog = await loadBesosUrbanBarCatalog();
  for (const product of catalog.products) {
    if (!productMatchesSlug(product, pathSlug)) continue;
    return product;
  }
  return null;
}

export async function findBesosUrbanBarProductByEqustoId(
  equstoId: string,
): Promise<BesosUrbanBarProduct | null> {
  const id = String(equstoId || "").trim().toLowerCase();
  if (!id) return null;
  const catalog = await loadBesosUrbanBarCatalog();
  return (
    catalog.products.find((p) => String(p.equstoId || "").trim().toLowerCase() === id) || null
  );
}

function productHeroImage(product: BesosUrbanBarProduct, origin: string): string | undefined {
  const shopify = product.imageUrl;
  if (shopify?.startsWith("http")) return shopify;
  const local = product.image || product.images?.[0];
  if (!local) return undefined;
  if (local.startsWith("http")) return local;
  const path = local.startsWith("/") ? local : `/${local.replace(/^\.\//, "")}`;
  return absoluteAssetUrl(path, origin);
}

export type BesosUrbanBarPdpBundle = {
  product: BesosUrbanBarProduct;
  ssr: PdpSsrPayload;
};
export async function loadBesosUrbanBarPdpBundle(
  sectionKey: BesosUrbanBarSectionKey,
  pathSlug: string,
  locale: BesosLocale = "tr",
): Promise<BesosUrbanBarPdpBundle | null> {
  const product = await findBesosUrbanBarProduct(sectionKey, pathSlug);
  if (!product) return null;

  const slug = besosUrbanBarProductSlug(product);
  const ssr = urbanBarToPdpSsr(product, sectionKey, slug, locale);
  return { product, ssr };
}

export function urbanBarToPdpSsr(
  product: BesosUrbanBarProduct,
  sectionKey: BesosUrbanBarSectionKey,
  slug: string,
  locale: BesosLocale = "tr",
): PdpSsrPayload {
  const origin = getSiteOrigin();
  const prefix = locale === "en" ? "/en" : "";
  const canonical = `${origin}${besosUrbanBarProductHref(sectionKey, slug, locale)}`;
  const sectionLabel =
    locale === "en" ? product.sectionLabelEn || sectionKey : product.sectionLabelTr || sectionKey;
  const deptHref = `${prefix}/besos/${sectionKey === "bardaklar" ? "bardaklar" : "bar-ekipman"}`;
  const description =
    cleanDescription(
      {
        description: product.description,
        name: product.name,
      },
      [],
      320,
    ) || `${product.name} — Urban Bar · Besos`;

  const priceTry =
    typeof product.fiyat_tl === "number" && product.fiyat_tl > 0
      ? product.fiyat_tl
      : resolveMerchantPriceTry({ fiyat_tl: product.fiyat_tl, price: product.price });

  const breadcrumbs: PdpSsrPayload["breadcrumbs"] = [
    { name: locale === "en" ? "Home" : "Ana Sayfa", href: `${origin}${prefix}/` },
    { name: locale === "en" ? "Bar Design" : "Besos", href: `${origin}${prefix}/besos` },
    { name: sectionLabel, href: `${origin}${deptHref}` },
  ];

  return {
    name: feedTitle({ name: product.name }) || product.name,
    brand: product.vendor || "Urban Bar",
    description,
    deptTitle: sectionLabel,
    deptHref,
    breadcrumbs,
    slug,
    canonical,
    image: productHeroImage(product, origin),
    sku: product.code || slug,
    priceTry: priceTry > 0 ? priceTry : undefined,
  };
}

export function buildBesosUrbanBarMetadata(ssr: PdpSsrPayload): Metadata {
  const title = `${ssr.name} · Urban Bar · Besos`;
  const description =
    ssr.description.slice(0, 155) + (ssr.description.length > 155 ? "…" : "") + " Sepete ekle, teknik detaylar.";

  const trUrl = ssr.canonical.replace("/en/besos/", "/besos/");
  const enUrl = ssr.canonical.includes("/en/")
    ? ssr.canonical
    : ssr.canonical.replace("://equsto.com/", "://equsto.com/en/");

  return {
    title,
    description,
    alternates: {
      canonical: ssr.canonical,
      languages: { tr: trUrl, en: enUrl },
    },
    openGraph: {
      title,
      description,
      url: ssr.canonical,
      type: "website",
      ...(ssr.image ? { images: [{ url: ssr.image }] } : {}),
    },
  };
}

export function buildBesosUrbanBarJsonLd(ssr: PdpSsrPayload) {
  const origin = getSiteOrigin();
  const homeLabel = ssr.canonical.includes("/en/") ? "Home" : "Ana Sayfa";
  const besosLabel = ssr.canonical.includes("/en/") ? "Bar Design" : "Besos";

  const offer =
    ssr.priceTry && ssr.priceTry > 0
      ? {
          "@type": "Offer",
          price: ssr.priceTry.toFixed(2),
          priceCurrency: "TRY",
          availability: "https://schema.org/InStock",
          url: ssr.canonical,
        }
      : {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          url: ssr.canonical,
          priceCurrency: "TRY",
        };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: ssr.name,
        description: ssr.description,
        image: ssr.image ? [ssr.image] : undefined,
        sku: ssr.sku || ssr.slug,
        brand: { "@type": "Brand", name: ssr.brand || "Urban Bar" },
        offers: offer,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeLabel, item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: besosLabel, item: `${origin}${ssr.deptHref.replace(/\/[^/]+$/, "")}` },
          { "@type": "ListItem", position: 3, name: ssr.deptTitle, item: `${origin}${ssr.deptHref}` },
          { "@type": "ListItem", position: 4, name: ssr.name, item: ssr.canonical },
        ],
      },
    ],
  };
}
