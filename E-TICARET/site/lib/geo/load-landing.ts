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
  /** public/data/{tableRef} — ör. geo/steakhouse-2018-199-3-table.json */
  tableRef?: string;
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

export function getAlternativeGeoPath(
  slug: string,
  lang: "tr" | "en",
  kind: GeoRouteKind = "root",
): string | null {
  const currentPage = getGeoLanding(slug, lang, kind);
  if (!currentPage || !currentPage.profile) return null;

  const targetLang = lang === "tr" ? "en" : "tr";
  const targetStore = targetLang === "en" ? landingsEn : landingsTr;

  for (const [key, value] of Object.entries(targetStore)) {
    if (key === "version" || key === "source") continue;
    const page = value as any;
    if (page && page.profile === currentPage.profile) {
      let targetSlug = key;
      if (targetLang === "en") {
        targetSlug = key.replace(/^en\/guides\//, "").replace(/^en\//, "");
      } else {
        targetSlug = key.replace(/^rehber\//, "");
      }
      return geoCanonicalPath(targetSlug, targetLang, kind);
    }
  }
  return null;
}
