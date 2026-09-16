import JsonLdScript from "@/components/seo/JsonLdScript";
import { getSiteOrigin } from "@/lib/site-origin";

/** İletişim sayfası — LocalBusiness (E-E-A-T / yerel SEO) */
export default function ContactLocalBusinessJsonLd({ lang = "tr" }: { lang?: "tr" | "en" }) {
  const origin = getSiteOrigin();
  const isEn = lang === "en";

  const sameAs = [
    `${origin}/llms.txt`,
    `${origin}/hakkimizda`,
    `${origin}/pfos`,
  ];
  const linkedIn = process.env.NEXT_PUBLIC_EQUSTO_LINKEDIN_URL?.trim();
  const gbp = process.env.NEXT_PUBLIC_EQUSTO_GBP_URL?.trim();
  if (linkedIn) sameAs.push(linkedIn);
  if (gbp) sameAs.push(gbp);

  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${origin}/#localbusiness`,
    name: "Equsto",
    url: origin,
    image: `${origin}/images/equsto-logo.png`,
    description: isEn
      ? "Equsto supplies commercial kitchen equipment and project planning for restaurants, hotels, cafes and cloud kitchens. Authorized Öztiryakiler dealer."
      : "Equsto; restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanı ve proje planlama. Öztiryakiler yetkili bayii.",
    telephone: "+90-554-237-8532",
    email: "info@equsto.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Istanbul",
      addressRegion: "İstanbul",
      addressCountry: "TR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.0823311,
      longitude: 28.9847494,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "08:30",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "08:30",
        closes: "15:00",
      },
    ],
    areaServed: ["TR", "AE", "QA", "SA"],
    sameAs,
    priceRange: "$$",
  };

  return <JsonLdScript data={data} />;
}
