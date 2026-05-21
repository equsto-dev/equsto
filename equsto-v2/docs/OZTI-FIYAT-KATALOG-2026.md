# Öztiryakiler — fiyat listesi + PDF katalog eşleştirme

Kaynaklar (Downloads):

- `Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx` → **Sayfa1** (ürün + fiyat + iskonto)
- `Öztiryakiler-Urun-katalogu-2026.pdf` → teknik katalog (metin katmanı)

## Komut

```cmd
cd equsto-v2
python scripts/merge-ozti-fiyat-katalog.py
```

## Çıktılar (`scripts/data/`)

| Dosya | İçerik |
|-------|--------|
| `ozti-fiyat-2025.json` | 4.754 ürün — kod, tanım, liste fiyatı (EUR), bayi iskonto, barkod, kategori yolu |
| `ozti-katalog-pdf-2026.json` | PDF’te geçen kodlar + sayfa no + satır örnekleri |
| `ozti-eslesme-2026.json` | Fiyat + PDF birleşik (eşleşme bayrağı) |
| `ozti-eslesme-pdf-only.json` | Yalnız PDF’te görünen kodlar |
| `ozti-kategoriler-2026.json` | Kategori ağacı (yaprak gruplu ürün listesi) |
| `ozti-eslesme-ozet.json` | İstatistik + örnek kayıtlar |

## Son çalıştırma özeti

- **Eşleşen:** ~4.245 kod (hem fiyat listesinde hem PDF’te)
- **Sadece fiyat listesi:** ~426 (PDF’te metin olarak yok — yeni/variant veya görsel sayfa)
- **Sadece PDF:** ~661 (fiyat listesinde satır yok — aksesuar / eski kod / farklı format)

### Bayi iskonto → satış fiyatı (EUR)

Excel **BAYİ İSKONTO** = **indirim oranı** (ondalık). Örn. **0,65** → **%65 indirim**, ödeme çarpanı **0,35**:

```
odeme_carpani     = 1 − bayi_iskonto
satis_fiyati_eur  = liste_fiyati_eur × odeme_carpani
iskonto_yuzde     = bayi_iskonto × 100
```

Örnek: liste **1.461,57 EUR**, bayi iskonto **0,65** → satış **511,55 EUR** (liste × **0,35**).

| Bayi iskonto (Excel) | İndirim % | Ödeme çarpanı | Ürün sayısı (yaklaşık) |
|----------------------|-----------|---------------|------------------------|
| 0,65 | 65 | 0,35 | 2.301 |
| 0,55 | 55 | 0,45 | 1.250 |
| 0,60 | 60 | 0,40 | 1.023 |
| 0,50 | 50 | 0,50 | 40 |
| (boş) | 0 | 1,00 | 140 |

JSON: `liste_fiyati_eur`, `bayi_iskonto`, `odeme_carpani`, `satis_fiyati_eur`, `iskonto_yuzde`, `iskonto_tutar_eur`.

`equsto-pricing-core.js` ve `eq-kur-live.js` satışı `iskonto_oran` / `satis_fiyati_eur` ile hesaplar; mağazada TL + canlı kur sıradaki adım.

## Set üstü vitrin (sol liste)

- Sol çekmece: **Set Üstü Mutfak Ekipmanları** + PDF içindekiler (24 alt dal)
- PLP: `/shop/set-ustu-mutfak` — `public/data/dept/set-ustu-mutfak.json` (**~1.767** Öztiryakiler SKU)
- Ana sayfa şeritleri: bu ürünler **vitrinde gösterilmez** (`vitrin_arka_plan`)

```cmd
npm run catalog:ozti:merge
npm run catalog:ozti:full
```

`catalog:ozti:full` = PDF görselleri + tüm dept dosyaları + `ekipmanlar.json` + `search:index`.

| Komut | Ne yapar |
|-------|----------|
| `catalog:ozti:merge` | xlsx + PDF → `scripts/data/ozti-eslesme-2026.json` |
| `catalog:ozti:images` | PDF → `public/images/catalog/ozti/` |
| `catalog:ozti:build` | 4754 ürün → `dept/*.json` (specs, keywords, ölçüler, aciklama) |
| `catalog:ozti:set-ustu` | Yalnız set üstü departmanı (alt kategori slug’ları ile) |
| `catalog:ozti:ekipmanlar` | dept → `ekipmanlar.json` |

Yönetim paneli **Katalog & görseller** (`/yonetim/katalog`) — varsayılan filtre **Öztiryakiler**.

### Notlar

- **Sayfa2** (36k satır, MADDE KODU) yedek parça listesi; bu script’e dahil değil.
- Mağaza vitrininde **tüm markalar** (`dept` + `ekipmanlar.json`); Atalay ile başlanan PDF kataloğu bunlardan bir parça. Öztiryakiler (`set-ustu-mutfak`) ayrı departman sayfasında.
