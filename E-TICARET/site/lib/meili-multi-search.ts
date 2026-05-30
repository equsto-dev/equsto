import type { Meilisearch } from "meilisearch";
import type { CatalogSearchHit } from "@/lib/catalog-search-fallback";
import { expandSearchQueries } from "@/lib/search-synonyms";

export async function searchMeiliMulti(
  client: Meilisearch,
  indexUid: string,
  q: string,
  limit: number,
): Promise<{ hits: CatalogSearchHit[]; estimatedTotalHits: number }> {
  const queries = expandSearchQueries(q).slice(0, 6);
  const perQuery = Math.min(Math.max(limit * 2, 40), 100);
  const index = client.index(indexUid);

  const results = await Promise.all(
    queries.map((mq) => index.search(mq, { limit: perQuery })),
  );

  let estimatedTotalHits = 0;
  const seen = new Set<string>();
  const hits: CatalogSearchHit[] = [];

  for (const res of results) {
    estimatedTotalHits = Math.max(
      estimatedTotalHits,
      res.estimatedTotalHits ?? 0,
    );
    for (const raw of res.hits || []) {
      const h = raw as CatalogSearchHit;
      if (!h?.id || seen.has(h.id)) continue;
      seen.add(h.id);
      hits.push(h);
    }
  }

  return { hits, estimatedTotalHits };
}
