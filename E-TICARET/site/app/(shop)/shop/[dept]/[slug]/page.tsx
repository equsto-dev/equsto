import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { catalogUrlSlug } from "@/lib/catalog-product-slug";
import JsonLdScript from "@/components/seo/JsonLdScript";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopProductPdpBoot from "@/components/shop/ShopProductPdpBoot";
import ShopProductPdpSeed from "@/components/shop/ShopProductPdpSeed";
import ShopProductScripts from "@/components/shop/ShopProductScripts";
import ShopStyles from "@/components/shop/ShopStyles";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
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
  return buildProductMetadata(rowToPdpSsr(found.row, found.dept));
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

  const canonicalSlug = catalogUrlSlug(found.row).toLowerCase();
  if (canonicalSlug && slug.toLowerCase().replace(/_/g, "-") !== canonicalSlug) {
    redirect(`/shop/${dept}/${encodeURIComponent(canonicalSlug)}`);
  }

  const ssr = rowToPdpSsr(found.row, found.dept);
  const seed = rowToPdpClientSeed(found.row, found.dept);
  const jsonLd = buildProductJsonLd(ssr);

  return (
    <>
      <ShopProductPdpSeed seed={seed} />
      <JsonLdScript data={jsonLd} />
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${SHOP_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <ShopBodyClass className="eq-shop" />
      <ShopEqustoChrome activeDept={null} />
      <ShopProductMain ssr={ssr} />
      <ShopProductPdpBoot />
      <ShopProductScripts />
    </>
  );
}
