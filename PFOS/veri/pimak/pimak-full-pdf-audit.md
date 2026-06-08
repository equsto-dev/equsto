# Pimak 27-27-030426.pdf — tam fiyat denetimi

Kaynak: `C:\D Disk\FİYAT LİSTELERİ\pimak 27-27-030426.pdf` (218 sayfa)

## Sonuç (2026-06-08)

| Metrik | Değer |
|--------|------:|
| PDF blok parse SKU | **815** |
| `pimak-fiyat.json` satır | **1020** |
| Sitede eşleşen (Equsto PDF + Pimak) | **558** |
| **Site ↔ PDF fiyat hatası** | **0** |
| **sync ↔ PDF fiyat hatası** | **0** |
| PDF’de kod bulunamayan site ürünü | 99 (fiyatsız veya web kodu farklı) |

## Yapılan düzeltmeler

1. `pimak_pdf_blocks.py` — çoklu tablo, ileri/geri Fiyat kolonu, fiyat listesi kesme
2. `sync-pimak-fiyat-pdf.py` — blok parse birincil, satır içi tarama yedek
3. `import-pimak.mjs` — PDF fiyat haritası manuel JSON’dan önce
4. Equsto s.188–197 — önceki blok parse (302 ürün, 0 hata)

## Doğrulanan örnekler

| Kod | PDF € | Site € |
|-----|------:|-------:|
| EQUSTO.16070.04 | 630 | 630 |
| BPD | 1250 | 1250 |
| KM012-4 | 3700 | 3700 |
| DR04-503030.00 | 80 | 80 |
| BPKM.32SCK | 3300 | 3300 |

## 99 PDF eşleşmeyen site ürünü

Pimak web katalogundan gelen kodlar (M003R, FRN-SMK, servis hattı vb.) PDF tablo yapısında farklı kodla geçiyor veya fiyatsız satır — `fiyat_bekleniyor: true` olarak kalır.

Detay JSON: `pimak-full-pdf-audit.json`
