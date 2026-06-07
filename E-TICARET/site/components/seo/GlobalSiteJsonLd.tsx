import JsonLdScript from "@/components/seo/JsonLdScript";
import { publicAssetUrl } from "@/lib/public-asset-url";
import { getSiteOrigin } from "@/lib/site-origin";

export default function GlobalSiteJsonLd() {
  const origin = getSiteOrigin();

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "Equsto Teknoloji Limited",
        alternateName: ["Equsto", "Equsto Endüstriyel Mutfak"],
        url: origin,
        logo: publicAssetUrl("/images/equsto-logo.png"),
        foundingDate: "2026",
        description:
          "Equsto; restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanı ve proje planlama platformudur. Öztiryakiler yetkili bayii.",
        knowsAbout: [
          "Endüstriyel mutfak ekipmanı",
          "Commercial kitchen equipment",
          "Restoran mutfak teklifi",
          "Öztiryakiler bayii",
          "Proje Fabrikası PFOS",
          "Bulut mutfak kurulumu",
          "Steakhouse mutfak",
        ],
        areaServed: [
          { "@type": "Country", name: "Turkey" },
          { "@type": "Country", name: "United Arab Emirates" },
          { "@type": "Country", name: "Qatar" },
          { "@type": "Country", name: "Saudi Arabia" },
        ],
        sameAs: [
          "https://equsto.com/llms.txt",
          "https://equsto.com/hakkimizda",
          "https://equsto.com/pfos",
        ],
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
          "Restoran, otel, kafe ve bulut mutfak projeleri için endüstriyel mutfak ekipmanları ve proje planlama. Mr. Equsto ile 5 dakikada teklif.",
        serviceType: "Endüstriyel mutfak ekipmanı ve proje danışmanlığı",
        url: `${origin}/pfos`,
      },
    ],
  };

  return <JsonLdScript data={data} />;
}
