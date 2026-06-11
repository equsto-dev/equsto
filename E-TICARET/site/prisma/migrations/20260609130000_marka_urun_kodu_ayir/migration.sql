-- Marka kodu (Brand.kod) ile ürün kodu (Product.urunKodu) ayrımı

DROP INDEX IF EXISTS "Product_markaKodu_key";
ALTER TABLE "Product" RENAME COLUMN "markaKodu" TO "urunKodu";

-- Brand.kod boşsa ürün kodundan marka önekini çıkar
UPDATE "Brand" b
SET kod = UPPER(split_part(p."urunKodu", '.', 1))
FROM "Product" p
WHERE p."brandId" = b.id
  AND b.kod IS NULL
  AND p."urunKodu" IS NOT NULL
  AND p."urunKodu" LIKE '%.%';

-- Ürün kodundan marka önekini kaldır (PIMAK.19070.04 → 19070.04)
UPDATE "Product" p
SET "urunKodu" = substring(p."urunKodu" from length(b.kod) + 2)
FROM "Brand" b
WHERE p."brandId" = b.id
  AND b.kod IS NOT NULL
  AND p."urunKodu" IS NOT NULL
  AND upper(p."urunKodu") LIKE upper(b.kod) || '.%';

-- Equsto kodunu marka kodu + ürün kodundan yeniden üret
UPDATE "Product" p
SET "equstoKod" = 'EQ-' || b.kod || '.' || p."urunKodu"
FROM "Brand" b
WHERE p."brandId" = b.id
  AND b.kod IS NOT NULL
  AND p."urunKodu" IS NOT NULL
  AND p."urunKodu" <> '';

CREATE UNIQUE INDEX "Product_brandId_urunKodu_key" ON "Product"("brandId", "urunKodu");
