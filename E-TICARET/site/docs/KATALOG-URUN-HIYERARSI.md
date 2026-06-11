# Katalog ürün hiyerarşisi

Onaylı sütun sırası (Excel / import / export):

| Sıra | Alan | Prisma / kod |
|------|------|----------------|
| 1 | **Equsto ürün kodu** | `Product.equstoKod` — `EQ-{Brand.kod}.{urunKodu}` (ör. `EQ-PIMAK.19070.04`) |
| 2 | **Marka** | `Brand.name` — görünen ad (ör. Pimak) |
| 3 | **Marka kodu** | `Brand.kod` — kısa kod (ör. PIMAK, OZTI) |
| 4 | **Ürün kodu** | `Product.urunKodu` — marka öneki olmadan (ör. `19070.04`) |
| 5 | **Ürün kategori** | `Category` depth `0` |
| 6 | **Ürün alt kategori 1** | `Category` depth `1` |
| 7 | **Ürün alt kategori 2** | depth `2` |
| 8 | **Ürün alt kategori 3** | depth `3` |
| 9 | **Ürün alt kategori 4** | depth `4` |
| 10+ | **Ürün alt kategori N** | depth `≥5` — sınırsız ağaç |
| 11 | **Açıklama** | `Product.description` |
| 12 | **Detay** | `Product.detayliAciklama` |
| 13 | **Ölçü** (en × boy × yükseklik) | `genislikMm`, `derinlikMm`, `yukseklikMm` |
| 14 | **Fiyat** (KDV hariç, döviz) | `fiyatKdvHaricDoviz` + `dovizFiyat` + `kdvOran` |

## Kod kuralları

| Kavram | Örnek | Nerede |
|--------|-------|--------|
| Marka (ad) | Pimak | `Brand.name` |
| Marka kodu | PIMAK | `Brand.kod` |
| Ürün kodu | 19070.04 | `Product.urunKodu` |
| Equsto kodu | EQ-PIMAK.19070.04 | `buildEqustoKod(brandKod, urunKodu)` |

- Marka ve marka kodu **ayrı alanlardır**; ürün kodu marka önekini içermez.
- Ürün yaprak kategoriye (`categoryId`) bağlanır; üst katmanlar `Category.parentId` + `depth` ile okunur.
- Aynı ürün kodu farklı markalarda tekrarlanabilir → `@@unique([brandId, urunKodu])`.

## TRY satış fiyatı

PFOS ve vitrin için kanonik TRY fiyatı `priceListTl` kalır. Kaynak liste:

- `fiyatKdvHaricDoviz` + `dovizFiyat` → TCMB / import ile `priceListTl` hesaplanır.
- Eski alanlar `fiyatListe` / `dovizListe` geriye dönük uyumluluk için korunur.

## Migration

1. `20260609120000_katalog_urun_hiyerarsi`
2. `20260609130000_marka_urun_kodu_ayir` — `markaKodu` → `urunKodu`, `Brand.kod` ayrımı

```bash
npm run db:migrate:deploy
```

## Yardımcı modül

`lib/catalog/product-hierarchy.ts`:

- `ProductCatalogRow` — dışa aktarım satır tipi
- `buildEqustoKod`, `normalizeUrunKodu`, `deriveProductCodes`, `productToCatalogRow`
