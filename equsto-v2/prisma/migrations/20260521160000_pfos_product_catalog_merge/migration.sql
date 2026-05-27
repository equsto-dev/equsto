-- PFOS + tek katalog birleşimi (onaylı taslak — Mayıs 2026)

-- CreateEnum
CREATE TYPE "Doviz" AS ENUM ('EUR', 'TRY', 'USD');

-- CreateEnum
CREATE TYPE "MarkaTipi" AS ENUM ('URETICI', 'ITHALAT', 'OZEL_URETIM');

-- CreateEnum
CREATE TYPE "PfosKategoriKodu" AS ENUM ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X');

-- AlterTable Brand
ALTER TABLE "Brand" ADD COLUMN "markaTipi" "MarkaTipi",
ADD COLUMN "notlar" TEXT;

-- AlterTable Product
ALTER TABLE "Product" ADD COLUMN "sku" TEXT,
ADD COLUMN "model" TEXT,
ADD COLUMN "detayliAciklama" TEXT,
ADD COLUMN "ebat" TEXT,
ADD COLUMN "elektrikGucuKw" DECIMAL(8,2),
ADD COLUMN "gazGucuKw" DECIMAL(8,2),
ADD COLUMN "fiyatListe" DECIMAL(12,2),
ADD COLUMN "dovizListe" "Doviz" DEFAULT 'EUR',
ADD COLUMN "bayiIskonto" DECIMAL(5,4),
ADD COLUMN "stok" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "pfosKategoriKodu" "PfosKategoriKodu",
ADD COLUMN "pfosUrunTipi" TEXT,
ADD COLUMN "pfosAltKod" TEXT,
ADD COLUMN "ozelUretim" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "pfosAktif" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "ecommerceAktif" BOOLEAN NOT NULL DEFAULT true;

-- Backfill sku from modelCode (M1)
UPDATE "Product" SET "sku" = "modelCode" WHERE "sku" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_pfosKategoriKodu_idx" ON "Product"("pfosKategoriKodu");

-- CreateIndex
CREATE INDEX "Product_pfosUrunTipi_idx" ON "Product"("pfosUrunTipi");

-- CreateIndex
CREATE INDEX "Product_pfosAktif_idx" ON "Product"("pfosAktif");

-- CreateIndex
CREATE INDEX "Product_ecommerceAktif_idx" ON "Product"("ecommerceAktif");

-- CreateTable
CREATE TABLE "PfosUrunTipiEslesme" (
    "id" TEXT NOT NULL,
    "konseptSlug" TEXT NOT NULL,
    "pfosUrunTipi" TEXT NOT NULL,
    "pfosKategoriKodu" "PfosKategoriKodu" NOT NULL,
    "pfosAltKod" TEXT,
    "productId" TEXT NOT NULL,
    "oncelik" INTEGER NOT NULL DEFAULT 0,
    "zorunlu" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PfosUrunTipiEslesme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PfosTeklifSnapshot" (
    "id" TEXT NOT NULL,
    "projeRef" TEXT,
    "kalemler" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PfosTeklifSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PfosUrunTipiEslesme_konseptSlug_pfosUrunTipi_idx" ON "PfosUrunTipiEslesme"("konseptSlug", "pfosUrunTipi");

-- CreateIndex
CREATE UNIQUE INDEX "PfosUrunTipiEslesme_konseptSlug_pfosUrunTipi_productId_key" ON "PfosUrunTipiEslesme"("konseptSlug", "pfosUrunTipi", "productId");

-- CreateIndex
CREATE INDEX "PfosTeklifSnapshot_projeRef_idx" ON "PfosTeklifSnapshot"("projeRef");

-- CreateIndex
CREATE INDEX "PfosTeklifSnapshot_createdAt_idx" ON "PfosTeklifSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "PfosUrunTipiEslesme" ADD CONSTRAINT "PfosUrunTipiEslesme_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
