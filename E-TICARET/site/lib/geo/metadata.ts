import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/site-origin";
import {
  geoCanonicalPath,
  getGeoLanding,
  type GeoRouteKind,
} from "./load-landing";

export function buildGeoMetadata(
  slug: string,
  lang: "tr" | "en",
  kind: GeoRouteKind = "root",
): Metadata {
  const page = getGeoLanding(slug, lang, kind);
  const origin = getSiteOrigin();
  const path = geoCanonicalPath(slug, lang, kind);
  const url = `${origin}${path}`;

  if (!page) {
    return {
      title: "Equsto",
      alternates: { canonical: url },
    };
  }

  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      type: "article",
      locale: lang === "en" ? "en_US" : "tr_TR",
      siteName: "Equsto",
    },
    twitter: {
      card: "summary",
      title: page.title,
      description: page.description,
    },
  };
}
