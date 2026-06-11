-- AlterTable (idempotent)
ALTER TABLE "ShopMember" ADD COLUMN IF NOT EXISTS "telefon" TEXT NOT NULL DEFAULT '';
