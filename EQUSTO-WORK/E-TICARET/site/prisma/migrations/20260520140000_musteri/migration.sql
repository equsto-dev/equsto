-- CreateTable
CREATE TABLE "Musteri" (
    "id" TEXT NOT NULL,
    "firma" TEXT NOT NULL DEFAULT '',
    "yetkili" TEXT NOT NULL DEFAULT '',
    "tel" TEXT NOT NULL DEFAULT '',
    "mail" TEXT NOT NULL DEFAULT '',
    "sehir" TEXT NOT NULL DEFAULT '',
    "tip" TEXT NOT NULL DEFAULT 'lead',
    "not" TEXT,
    "kaynak" TEXT,
    "sayfa" TEXT,
    "mesaj" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Musteri_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Musteri_tip_idx" ON "Musteri"("tip");

-- CreateIndex
CREATE INDEX "Musteri_createdAt_idx" ON "Musteri"("createdAt");
