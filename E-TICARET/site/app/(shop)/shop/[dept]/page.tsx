import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import ShopBodyClass from "@/components/shop/ShopBodyClass";
import DeptPlpCrawlLinks from "@/components/shop/DeptPlpCrawlLinks";
import ShopDeptPlpMain from "@/components/shop/ShopDeptPlpMain";
import ShopEqustoChrome from "@/components/shop/ShopEqustoChrome";
import ShopPlpScripts from "@/components/shop/ShopPlpScripts";
import ShopStyles from "@/components/shop/ShopStyles";
import { SHOP_DEPTS, SHOP_DEPT_SLUGS, isShopDeptSlug, type ShopDeptSlug } from "@/lib/shop/depts";
import { buildDeptBreadcrumbJsonLd } from "@/lib/seo/schemas";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SHOP_DEPT_SLUGS.map((dept) => ({ dept }));
}

async function getLocale(): Promise<"tr" | "en"> {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  return pathname.startsWith("/en/") ? "en" : "tr";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string }>;
}): Promise<Metadata> {
  const { dept } = await params;
  if (!isShopDeptSlug(dept)) return {};
  const meta = SHOP_DEPTS[dept];
  return {
    title: `${meta.title} · Equsto`,
    description: meta.metaDescription,
    alternates: {
      canonical: `https://equsto.com/shop/${dept}`,
      languages: {
        tr: `https://equsto.com/shop/${dept}`,
        en: `https://equsto.com/en/shop/${dept}`,
      },
    },
  };
}

export default async function ShopDeptPage({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  if (!isShopDeptSlug(dept)) notFound();
  const meta = SHOP_DEPTS[dept];
  const locale = await getLocale();
  const breadcrumbJsonLd = buildDeptBreadcrumbJsonLd(dept, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ShopStyles variant="plp" />
      <ShopBodyClass className="eq-shop eq-dept eq-dept-plp" dataDept={dept} />
      <ShopEqustoChrome activeDept={dept as ShopDeptSlug} />
      <ShopDeptPlpMain meta={meta} />
      <DeptPlpCrawlLinks dept={dept} />
      <ShopPlpScripts />
    </>
  );
}