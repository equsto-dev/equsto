# PFOS teklif şablonu — ilk yıl marka paneli

**Durum:** Yönetim sihirbazı (`/yonetim/pfos`) · Proforma v14  
**Fiyat stratejisi UI:** Kaldırıldı — motor varsayılanı `orta` segment.

## Coffee shop — Espressolab referans kütüphanesi

Kaynak: `lib/pfos/referans/coffee-shop-espressolab.ts`  
JSON yedek: `public/data/pfos-coffee-shop-referanslar.json`

| ID | Etiket | Poz aralığı | Not |
|----|--------|-------------|-----|
| `espressolab-sube-1` | Şube 1 (geniş) | A1–A28 | 3+2 kapılı soğutucu, depo G |
| `espressolab-sube-2` | Şube 2 (kompakt) | A1–A27 | Setaltı derin dondurucu, montaj A27 |
| `espressolab-sube-3` | Şube 3 (tam) | A1–A30 | **Varsayılan** — içecek havuzu, ek tezgahlar, istif raf |

Motor varsayılanı: `espressolab-sube-3`.

- Poz: PFOS üretir — **A1, A2, A3 …** (şablon sırası)
- Tanım: şablon metni · Marka/fiyat: e-ticaret SKU
- Zone katalog **kapalı**

## All day dining cafe — referans

Kaynak: `lib/pfos/referans/all-day-dining/` · `lib/pfos/core/rules/all-day-dining-cafe/items.ts`

| ID | Etiket | Referans m² |
|----|--------|-------------|
| `thc-baku-280` | THC Bakü / All Day Dining | **280** (varsayılan) |

- Poz: **A1, A2, A3 …** (kategori sırası A→H)
- Bölüm başlıkları: **01. BAR & KAHVE**, **02. SICAK SERVİS**, … (kategori etiketinden)
- Zone katalog **kapalı** — yalnızca referans şablon

Motor varsayılanı: `thc-baku-280`.

## Sonraki adım

Sihirbazda referans profil seçimi (dropdown) — `listCoffeeShopReferanslar()`.
