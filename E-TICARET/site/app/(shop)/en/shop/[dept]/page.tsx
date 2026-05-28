import type { Metadata } from "next";
import ShopDeptPage, { generateStaticParams } from "../../../shop/[dept]/page";
import { SHOP_DEPTS, isShopDeptSlug } from "@/lib/shop/depts";
import en from "@/public/i18n/en.json";

export const dynamic = "force-static";
export const dynamicParams = false;

export { generateStaticParams };

function navTitle(navKey: string): string {
  const key = navKey.replace(/^nav\./, "");
  const nav = en.nav as Record<string, string>;
  return nav[key] || key;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string }>;
}): Promise<Metadata> {
  const { dept } = await params;
  if (!isShopDeptSlug(dept)) return {};
  const meta = SHOP_DEPTS[dept];
  const title = navTitle(meta.navKey);
  return {
    title: `${title} · Equsto`,
    description: meta.metaDescriptionEn,
    alternates: {
      canonical: `https://equsto.com/en/shop/${dept}`,
      languages: {
        tr: `https://equsto.com/shop/${dept}`,
        en: `https://equsto.com/en/shop/${dept}`,
      },
    },
  };
}

export default ShopDeptPage;
