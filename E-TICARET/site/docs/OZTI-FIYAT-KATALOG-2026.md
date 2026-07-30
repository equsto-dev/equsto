# Öztiryakiler — fiyat listesi + PDF katalog eşleştirme

Kaynaklar (Downloads):

- `Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx` → **Sayfa1** (ürün + fiyat + iskonto)
- `Öztiryakiler-Urun-katalogu-2026.pdf` → teknik katalog (metin katmanı)
- `Yeni Soğukoda Fiyat 25.11.2014 İSK.xls` → repo: `scripts/data/sources/ozti-sogukoda-fiyat-2014-isk.xls` (soğuk oda segmenti, arşiv)

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

### Bayi iskonto → net alış → Equsto satış

Excel **BAYİ İSKONTO** sütunu = **indirim oranı** (ondalık). H1 *«pişiriciler %73 iskonto»* → sütunda **0,73** = **%73 iskonto**.

```
iskonto_yuzde     = bayi_iskonto × 100           (örn. 0,73 → %73)
kalan_oran        = 1 − bayi_iskonto             (örn. 0,27)
bayi_net_eur      = liste_fiyati_eur × kalan_oran
equsto_net_eur    = bayi_net_eur × 1,08          (%8 Equsto kar)
fiyat_tl_kdv_dahil = equsto_net_eur × kur × 1,20
```

Örnek **7865.N1.80908.10**: liste **5.877,18 EUR**, iskonto **0,73** → bayi net **1.586,84 EUR** → Equsto **1.713,79 EUR** (+ %8).

| Excel (iskonto oranı) | İskonto % | Ürün sayısı (2025-3 xlsx) |
|----------------------|-----------|---------------------------|
| 0,73 | 73 | ~2.098 |
| 0,58 | 58 | ~738 |
| 0,65 | 65 | ~583 |
| 0,60 | 60 | ~94 |

JSON: `liste_fiyati_eur`, `bayi_iskonto`, `kalan_oran`, `alis_fiyati_eur` (bayi net), `satis_fiyati_eur` (Equsto net + %8).

Mağaza: `ozti-enrich.mjs` (`OZTI_EQUSTO_KAR_ORAN = 0,188` — bayi net ×1,188; önceki %8’e göre satış %10 yüksek), `eq-kur-live.js`, `equsto-pricing-core.js`.

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
