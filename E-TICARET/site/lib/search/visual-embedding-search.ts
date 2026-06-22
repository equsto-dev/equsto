import { canonicalizeSearchHits } from "@/lib/canonicalize-search-hits";
import {
  getCatalogLookupMaps,
  rowToHitFromRow,
  type CatalogSearchHit,
} from "@/lib/catalog-search-fallback";
import { embedImageBuffer } from "@/lib/search/gemini-image-embedding";
import {
  countVisualEmbeddings,
  searchVisualEmbeddings,
} from "@/lib/search/visual-embedding-db";

const DEFAULT_MIN_SCORE = 0.42;

function minVisualScore(): number {
  const raw = Number(process.env.VISUAL_SEARCH_MIN_SCORE ?? DEFAULT_MIN_SCORE);
  if (!Number.isFinite(raw)) return DEFAULT_MIN_SCORE;
  return Math.min(Math.max(raw, 0.2), 0.95);
}

export async function isVisualEmbeddingIndexReady(): Promise<boolean> {
  const n = await countVisualEmbeddings();
  return n > 0;
}

async function hitsFromEmbeddingRows(
  rows: Array<{ productId: string; similarity: number }>,
): Promise<CatalogSearchHit[]> {
  const maps = await getCatalogLookupMaps();
  const hits: CatalogSearchHit[] = [];

  for (const row of rows) {
    const idKey = String(row.productId || "");
    const catalogRow =
      maps.byMeiliId.get(idKey) ||
      maps.byCatalogSlug.get(idKey.toLowerCase()) ||
      maps.byEqustoKod.get(idKey);

    if (!catalogRow) continue;
    const hit = rowToHitFromRow(catalogRow);
    if (!hit) continue;
    hits.push({
      ...hit,
      id: hit.id || idKey,
      visualScore: row.similarity,
    } as CatalogSearchHit & { visualScore?: number });
  }

  return canonicalizeSearchHits(hits);
}

export type VisualEmbeddingSearchResult = {
  ok: boolean;
  hits: CatalogSearchHit[];
  scores: number[];
  method: "embedding";
  source: "pgvector";
  indexReady: boolean;
  suggestUrl: string | null;
  error?: string;
};

/** Görsel → embedding → pgvector benzerlik araması. */
export async function searchCatalogByImageEmbedding(
  buffer: ArrayBuffer,
  mime: string,
): Promise<VisualEmbeddingSearchResult> {
  const indexReady = await isVisualEmbeddingIndexReady();
  if (!indexReady) {
    return {
      ok: false,
      hits: [],
      scores: [],
      method: "embedding",
      source: "pgvector",
      indexReady: false,
      suggestUrl: null,
      error: "Görsel arama indeksi henüz hazır değil.",
    };
  }

  const embedded = await embedImageBuffer(buffer, mime);
  const raw = await searchVisualEmbeddings(embedded.values, 32);
  const minScore = minVisualScore();
  const filtered = raw.filter((r) => r.similarity >= minScore);

  if (!filtered.length) {
    return {
      ok: false,
      hits: [],
      scores: raw.map((r) => r.similarity),
      method: "embedding",
      source: "pgvector",
      indexReady: true,
      suggestUrl: null,
      error: "Bu görsele benzeyen ürün bulunamadı.",
    };
  }

  const hits = await hitsFromEmbeddingRows(filtered);
  if (!hits.length) {
    return {
      ok: false,
      hits: [],
      scores: filtered.map((r) => r.similarity),
      method: "embedding",
      source: "pgvector",
      indexReady: true,
      suggestUrl: null,
      error: "Benzer ürünler katalogda eşleştirilemedi.",
    };
  }

  return {
    ok: true,
    hits,
    scores: filtered.map((r) => r.similarity),
    method: "embedding",
    source: "pgvector",
    indexReady: true,
    suggestUrl: null,
  };
}
