# Vosco Katalog Fiyat Düzeltme Raporu

**Tarih:** 2026-06-19T12:17:46.868Z
**Kaynak:** Vosco Katalog 2026 PDF (157 ürün, 156 kod)
**Formül:** Equsto = liste (USD/EUR→TL TCMB) × **48%** (%52 iskonto) × 1.20 KDV
**Kur:** 1 USD = 46.3988 TRY · 1 EUR = 53.2898 TRY

> **DRY-RUN** — dosyalara yazılmadı

## Özet

| Metrik | Değer |
|--------|-------|
| Equsto Vosco ürün | 164 |
| Düzeltilen | **0** |
| İskonto %45→%48 | 0 |
| Liste fiyatı düzeltme | 0 |
| Manuel TL | 4 |
| Site fallback (PDF yok) | 7 |
| Fiyatsız | 1 |
| Hedef kaynak PDF | 152 |

## Teknik

- `VOSCO_SATIS_ORAN = 0.48` (müşteri listenin %48'ini öder)
- PDF USD/EUR → TCMB kur ile TL, ardından × 0.48 + KDV
- PDF'de olmayan 12 ürün: vosco.com.tr site fiyatı veya manuel TL

## PDF'de yok (site / manuel)

| Model | Kaynak | TL |
| --- | --- | --- |
| VSC-MT3 | vosco-site-tl | ₺1.083 |
| VSC-MT4 | undefined | — |
| VSC-MT58 | vosco-site-tl | ₺461 |
| VSC-MT58-PT | vosco-site-tl | ₺598 |
| VSC-MT6 | vosco-site-tl | ₺2.347 |
| VHS-J319 | vosco-site-tl | ₺2.581 |
| VSC-70C | vosco-site-tl | ₺80.599 |
| VLJH-12 | vosco-manual-tl | ₺26.275 |
| VST-520ECB | vosco-manual-tl | ₺42.375 |
| VST-520ECS | vosco-manual-tl | ₺42.375 |
| VSC-PCS | vosco-site-tl | ₺1.750 |
| VFTR-50L | vosco-manual-tl | ₺21.000 |
