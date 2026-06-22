import { db } from "@/lib/db";
import { embeddingToPgVector } from "@/lib/search/gemini-image-embedding";

export type VisualEmbeddingRow = {
  productId: string;
  dept: string;
  imageUrl: string;
  similarity: number;
};

export async function countVisualEmbeddings(): Promise<number> {
  try {
    const rows = await db.$queryRawUnsafe<Array<{ c: bigint | number }>>(
      "SELECT COUNT(*)::bigint AS c FROM product_visual_embedding",
    );
    return Number(rows[0]?.c || 0);
  } catch (err) {
    console.warn("[visual-embedding-db] count failed:", err);
    return 0;
  }
}

export async function upsertVisualEmbedding(input: {
  productId: string;
  dept: string;
  imageUrl: string;
  values: number[];
}): Promise<void> {
  const vec = embeddingToPgVector(input.values);
  await db.$executeRawUnsafe(
    `INSERT INTO product_visual_embedding (product_id, dept, image_url, embedding, updated_at)
     VALUES ($1, $2, $3, $4::vector, NOW())
     ON CONFLICT (product_id) DO UPDATE SET
       dept = EXCLUDED.dept,
       image_url = EXCLUDED.image_url,
       embedding = EXCLUDED.embedding,
       updated_at = NOW()`,
    input.productId,
    input.dept,
    input.imageUrl,
    vec,
  );
}

export async function searchVisualEmbeddings(
  values: number[],
  limit = 24,
): Promise<VisualEmbeddingRow[]> {
  const vec = embeddingToPgVector(values);
  const lim = Math.min(Math.max(limit, 1), 48);

  const rows = await db.$queryRawUnsafe<
    Array<{
      product_id: string;
      dept: string;
      image_url: string;
      similarity: number | string;
    }>
  >(
    `SELECT
       product_id,
       dept,
       image_url,
       1 - (embedding <=> $1::vector) AS similarity
     FROM product_visual_embedding
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    vec,
    lim,
  );

  return rows.map((r) => ({
    productId: r.product_id,
    dept: r.dept || "",
    imageUrl: r.image_url || "",
    similarity: Number(r.similarity) || 0,
  }));
}
