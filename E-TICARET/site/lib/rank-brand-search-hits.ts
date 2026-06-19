import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import {
  classifyPisirmeFacet,
  type PisirmeFacetKey,
} from "@/lib/shop-pisirme-facet";
import { foldTr } from "@/lib/search-query";

/** Marka aramasında ocak / ızgara / fırın / fritöz öne çıkarılacak slug'lar */
const BRAND_COOKING_FIRST_SLUGS = new Set(["oztiryakiler", "inoksan"]);

const COOKING_FACET_SCORE: Record<PisirmeFacetKey, number> = {
  fritozler: 400,
  firinlar: 380,
  izgaralar: 360,
  ocaklar: 340,
  benmariler: 200,
  "diger-pisirme": 180,
};

const COOKING_INTERLEAVE_ORDER: PisirmeFacetKey[] = [
  "fritozler",
  "firinlar",
  "izgaralar",
  "ocaklar",
];

export function shouldBoostBrandCooking(slug: string): boolean {
  return BRAND_COOKING_FIRST_SLUGS.has(slug);
}

function cookingScore(hit: CatalogSearchHit): number {
  const facet = classifyPisirmeFacet(hit);
  let score = 0;
  if (facet) score = COOKING_FACET_SCORE[facet] ?? 0;
  else if (foldTr(hit.dept || "") === "pisirme") score = 150;
  else {
    const hay = foldTr([hit.name, hit.category].filter(Boolean).join(" "));
    if (/fritoz|firin|izgara|ocak|kuzine/.test(hay)) score = 120;
  }
  if (hit.image) score += 3;
  return score;
}

/** İlk sayfada dört ana pişirme tipinden karışık gösterim */
function interleaveCookingFacetHead(
  hits: CatalogSearchHit[],
  head: number,
): CatalogSearchHit[] {
  if (head <= 0 || hits.length < 2) return hits;

  const buckets: Partial<Record<PisirmeFacetKey, CatalogSearchHit[]>> = {};
  const tail: CatalogSearchHit[] = [];

  for (const h of hits) {
    const facet = classifyPisirmeFacet(h);
    if (facet && COOKING_INTERLEAVE_ORDER.includes(facet)) {
      (buckets[facet] ||= []).push(h);
    } else {
      tail.push(h);
    }
  }

  const out: CatalogSearchHit[] = [];
  const seen = new Set<string>();
  let progressed = true;

  while (out.length < head && progressed) {
    progressed = false;
    for (const key of COOKING_INTERLEAVE_ORDER) {
      const bucket = buckets[key];
      if (!bucket?.length) continue;
      const hit = bucket.shift()!;
      if (!hit.id || seen.has(hit.id)) continue;
      seen.add(hit.id);
      out.push(hit);
      progressed = true;
      if (out.length >= head) break;
    }
  }

  for (const h of hits) {
    if (h?.id && !seen.has(h.id)) {
      seen.add(h.id);
      out.push(h);
    }
  }

  return out;
}

/** Öztiryakiler / İnoksan gibi marka aramalarında pişirme ekipmanlarını öne al */
export function rankBrandSearchHitsCookingFirst(
  hits: CatalogSearchHit[],
  opts?: { diversifyHead?: number },
): CatalogSearchHit[] {
  if (!hits.length) return hits;

  const scored = hits.map((h, idx) => ({
    h,
    idx,
    score: cookingScore(h),
  }));
  scored.sort((a, b) => b.score - a.score || a.idx - b.idx);

  const ordered = scored.map((x) => x.h);
  const head = opts?.diversifyHead ?? 48;
  if (head > 0 && scored[0]?.score > 0) {
    return interleaveCookingFacetHead(ordered, head);
  }
  return ordered;
}
