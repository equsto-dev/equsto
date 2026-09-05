import { getSiteOrigin } from "@/lib/site-origin";
import { SHOP_DEPTS, isShopDeptSlug, type ShopDeptSlug } from "@/lib/shop/depts";

/**
 * Departman PLP için FAQPage schema (GEO / AI Overview optimizasyonu)
 * eq-category-seo.json'daki departman FAQ verilerini kullanır
 */
export default function DeptFaqJsonLd({ dept }: { dept: string }) {
  const origin = getSiteOrigin();
  
  if (!isShopDeptSlug(dept)) return null;
  
  const meta = SHOP_DEPTS[dept as ShopDeptSlug];
  if (!meta?.faq) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${origin}/shop/${dept}#faq`,
    mainEntity: meta.faq.map((faq, idx) => ({
      "@type": "Question",
      "@id": `${origin}/shop/${dept}#faq-${idx + 1}`,
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        "@id": `${origin}/shop/${dept}#faq-${idx + 1}-answer`,
        text: faq.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}