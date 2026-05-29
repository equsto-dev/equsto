import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SHOP_ASSET_V } from "@/lib/shop/assets";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopProductMain from "@/components/shop/ShopProductMain";
import ShopProductScripts from "@/components/shop/ShopProductScripts";
import ShopStyles from "@/components/shop/ShopStyles";
import { isShopDeptSlug } from "@/lib/shop/depts";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string; slug: string }>;
}): Promise<Metadata> {
  const { dept, slug } = await params;
  if (!isShopDeptSlug(dept)) return {};
  return {
    title: "Ürün Detayı · Equsto",
    description: "Endüstriyel mutfak ekipmanı ürün detayı. Teknik özellikler, fiyat, stok ve teklif.",
    alternates: {
      canonical: `https://equsto.com/shop/${dept}/${slug}`,
      languages: {
        tr: `https://equsto.com/shop/${dept}/${slug}`,
        en: `https://equsto.com/en/shop/${dept}/${slug}`,
      },
    },
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ dept: string; slug: string }>;
}) {
  const { dept, slug } = await params;
  if (!isShopDeptSlug(dept) || !slug) notFound();

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href={`/eq-product-page.css?v=${SHOP_ASSET_V}`} precedence="high" />
      <ShopStyles variant="product" />
      <ShopBodyClass className="eq-shop" />
      <ShopEqustoChrome activeDept={null} />
      <ShopProductMain />
      <ShopProductScripts />
    </>
  );
}
