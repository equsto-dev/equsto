import type { Metadata } from "next";
import { getSiteOrigin } from "@/lib/site-origin";
import {
  geoCanonicalPath,
  getGeoLanding,
  getAlternativeGeoPath,
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

  const altPath = getAlternativeGeoPath(slug, lang, kind);
  const alternates: { canonical: string; languages?: Record<string, string> } = {
    canonical: url,
  };
  if (altPath) {
    const altLang = lang === "tr" ? "en" : "tr";
    const altLangCode = altLang === "en" ? "en-US" : "tr-TR";
    alternates.languages = {
      [altLangCode]: `${origin}${altPath}`,
    };
  }

  if (!page) {
    return {
      title: "Equsto",
      alternates,
    };
  }

  return {
    title: page.title,
    description: page.description,
    alternates,
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
