# advanced-cuisine.com — tam site scrape

Kaynak: [The space home](https://advanced-cuisine.com/pages/the-space-home) ve Shopify sitemap/API.

## Özet (2026-05-16)

| Veri | Adet |
|------|------|
| Ürün (API) | 31 |
| Koleksiyon | 13 |
| URL listesi | 359 |
| HTML sayfa | 110 |
| Görsel dosya | ~1420 (~288 MB) |

## Klasörler

| Klasör | İçerik |
|--------|--------|
| `api/products.json` | Tüm ürünler (fiyat, açıklama, görseller, varyantlar) |
| `api/collections.json` | Koleksiyonlar |
| `api/collection-products.json` | Koleksiyon–ürün eşlemesi |
| `html/` | İndirilen sayfa HTML'leri |
| `images/` | CDN görselleri |
| `urls.txt` | Keşfedilen tüm URL'ler |
| `manifest.json` | Özet meta |

## Yeniden çekmek

```bash
npm run scrape:advanced-cuisine
# veya
python scripts/scrape_advanced_cuisine_site.py
```

`--skip-images` / `--skip-html` ile hızlı API-only çekim mümkün.

## Notlar

- `/blogs.json` API 404 döndü; blog yazıları **sitemap** üzerinden URL listesine eklendi.
- 4 ürün sayfasında URL'deki özel karakter (µ, ⅰ) nedeniyle HTML kaydı atlandı — `products/*.json` API'den mevcut.
- Eski tek sayfa snapshot: `../advanced-cuisine-the-space-home/`
