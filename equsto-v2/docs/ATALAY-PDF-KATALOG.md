# Atalay 2025 — PDF katalog (ekipmanlar.json yok)

Tüm Atalay vitrin verisi **yalnızca** `ATALAY 2025 YERLİ.pdf` ve elle doğrulanmış döner tablosundan gelir.  
`public/data/ekipmanlar.json` **kullanılmaz**.

## Komutlar

```cmd
cd /d "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
set ATALAY_PDF=c:\Users\User\Downloads\ATALAY 2025 YERLİ.pdf
npm run catalog:atalay:pdf
```

Adımlar: `catalog:atalay:extract` → `catalog:doner:parse` → `catalog:atalay:build` → görseller.

## Çıktılar

| Dosya | Açıklama |
|-------|----------|
| `scripts/data/atalay-pdf-catalog-raw.json` | PDF tablo/robot parse |
| `scripts/data/atalay-pdf-catalog.json` | Vitrin satırları (~575 SKU) |
| `public/data/dept/*.json` | **Yalnızca** Atalay satırları (eski markalar silinir) |
| `public/eq-atalay-catalog-only.js` | Mağaza JS filtresi (PFOS/BESOS etkilenmez) |
| `public/images/catalog/atalay/p{sayfa}/*.jpg` | Tablo sayfaları |
| `public/images/catalog/atalay/doner/*.jpg` | Döner ocak (s.129–144) |

## Fiyat

- Tablo ürünleri: **%50** liste indirimi + TCMB efektif satış
- Döner ocak (47 model): **%40** — bkz. `docs/ATALAY-DONER-OCAK.md`

## Mağazada yalnız Atalay (dosyadan silme)

Eski markalar **gizlenmez** — `dept/*.json` ve `ekipmanlar.json` içinden çıkarılır.

```cmd
npm run catalog:atalay:purge
npm run search:index
```

| Komut | Ne yapar |
|-------|----------|
| `catalog:atalay:strip` | `dept/*.json` → yalnız Atalay satırları |
| `catalog:atalay:ekipmanlar` | `dept` birleşimi → `ekipmanlar.json` (eski dosya `ekipmanlar-full-archive.json`) |
| `catalog:atalay:purge` | strip + ekipmanlar + `index.html` gömülü URUNLER temizliği + `../public/data` senkron |
| `catalog:atalay:only` | purge + Meilisearch yeniden indeks |

PFOS/BESOS/WhatsApp HTML’ine dokunulmaz; tam eski katalog yedeği: `public/data/ekipmanlar-full-archive.json`.

## Yasak

```cmd
npm run catalog:atalay:merge
```

Bu komut artık hata verir (eski `ekipmanlar.json` birleştirmesi).
