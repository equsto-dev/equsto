import landingsTr from "./landings.json";
import landingsEn from "./landings-en.json";
import { PILLAR_FAQ } from "./pillar-faq";

export type GeoFaqItem = [string, string];

export type GeoLandingRecord = {
  title: string;
  description: string;
  h1?: string;
  lead?: string;
  body?: string;
  faq?: GeoFaqItem[];
  profile?: string;
  lang?: string;
};

export type GeoRouteKind = "root" | "rehber" | "guides";

function landingKey(slug: string, lang: "tr" | "en", kind: GeoRouteKind): string {
  if (lang === "en") {
    return kind === "guides" ? `en/guides/${slug}` : `en/${slug}`;
  }
  return kind === "rehber" ? `rehber/${slug}` : slug;
}

export function getGeoLanding(
  slug: string,
  lang: "tr" | "en",
  kind: GeoRouteKind = "root",
): GeoLandingRecord | null {
  const key = landingKey(slug, lang, kind);
  const store = lang === "en" ? landingsEn : landingsTr;
  const raw = (store as Record<string, unknown>)[key];
  if (!raw || typeof raw !== "object") return null;
  const page = raw as GeoLandingRecord;
  const faq = page.faq?.length ? page.faq : PILLAR_FAQ[key];
  return faq?.length ? { ...page, faq } : page;
}

export function geoCanonicalPath(
  slug: string,
  lang: "tr" | "en",
  kind: GeoRouteKind = "root",
): string {
  if (lang === "en") {
    return kind === "guides" ? `/en/guides/${slug}` : `/en/${slug}`;
  }
  return kind === "rehber" ? `/rehber/${slug}` : `/${slug}`;
}
