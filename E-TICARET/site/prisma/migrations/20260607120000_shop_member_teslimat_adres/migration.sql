-- AlterTable (idempotent — sütun db push ile önceden eklenmiş olabilir)
ALTER TABLE "ShopMember" ADD COLUMN IF NOT EXISTS "teslimatAdres" JSONB NOT NULL DEFAULT '{}';
