# Electrolux Professional (TR) katalog çekimi

Kaynak: [electroluxprofessional.com/tr](https://www.electroluxprofessional.com/tr/)

## Çıktılar

| Dosya | İçerik |
|-------|--------|
| `product-urls.json` | Keşfedilen tüm ürün COD + URL |
| `listing-contexts.json` | Filtreli liste sayfaları (AJAX parametreleri) |
| `urun-sayfalari/{cod}.json` | Ürün detayı: özellikler, dökümanlar, görseller |
| `products-tr.json` | Birleşik dizi |
| `media/images/{cod}/` | Ürün görselleri |
| `media/documents/{cod}/` | PDF, DWG, RFA (broşür, veri sayfası, CAD, Revit) |

## Komutlar (`E-TICARET/site`)

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"

# 1) URL keşfi
npm run catalog:electrolux:discover

# 2) Tüm ürünler (görseller + dökümanlar indirilir; uzun sürer)
npm run catalog:electrolux:cek

# Kaldığı yerden devam
node scripts/scrape-electrolux-professional.mjs --resume

# Tek ürün
node scripts/scrape-electrolux-professional.mjs --cod 371002 --url "https://www.electroluxprofessional.com/tr/pd/...-371002/"

# Döküman indirmeden (hızlı)
node scripts/scrape-electrolux-professional.mjs --no-media --limit 50
```

Her ürün JSON'unda:
- **specifications** — Özellikler (Temel bilgiler, Gaz, …)
- **features** — Ürün özellikleri (Main Features, Construction, …)
- **documents** — Broşür, veri sayfası, CAD, BIM/Revit URL + yerel kopya
- **images** — Galeri (1000×1000 + thumb)
- **accessories** — Dahil aksesuarlar
