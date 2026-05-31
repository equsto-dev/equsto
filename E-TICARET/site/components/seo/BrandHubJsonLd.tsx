import JsonLdScript from "@/components/seo/JsonLdScript";
import { getBrandHubMeta } from "@/lib/shop/brand-hub";
import { getSiteOrigin } from "@/lib/site-origin";

type Props = {
  slug: string;
  lang?: "tr" | "en";
};

export default function BrandHubJsonLd({ slug, lang = "tr" }: Props) {
  const meta = getBrandHubMeta(slug);
  if (!meta) return null;

  const origin = getSiteOrigin();
  const path =
    lang === "en"
      ? `/en/shop/marka/${slug}`
      : `/shop/marka/${slug}`;
  const url = `${origin}${path}`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Brand",
        "@id": `${url}#brand`,
        name: meta.displayName,
        description: meta.description,
        url,
        ...(meta.sameAs?.length ? { sameAs: meta.sameAs } : {}),
      },
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: `${meta.displayName} · Equsto`,
        description: meta.description,
        inLanguage: lang === "en" ? "en-US" : "tr-TR",
        isPartOf: { "@id": `${origin}/#website` },
        about: { "@id": `${url}#brand` },
      },
    ],
  };

  return <JsonLdScript data={data} />;
}
