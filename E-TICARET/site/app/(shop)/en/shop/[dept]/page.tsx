import type { Metadata } from "next";
import ShopDeptPage, { generateStaticParams } from "../../../shop/[dept]/page";
import { SHOP_DEPTS, isShopDeptSlug, type ShopDeptSlug } from "@/lib/shop/depts";
import en from "@/public/i18n/en.json";

export const dynamic = "force-static";
export const dynamicParams = false;

export { generateStaticParams };

function navTitle(navKey: string): string {
  const key = navKey.replace(/^nav\./, "");
  const v = (en.nav as Record<string, unknown>)[key];
  return typeof v === "string" ? v : key;
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
