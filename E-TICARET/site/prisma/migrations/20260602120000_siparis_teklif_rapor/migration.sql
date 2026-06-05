-- CreateEnum
CREATE TYPE "SiparisDurum" AS ENUM ('beklemede', 'hazirlaniyor', 'kargoda', 'teslim', 'iptal');

-- CreateEnum
CREATE TYPE "TeklifDurum" AS ENUM ('taslak', 'gonderildi', 'onaylandi', 'reddedildi', 'revize', 'iptal');

-- CreateTable
CREATE TABLE "siparis" (
    "id" TEXT NOT NULL,
    "siparis_no" TEXT NOT NULL,
    "musteri_ad" TEXT NOT NULL DEFAULT '',
    "musteri_tel" TEXT NOT NULL DEFAULT '',
    "musteri_mail" TEXT NOT NULL DEFAULT '',
    "not" TEXT,
    "kalemler" JSONB NOT NULL DEFAULT '[]',
    "toplam_kalem" INTEGER NOT NULL DEFAULT 0,
    "toplam_adet" INTEGER NOT NULL DEFAULT 0,
    "toplam_tl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "durum" "SiparisDurum" NOT NULL DEFAULT 'beklemede',
    "kaynak" TEXT,
    "kupon_kod" TEXT,
    "indirim_tl" DECIMAL(12,2),
    "musteri_id" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "siparis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teklif" (
    "id" TEXT NOT NULL,
    "ref_no" TEXT NOT NULL,
    "musteri_ad" TEXT NOT NULL DEFAULT '',
    "musteri_tel" TEXT NOT NULL DEFAULT '',
    "musteri_mail" TEXT NOT NULL DEFAULT '',
    "konsept" TEXT NOT NULL DEFAULT '',
    "toplam_tl" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "gecerlilik_bitis" TIMESTAMP(3),
    "durum" "TeklifDurum" NOT NULL DEFAULT 'gonderildi',
    "not_" TEXT,
    "kalemler" JSONB,
    "kaynak" TEXT,
    "payload" JSONB,
    "musteri_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teklif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_query_log" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "siparis_siparis_no_key" ON "siparis"("siparis_no");

-- CreateIndex
CREATE INDEX "siparis_durum_idx" ON "siparis"("durum");

-- CreateIndex
CREATE INDEX "siparis_created_at_idx" ON "siparis"("created_at");

-- CreateIndex
CREATE INDEX "siparis_musteri_id_idx" ON "siparis"("musteri_id");

-- CreateIndex
CREATE UNIQUE INDEX "teklif_ref_no_key" ON "teklif"("ref_no");

-- CreateIndex
CREATE INDEX "teklif_durum_idx" ON "teklif"("durum");

-- CreateIndex
CREATE INDEX "teklif_created_at_idx" ON "teklif"("created_at");

-- CreateIndex
CREATE INDEX "teklif_musteri_id_idx" ON "teklif"("musteri_id");

-- CreateIndex
CREATE INDEX "search_query_log_created_at_idx" ON "search_query_log"("created_at");

-- CreateIndex
CREATE INDEX "search_query_log_query_idx" ON "search_query_log"("query");
