import type { Metadata } from "next";
import { findBesosProduct } from "@/lib/besos/catalog";
import { loadBesosCatalogue } from "@/lib/besos/load-data";
import { vitrumModuleSlug } from "@/lib/besos/module-url";
import type { BesosProduct } from "@/lib/besos/types";
import { getSiteOrigin } from "@/lib/site-origin";

export type BesosModulSsr = {
  name: string;
  brand: string;
  description: string;
  deptTitle: string;
  deptHref: string;
  slug: string;
  canonical: string;
  image?: string;
  code?: string;
};

export async function findBesosModul(slug: string): Promise<BesosProduct | null> {
  const catalogue = await loadBesosCatalogue();
  return findBesosProduct(catalogue.products || [], slug);
}

export function besosToSsr(p: BesosProduct, locale: "tr" | "en" = "tr"): BesosModulSsr {
  const origin = getSiteOrigin();
  const slug = vitrumModuleSlug(p);
  const prefix = locale === "en" ? "/en" : "";
  const canonical = `${origin}${prefix}/besos/modul/${encodeURIComponent(slug)}`;
  const descTr = String(p.description || "").trim();
  const descEn = String(p.descriptionEn || "").trim();
  const description =
    (locale === "en" && descEn ? descEn : descTr) ||
    `${p.name || p.code} — Besos Bar Design Studio modülü.`;

  let image: string | undefined;
  const img = String(p.imageLocal || p.image || "").replace(/\\/g, "/");
  if (img) {
    image = img.startsWith("http") ? img : `${origin}/${img.replace(/^\//, "")}`;
  }

  return {
    name: String(p.name || p.code || "Bar modülü").trim(),
    brand: "Besos",
    description: description.slice(0, 320),
    deptTitle: locale === "en" ? "Bar Design" : "Bar Design",
    deptHref: `${prefix}/besos`,
    slug,
    canonical,
    image,
    code: String(p.code || "").trim() || undefined,
  };
}

export function buildBesosModulMetadata(ssr: BesosModulSsr): Metadata {
  const title = `${ssr.name} · Besos Bar Design · Equsto`;
  const trUrl = ssr.canonical.replace("/en/besos/", "/besos/");
  const enUrl = ssr.canonical.includes("/en/")
    ? ssr.canonical
    : ssr.canonical.replace("://equsto.com/", "://equsto.com/en/");
  return {
    title,
    description: ssr.description,
    alternates: {
      canonical: ssr.canonical,
      languages: {
        tr: trUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title,
      description: ssr.description,
      url: ssr.canonical,
      ...(ssr.image ? { images: [{ url: ssr.image }] } : {}),
    },
  };
}

export function buildBesosModulJsonLd(ssr: BesosModulSsr) {
  const origin = getSiteOrigin();
  const homeLabel = ssr.canonical.includes("/en/") ? "Home" : "Ana Sayfa";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: ssr.name,
        description: ssr.description,
        image: ssr.image ? [ssr.image] : undefined,
        sku: ssr.code || ssr.slug,
        brand: { "@type": "Brand", name: "Besos" },
        offers: {
          "@type": "Offer",
          url: ssr.canonical,
          availability: "https://schema.org/InStock",
          priceCurrency: "EUR",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: homeLabel, item: `${origin}/` },
          { "@type": "ListItem", position: 2, name: "Bar Design", item: `${origin}${ssr.deptHref}` },
          { "@type": "ListItem", position: 3, name: ssr.name, item: ssr.canonical },
        ],
      },
    ],
  };
}
