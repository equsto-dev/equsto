import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSubcategoryLanding, filterProductsBySubcategory } from "@/lib/shop/subcategory";
import { isShopDeptSlug } from "@/lib/shop/depts";
import { buildDeptBreadcrumbJsonLd } from "@/lib/seo/schemas";
import { getSiteOrigin } from "@/lib/site-origin";
import { loadEkipmanlarJson } from "@/lib/catalog-json";
import SubcategoryLandingPage from "@/components/shop/SubcategoryLandingPage";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const { getAllSubcategories } = await import("@/lib/shop/subcategory");
  const subcats = getAllSubcategories();
  return subcats.map((c) => ({ dept: c.dept, subCategory: c.slug }));
}

async function getLocale(): Promise<"tr" | "en"> {
  const h = await headers();
  const pathname = h.get("x-pathname") || "";
  return pathname.startsWith("/en/") ? "en" : "tr";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string; subCategory: string }>;
}): Promise<Metadata> {
  const { dept, subCategory } = await params;
  if (!subCategory) return {};
  const landing = getSubcategoryLanding(subCategory);
  if (!landing || landing.dept !== dept) return {};

  const locale = await getLocale();
  const isEn = locale === "en";
  const origin = "https://equsto.com";
  const trUrl = `https://equsto.com/shop/${dept}/kategori/${subCategory}`;
  const enUrl = `https://equsto.com/en/shop/${dept}/kategori/${subCategory}`;

  const title = isEn ? landing.titleEn : landing.title;
  const description = isEn ? landing.descriptionEn : landing.description;

  return {
    title: `${title} · Equsto`,
    description: isEn ? landing.descriptionEn : landing.description,
    alternates: {
      canonical: isEn ? enUrl : trUrl,
      languages: {
        "tr-TR": trUrl,
        "en-US": enUrl,
        tr: trUrl,
        en: enUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: isEn ? enUrl : trUrl,
      type: "website",
      locale: isEn ? "en_US" : "tr_TR",
      siteName: "Equsto",
    },
  };
}

export default async function SubcategoryLandingPageRoute({
  params,
}: {
  params: Promise<{ dept: string; subCategory: string }>;
}) {
  const { dept, subCategory } = await params;
  if (!isShopDeptSlug(dept)) notFound();

  const landing = getSubcategoryLanding(subCategory);
  if (!landing || landing.dept !== dept) notFound();

  const locale = await getLocale();
  const isEn = locale === "en";

  // Load and filter products for this subcategory
  const rows = (await import("@/lib/catalog-json").then((m) => m.loadEkipmanlarJson())) as Record<string, unknown>[];
  const products = filterProductsBySubcategory(rows, subCategory);

  // Check if there are products for this subcategory
  if (products.length === 0) notFound();

  // Create a landing object without the predicate function for the Client Component
  const landingForClient = {
    slug: landing.slug,
    dept: landing.dept,
    title: landing.title,
    titleEn: landing.titleEn,
    description: landing.description,
    descriptionEn: landing.descriptionEn,
    usageAreas: landing.usageAreas,
    usageAreasEn: landing.usageAreasEn,
    selectionCriteria: landing.selectionCriteria,
    selectionCriteriaEn: landing.selectionCriteriaEn,
    relatedCategories: landing.relatedCategories,
    faq: landing.faq,
    relatedDepartments: landing.relatedDepartments,
  };

  return (
    <SubcategoryLandingPage
      landing={landingForClient}
      dept={dept}
      locale={locale}
      products={products}
    />
  );
}