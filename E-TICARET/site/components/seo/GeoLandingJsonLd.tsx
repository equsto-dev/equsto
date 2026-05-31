import JsonLdScript from "@/components/seo/JsonLdScript";
import {
  geoCanonicalPath,
  getGeoLanding,
  type GeoRouteKind,
} from "@/lib/geo/load-landing";
import { getSiteOrigin } from "@/lib/site-origin";

type Props = {
  slug: string;
  lang: "tr" | "en";
  kind?: GeoRouteKind;
};

export default function GeoLandingJsonLd({ slug, lang, kind = "root" }: Props) {
  const page = getGeoLanding(slug, lang, kind);
  if (!page) return null;

  const origin = getSiteOrigin();
  const url = `${origin}${geoCanonicalPath(slug, lang, kind)}`;
  const inLang = lang === "en" ? "en-US" : "tr-TR";

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: page.title,
      description: page.description,
      inLanguage: inLang,
      isPartOf: { "@id": `${origin}/#website` },
    },
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: page.h1 || page.title,
      description: page.description,
      url,
      inLanguage: inLang,
      author: { "@id": `${origin}/#organization` },
      publisher: { "@id": `${origin}/#organization` },
      mainEntityOfPage: { "@id": `${url}#webpage` },
    },
  ];

  if (page.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: page.faq.map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    });
  }

  return (
    <JsonLdScript data={{ "@context": "https://schema.org", "@graph": graph }} />
  );
}
