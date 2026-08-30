import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { catalogUrlSlug } from "@/lib/catalog-product-slug";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopProductPdpBoot from "@/components/shop/ShopProductPdpBoot";
import ShopProductPdpSeed from "@/components/shop/ShopProductPdpSeed";
import ShopProductScripts from "@/components/shop/ShopProductScripts";
import ProductDwellTracker from "@/components/shop/ProductDwellTracker";
import ShopStyles from "@/components/shop/ShopStyles";
import { ECOM_ASSET_V } from "@/lib/shop/assets";
import { isShopDeptSlug } from "@/lib/shop/depts";
import {
  buildProductJsonLd,
  buildProductMetadata,
  findProductForPdp,
  rowToPdpClientSeed,
  rowToPdpSsr,
} from "@/lib/shop/pdp-server";
import { findBesosUrbanBarProductByEqustoId } from "@/lib/besos/urbanbar/pdp-server";

export const dynamic = "force-dynamic";

async function shopLangPrefix(): Promise<string> {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  return pathname.startsWith("/en/") || pathname === "/en" ? "/en" : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string; slug: string }>;
}): Promise<Metadata> {
  const { dept, slug } = await params;
  if (!isShopDeptSlug(dept)) return {};
  const found = await findProductForPdp(dept, slug);
  if (!found) {
    return {
      title: "Ürün bulunamadı · Equsto",
      robots: { index: false, follow: true },
    };
  }
  const langPrefix = await shopLangPrefix();
  const locale = langPrefix === "/en" ? "en" : "tr";
  return buildProductMetadata(
    rowToPdpSsr(found.row, found.dept, {
      langPrefix: locale === "en" ? "/en" : "",
    }),
    { locale },
  );
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ dept: string; slug: string }>;
}) {
  const { dept, slug } = await params;
  if (!isShopDeptSlug(dept) || !slug) notFound();

  if (/^urban-bar__/i.test(slug)) {
    const ub = await findBesosUrbanBarProductByEqustoId(slug.replace(/_/g, "-"));
    if (ub?.besosHref) redirect(ub.besosHref);
  }

  const found = await findProductForPdp(dept, slug);
  if (!found) notFound();

  const langPrefix = await shopLangPrefix();
  const canonicalSlug = catalogUrlSlug(found.row).toLowerCase();
  const normalizedSlug = slug.toLowerCase().replace(/_/g, "-");
  // dolap → tezgah (next.config); asla /shop/dolap/... üretme (redirect loop)
  const canonicalDept = found.dept === "dolap" ? "tezgah" : found.dept;
  if (canonicalDept !== dept || (canonicalSlug && normalizedSlug !== canonicalSlug)) {
    redirect(
      `${langPrefix}/shop/${canonicalDept}/${encodeURIComponent(canonicalSlug)}`,
    );
  }

  const ssr = rowToPdpSsr(found.row, canonicalDept, {
    langPrefix: langPrefix === "/en" ? "/en" : "",
  });
  const seed = rowToPdpClientSeed(found.row, canonicalDept);
  const jsonLd = buildProductJsonLd(ssr, found.row);

  return (
    <>
      <ShopProductPdpSeed seed={seed} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${ECOM_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <ShopBodyClass className="eq-shop eq-pdp-page" />
      <ShopEqustoChrome activeDept={null} />
      <ShopProductMain ssr={ssr} />
      <ProductDwellTracker
        slug={ssr.slug}
        dept={canonicalDept}
        productId={String(found.row.id ?? found.row.code ?? found.row.sku ?? "")}
        title={ssr.name}
        brand={ssr.brand}
      />
      <ShopProductPdpBoot />
      <ShopProductScripts />
    </>
  );
}
