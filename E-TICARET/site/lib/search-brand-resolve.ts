import { BRAND_HUB_META } from "@/lib/shop/brand-hub";
import { foldTr } from "@/lib/search-query";

export type BrandSearchMatch = {
  slug: string;
  displayName: string;
  markaKodu?: string;
  query: string;
};

/** Sorgu yalnızca marka adı mı? (ek anahtar kelime yok) */
const BRAND_ALIASES: Record<string, { slug: string; markaKodu?: string }> = {
  oztiryakiler: { slug: "oztiryakiler", markaKodu: "OZTI" },
  öztiryakiler: { slug: "oztiryakiler", markaKodu: "OZTI" },
  oztiryak: { slug: "oztiryakiler", markaKodu: "OZTI" },
  öztiryak: { slug: "oztiryakiler", markaKodu: "OZTI" },
  ozti: { slug: "oztiryakiler", markaKodu: "OZTI" },
  atalay: { slug: "atalay", markaKodu: "ATALAY" },
  electrolux: { slug: "electrolux", markaKodu: "ELECTROLUX" },
  senox: { slug: "senox", markaKodu: "SENOX" },
  vosco: { slug: "vosco", markaKodu: "VOSCO" },
  rational: { slug: "rational" },
  unox: { slug: "unox" },
  wmf: { slug: "wmf" },
  hoshizaki: { slug: "hoshizaki" },
  inoksan: { slug: "inoksan" },
  i̇noksan: { slug: "inoksan" },
};

/** BRAND_HUB_META dışındaki markalar — tam katalog havuzu */
const STANDALONE_BRANDS: Record<
  string,
  { displayName: string; markaKodu?: string }
> = {
  inoksan: { displayName: "İnoksan" },
};

function hubMatch(slug: string): BrandSearchMatch | null {
  const hub = BRAND_HUB_META[slug];
  if (!hub) return null;
  const alias = BRAND_ALIASES[slug];
  return {
    slug,
    displayName: hub.displayName,
    markaKodu: alias?.markaKodu,
    query: slug,
  };
}

/** «öztiryakiler» gibi tek kelimelik marka aramaları → tam katalog havuzu */
export function resolveBrandSearchQuery(q: string): BrandSearchMatch | null {
  const raw = String(q || "").trim();
  if (!raw) return null;
  const tokens = raw.split(/\s+/).filter(Boolean);
  if (tokens.length !== 1) return null;

  const term = foldTr(tokens[0]);
  const alias = BRAND_ALIASES[term];
  if (alias) {
    const m = hubMatch(alias.slug);
    if (m) {
      return { ...m, query: raw, markaKodu: alias.markaKodu ?? m.markaKodu };
    }
    const standalone = STANDALONE_BRANDS[alias.slug];
    if (standalone) {
      return {
        slug: alias.slug,
        displayName: standalone.displayName,
        markaKodu: alias.markaKodu ?? standalone.markaKodu,
        query: raw,
      };
    }
  }

  for (const [slug, hub] of Object.entries(BRAND_HUB_META)) {
    if (term === foldTr(slug)) {
      const m = hubMatch(slug);
      if (m) return { ...m, query: raw };
    }
    if (hub.facet && term === foldTr(hub.facet)) {
      const m = hubMatch(slug);
      if (m) return { ...m, query: raw };
    }
    if (term === foldTr(hub.displayName)) {
      const m = hubMatch(slug);
      if (m) return { ...m, query: raw };
    }
  }

  return null;
}

export function meiliFilterForBrand(match: BrandSearchMatch): string | undefined {
  if (match.markaKodu) {
    return `marka_kodu = "${match.markaKodu}"`;
  }
  if (match.displayName) {
    return `brand = "${match.displayName.replace(/"/g, '\\"')}"`;
  }
  return undefined;
}
