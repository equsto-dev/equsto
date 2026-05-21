import { Meilisearch } from "meilisearch";

export function getMeiliAdmin() {
  const host = process.env.MEILISEARCH_HOST;
  const key = process.env.MEILISEARCH_MASTER_KEY;
  if (!host || !key) return null;
  return new Meilisearch({ host, apiKey: key });
}

export const PRODUCTS_INDEX = "products";
