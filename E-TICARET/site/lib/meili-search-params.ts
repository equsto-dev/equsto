import { foldTr } from "@/lib/search-query";

export type MeiliSearchParams = {
  limit: number;
  offset: number;
  filter?: string;
  /** Meili'den daha fazla çek → post-rank → slice */
  rerankPool: boolean;
};

const IZGARA_TERMS = new Set(["izgara", "izgaralar", "ızgara"]);
const FIRIN_TERMS = new Set(["firin", "firinlar", "fırın"]);

/** Ekipman sorguları için Meili limit/filter — istif rafı / aksesuar gürültüsünü azalt. */
export function meiliSearchParams(
  q: string,
  limit: number,
  offset: number,
): MeiliSearchParams {
  const term = foldTr(q).trim();
  let fetchLimit = limit;
  let filter: string | undefined;
  let rerankPool = false;

  if (IZGARA_TERMS.has(term)) {
    filter = 'dept != "istif"';
    fetchLimit = Math.min(Math.max(limit * 4, 40), 100);
    rerankPool = true;
  } else if (FIRIN_TERMS.has(term)) {
    fetchLimit = Math.min(Math.max(limit * 4, 40), 100);
    rerankPool = true;
  }

  return {
    limit: fetchLimit,
    offset,
    filter,
    rerankPool,
  };
}
