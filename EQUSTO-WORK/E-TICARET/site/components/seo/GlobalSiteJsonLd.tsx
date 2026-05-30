import JsonLdScript from "@/components/seo/JsonLdScript";
import { getSiteOrigin } from "@/lib/google-merchant-feed";

export default function GlobalSiteJsonLd() {
  const origin = getSiteOrigin();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "Equsto Teknoloji Limited",
        url: origin,
        logo: `${origin}/images/equsto-logo.png`,
        description:
          "Equsto; restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanı ve proje planlama platformudur.",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          url: `${origin}/contact`,
          availableLanguage: ["Turkish", "English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: "Equsto",
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${origin}/arama?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Service",
        "@id": `${origin}/#service`,
        name: "Endüstriyel Mutfak & Gastronomi Proje Planlama",
        provider: { "@id": `${origin}/#organization` },
        areaServed: "TR",
        description:
          "Restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları ve proje planlama. Mr. Equsto ile 24 saatte teklif.",
        serviceType: "Endüstriyel mutfak ekipmanı ve proje danışmanlığı",
      },
    ],
  };

  return <JsonLdScript data={data} />;
}
