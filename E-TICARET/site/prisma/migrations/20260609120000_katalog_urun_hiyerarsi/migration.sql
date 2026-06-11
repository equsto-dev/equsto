-- Katalog ürün hiyerarşisi: Equsto kodu, kategori depth, ölçü, KDV hariç döviz fiyat

-- Brand: marka kodu
ALTER TABLE "Brand" ADD COLUMN "kod" TEXT;
CREATE UNIQUE INDEX "Brand_kod_key" ON "Brand"("kod");

-- Category: hiyerarşi derinliği (0 = ürün kategori, 1+ = alt kategori)
ALTER TABLE "Category" ADD COLUMN "depth" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "Category_parentId_depth_idx" ON "Category"("parentId", "depth");

WITH RECURSIVE cat_depth AS (
  SELECT id, 0 AS depth FROM "Category" WHERE "parentId" IS NULL
  UNION ALL
  SELECT c.id, cd.depth + 1
  FROM "Category" c
  INNER JOIN cat_depth cd ON c."parentId" = cd.id
)
UPDATE "Category" c
SET depth = cd.depth
FROM cat_depth cd
WHERE c.id = cd.id;

-- Product: Equsto kodu, marka kodu, ölçüler, KDV hariç döviz fiyat
ALTER TABLE "Product"
  ADD COLUMN "equstoKod" TEXT,
  ADD COLUMN "markaKodu" TEXT,
  ADD COLUMN "genislikMm" INTEGER,
  ADD COLUMN "derinlikMm" INTEGER,
  ADD COLUMN "yukseklikMm" INTEGER,
  ADD COLUMN "fiyatKdvHaricDoviz" DECIMAL(12,2),
  ADD COLUMN "dovizFiyat" "Doviz" DEFAULT 'EUR',
  ADD COLUMN "kdvOran" DECIMAL(5,2) DEFAULT 20;

UPDATE "Product"
SET "markaKodu" = COALESCE("sku", "modelCode")
WHERE "markaKodu" IS NULL;

UPDATE "Product"
SET "equstoKod" = 'EQ-' || "markaKodu"
WHERE "equstoKod" IS NULL AND "markaKodu" IS NOT NULL;

UPDATE "Product"
SET "fiyatKdvHaricDoviz" = "fiyatListe",
    "dovizFiyat" = COALESCE("dovizListe", 'EUR'::"Doviz")
WHERE "fiyatKdvHaricDoviz" IS NULL AND "fiyatListe" IS NOT NULL;

CREATE UNIQUE INDEX "Product_equstoKod_key" ON "Product"("equstoKod");
CREATE UNIQUE INDEX "Product_markaKodu_key" ON "Product"("markaKodu");
