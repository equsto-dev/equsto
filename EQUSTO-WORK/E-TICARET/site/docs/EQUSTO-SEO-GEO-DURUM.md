# EQUSTO SEO / GEO — durum özeti

Kaynak: `EQUSTO - SEO GEO.docx` (notlar klasörü)

## Tamamlanan (teknik)

| Gereksinim | Uygulama |
|------------|----------|
| E-E-A-T / hakkımızda | `/hakkimizda.html`, AboutPage + FAQ schema |
| Kurumsal hikaye | `/buradan-basladi`, Article + FAQ; video alanı (yakında) |
| Programatik rehber (blog gizli) | `geo-landing.html` + `data/geo-landings.json`, `/blog` hub (menüde yok) |
| 15 prompt hedef sayfalar | Yeni slug’lar: `endustriyel-mutfak-ekipmani-turkiye`, `oztiryakiler-ekipmani-tedarik`, `soguk-oda-teklif`, … |
| AI asistan dosyası | `/llms.txt`, `/llms-full.txt` |
| AI bot erişimi | `robots.txt` — GPTBot, ClaudeBot, PerplexityBot, … |
| Sitemap | `sitemap.xml` + `sitemap-pages.xml` (hakkımızda, blog, yeni GEO) |
| Ana sayfa schema | Organization, WebSite, Service, FAQPage (`index.html`) |
| UTF-8 meta | `scripts/patch-seo-geo-complete.mjs` |
| Anahtar kelime meta gizleme | `meta keywords` kaldırıldı (vitrinde trend listesi yok) |
| 5 dakika teklif | PFOS / FAQ / hakkımızda copy (24 saat yok) |
| EN GEO (kısmi) | `/en/industrial-kitchen-supplier-turkey`, `/en/commercial-kitchen-quotation` |
| Bölge hedefi | `areaServed`: TR + komşular / Körfez (schema) |

## Kısmen / süreç

| Gereksinim | Durum |
|------------|--------|
| İngilizce tam vitrin | hreflang var; `/en/` shop henüz tam değil |
| 3–4 dk kurumsal video | Sayfa hazır (`/buradan-basladi`); video + görseller yüklenecek |
| Profesyonel ürün fotoğrafı | Operasyonel |
| Teklif PDF AI-okunur SKU | PFOS çıktı formatı — ayrı sprint |
| Yemeksepeti dükkan araştırması | Veri / pazarlama |
| 15/15 AI görünürlük | Proxy ~1/15 genel; marka sorgularında #1 |

## Çalıştırma

```bash
cd equsto-v2
node scripts/patch-seo-geo-complete.mjs
```

Deploy: `equsto-v2/public` → Vercel.

## Test

- `https://equsto.com/robots.txt`
- `https://equsto.com/sitemap-pages.xml`
- `https://equsto.com/blog`
- `https://equsto.com/mutfak-teklif-platformu`
- Rich Results: ana sayfa + bir GEO sayfa FAQ
