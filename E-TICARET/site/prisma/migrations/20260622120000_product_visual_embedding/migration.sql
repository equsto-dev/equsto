-- Görsel arama: Gemini embedding + pgvector (Supabase)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "product_visual_embedding" (
    "product_id" TEXT NOT NULL,
    "dept" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT NOT NULL DEFAULT '',
    "embedding" vector(768) NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_visual_embedding_pkey" PRIMARY KEY ("product_id")
);

CREATE INDEX IF NOT EXISTS "product_visual_embedding_dept_idx"
    ON "product_visual_embedding" ("dept");
