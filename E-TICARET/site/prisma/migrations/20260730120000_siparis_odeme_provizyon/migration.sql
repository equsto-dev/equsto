-- CreateEnum
CREATE TYPE "OdemeDurum" AS ENUM ('yok', 'bekliyor', 'provizyon', 'tahsil', 'iptal', 'basarisiz', 'iade');

-- AlterTable
ALTER TABLE "siparis" ADD COLUMN "odeme_durum" "OdemeDurum" NOT NULL DEFAULT 'yok';
ALTER TABLE "siparis" ADD COLUMN "odeme_gateway" TEXT;
ALTER TABLE "siparis" ADD COLUMN "odeme_payment_id" TEXT;
ALTER TABLE "siparis" ADD COLUMN "odeme_conversation_id" TEXT;
ALTER TABLE "siparis" ADD COLUMN "odeme_token" TEXT;
ALTER TABLE "siparis" ADD COLUMN "odeme_paid_tl" DECIMAL(14,2);
ALTER TABLE "siparis" ADD COLUMN "odeme_payload" JSONB;

-- CreateIndex
CREATE INDEX "siparis_odeme_durum_idx" ON "siparis"("odeme_durum");
CREATE INDEX "siparis_odeme_payment_id_idx" ON "siparis"("odeme_payment_id");
