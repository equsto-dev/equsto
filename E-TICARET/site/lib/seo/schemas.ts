import { SHOP_DEPTS, type ShopDeptSlug } from "@/lib/shop/depts";
import { getSiteOrigin } from "@/lib/site-origin";

export function buildDeptBreadcrumbJsonLd(dept: ShopDeptSlug, locale: "tr" | "en" = "tr") {
  const origin = getSiteOrigin();
  const meta = SHOP_DEPTS[dept];
  const homeName = locale === "en" ? "Home" : "Ana Sayfa";
  const homeUrl = locale === "en" ? `${origin}/en/` : `${origin}/`;
  const deptUrl = locale === "en" ? `${origin}/en/shop/${dept}` : `${origin}/shop/${dept}`;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeName,
        item: homeUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: locale === "en" ? meta.metaDescriptionEn.split(".")[0] : meta.title,
        item: deptUrl,
      },
    ],
  };
}