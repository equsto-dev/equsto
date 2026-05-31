import GeoLandingJsonLd from "@/components/seo/GeoLandingJsonLd";
import GeoLandingPage from "@/components/vitrin/GeoLandingPage";
import GeoLandingSsrContent from "@/components/vitrin/GeoLandingSsrContent";
import type { GeoRouteKind } from "@/lib/geo/load-landing";

type Props = {
  slug: string;
  lang: "tr" | "en";
  kind?: GeoRouteKind;
};

export default function GeoLandingRoute({ slug, lang, kind = "root" }: Props) {
  return (
    <>
      <GeoLandingJsonLd slug={slug} lang={lang} kind={kind} />
      <GeoLandingPage hasSsr>
        <GeoLandingSsrContent slug={slug} lang={lang} kind={kind} />
      </GeoLandingPage>
    </>
  );
}
