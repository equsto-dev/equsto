# İleride: Ürün sayfalarına JSON-LD Product (SEO + AI/GEO)

> **Hatırlatma:** Meilisearch + üst arama tamamlandıktan sonra bu maddeye dönülebilir.  
> Cursor’da: *«JSON-LD Product şeması — PLAN-JSON-LD-PRODUCT.md»* deyin.

## Ne işe yarar?

- **SEO:** Google zengin sonuçlar (fiyat, görsel, stok durumu — uygun alanlar varsa).
- **GEO / AI:** Ürün adı, marka, URL, açıklama yapılandırılmış → ChatGPT / Perplexity / Gemini tarafında daha net “kaynak”.

GEO webinar’ları (Adobe vb.) pazarlama; bu dosya **somut teknik adım**.

## Kapsam (önerilen)

| Sayfa | Dosya | Not |
|-------|--------|-----|
| Ürün PDP | `public/product.html` + `renderProduct` | `application/ld+json` script, `@type: Product` |
| İsteğe bağlı | `app/(storefront)/urun/[slug]` (Next) | Statik PDP kullanılıyorsa öncelik `product.html` |

## Minimum alanlar

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "…",
  "brand": { "@type": "Brand", "name": "…" },
  "image": ["https://equsto.com/data/images/…"],
  "description": "… (specs kısaltılmış)",
  "url": "https://equsto.com/shop/pisirme/…",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "TRY",
    "price": "…",
    "availability": "https://schema.org/InStock"
  }
}
```

- Fiyat metni «Teklif için iletişim» ise `Offer` atlanabilir veya `priceSpecification` yok.
- Görsel URL: `equstoDataAssetHref` / `catalogImageCandidates` ile aynı mantık.

## Bağımlılıklar

- [ ] PDP katalog yükleyici stabil (`eq-shop-catalog-bootstrap.js`) — **yapıldı**
- [ ] Canlı görsel yolları `/data/images/` tutarlı (deploy)
- [ ] `eq-merchant-schema.js` ile çakışma kontrolü (varsa Organization/WebSite ayrı kalsın)

## Uygulama taslağı

1. `product.html` içinde `renderProduct(x)` sonunda `<script type="application/ld+json">` ekle.
2. `JSON.stringify` ile XSS’ten kaçın ( `<` kaçışı ).
3. Search Console → Zengin sonuçlar testi.
4. İsteğe bağlı: `sitemap.xml` ürün URL’leri (ayrı iş).

## İlgili

- GEO (pazarlama kavramı): genel trend; zorunlu değil.
- Mevcut: `eq-merchant-schema.js`, canonical URL’ler, `/shop/{dept}/{slug}`.

## Durum

- [ ] Planlandı (bu dosya)
- [ ] Uygulandı
- [ ] Canlı doğrulandı (Google Rich Results Test)
