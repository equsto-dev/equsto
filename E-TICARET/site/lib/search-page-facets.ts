import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import {
  classifyPisirmeFacet,
  countPisirmeFacets,
  hitMatchesPisirmeFacets,
  isPisirmeProduct,
  PISIRME_FACET_ORDER,
} from "@/lib/shop-pisirme-facet";

export type SearchFacetState = {
  depts: string[];
  brands: string[];
  pisirmeTip: string[];
  priceMin: number | null;
  priceMax: number | null;
};

export type SearchFacetCounts = {
  depts: Record<string, number>;
  brands: Record<string, number>;
  pisirmeTip: Record<string, number>;
  priceMin: number;
  priceMax: number;
};

export const SEARCH_FACET_POOL_CAP = 2000;

const DEPT_LABELS: Record<string, string> = {
  pisirme: "Pişirme",
  sogutma: "Soğutma",
  kahve: "Kahve",
  yikama: "Yıkama",
  hazirlik: "Hazırlık",
  icecek: "İçecek",
  tezgah: "Tezgah",
  dolap: "Dolap",
  davlumbaz: "Davlumbaz",
  tasima: "Taşıma",
  araba: "Servis Arabaları",
  istif: "İstif",
  "set-ustu-mutfak": "Set Üstü Mutfak",
  kuvetler: "Küvetler",
  "market-reyonlari": "Market Reyonları",
  "market-reyon": "Market Reyonları",
};

export function parseSearchFacetParams(
  sp: URLSearchParams,
): SearchFacetState {
  const list = (key: string) =>
    (sp.get(key) || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const priceMinRaw = sp.get("priceMin");
  const priceMaxRaw = sp.get("priceMax");
  const priceMin =
    priceMinRaw != null && priceMinRaw !== ""
      ? Number(priceMinRaw)
      : null;
  const priceMax =
    priceMaxRaw != null && priceMaxRaw !== ""
      ? Number(priceMaxRaw)
      : null;

  return {
    depts: list("dept"),
    brands: list("brand"),
    pisirmeTip: list("pisirmeTip"),
    priceMin: priceMin != null && !Number.isNaN(priceMin) ? priceMin : null,
    priceMax: priceMax != null && !Number.isNaN(priceMax) ? priceMax : null,
  };
}

export function hasActiveSearchFacetFilters(state: SearchFacetState): boolean {
  return !!(
    state.depts.length ||
    state.brands.length ||
    state.pisirmeTip.length ||
    state.priceMin != null ||
    state.priceMax != null
  );
}

function hitDeptKey(hit: CatalogSearchHit): string {
  const d = String(hit.dept || "")
    .trim()
    .toLowerCase();
  if (d === "market-reyon") return "market-reyonlari";
  return d || "pisirme";
}

function hitBrandKey(hit: CatalogSearchHit): string {
  return String(hit.brand || "").trim();
}

function parsePriceFromHit(hit: CatalogSearchHit): number {
  if (hit.satis_eur_indirimli != null && Number(hit.satis_eur_indirimli) > 0) {
    return Number(hit.satis_eur_indirimli);
  }
  if (hit.liste_fiyati_eur != null && Number(hit.liste_fiyati_eur) > 0) {
    return Number(hit.liste_fiyati_eur);
  }
  const s = String(hit.price || "")
    .split("\n")[0]
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

type ExcludeFacet = "dept" | "brand" | "pisirmeTip" | "price" | null;

function poolForCounts(
  hits: CatalogSearchHit[],
  state: SearchFacetState,
  exclude: ExcludeFacet,
): CatalogSearchHit[] {
  let list = hits.slice();
  if (state.depts.length && exclude !== "dept") {
    list = list.filter((h) => state.depts.includes(hitDeptKey(h)));
  }
  if (state.brands.length && exclude !== "brand") {
    list = list.filter((h) => state.brands.includes(hitBrandKey(h)));
  }
  if (state.pisirmeTip.length && exclude !== "pisirmeTip") {
    list = list.filter((h) => hitMatchesPisirmeFacets(h, state.pisirmeTip));
  }
  if (state.priceMin != null && exclude !== "price") {
    list = list.filter((h) => parsePriceFromHit(h) >= state.priceMin!);
  }
  if (state.priceMax != null && exclude !== "price") {
    list = list.filter((h) => {
      const n = parsePriceFromHit(h);
      return !n || n <= state.priceMax!;
    });
  }
  return list;
}

export function applySearchFacetFilters(
  hits: CatalogSearchHit[],
  state: SearchFacetState,
): CatalogSearchHit[] {
  return poolForCounts(hits, state, null);
}

export function computeSearchFacetCounts(
  hits: CatalogSearchHit[],
  state: SearchFacetState,
): SearchFacetCounts {
  const deptPool = poolForCounts(hits, state, "dept");
  const brandPool = poolForCounts(hits, state, "brand");
  const pisirmePool = poolForCounts(hits, state, "pisirmeTip");
  const pricePool = poolForCounts(hits, state, "price");

  const depts: Record<string, number> = {};
  const brands: Record<string, number> = {};
  let priceMin = Infinity;
  let priceMax = 0;

  for (const h of deptPool) {
    const d = hitDeptKey(h);
    depts[d] = (depts[d] || 0) + 1;
  }
  for (const h of brandPool) {
    const b = hitBrandKey(h);
    if (b) brands[b] = (brands[b] || 0) + 1;
  }
  for (const h of pricePool) {
    const pr = parsePriceFromHit(h);
    if (pr > 0) {
      if (pr < priceMin) priceMin = pr;
      if (pr > priceMax) priceMax = pr;
    }
  }

  const pisirmeTip = countPisirmeFacets(pisirmePool) as Record<string, number>;

  return {
    depts,
    brands,
    pisirmeTip,
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax,
  };
}

export function searchHasPisirmeFacets(hits: CatalogSearchHit[]): boolean {
  return hits.some((h) => isPisirmeProduct(h));
}

export function deptLabel(dept: string): string {
  return DEPT_LABELS[dept] || dept;
}

export function sortedDeptKeys(
  counts: Record<string, number>,
  selected: string[] = [],
): string[] {
  const keys = Object.keys(counts).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0),
  );
  for (const d of selected) {
    if (d && !keys.includes(d)) keys.push(d);
  }
  return keys;
}

export function sortedBrandKeys(
  counts: Record<string, number>,
  selected: string[] = [],
): string[] {
  const keys = Object.keys(counts).sort(
    (a, b) => (counts[b] || 0) - (counts[a] || 0),
  );
  for (const b of selected) {
    if (b && !keys.includes(b)) keys.push(b);
  }
  return keys;
}

export function sortedPisirmeTipKeys(counts: Record<string, number>): string[] {
  return PISIRME_FACET_ORDER.filter((k) => (counts[k] || 0) > 0);
}

export function pisirmeTipLabel(key: string): string {
  const labels: Record<string, string> = {
    ocaklar: "Ocaklar",
    izgaralar: "Izgaralar",
    fritozler: "Fritözler",
    firinlar: "Fırınlar",
    benmariler: "Benmariler",
    "diger-pisirme": "Diğer pişirme",
  };
  return labels[key] || key;
}

export { classifyPisirmeFacet };
