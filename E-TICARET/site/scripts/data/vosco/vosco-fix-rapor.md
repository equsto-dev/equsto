# Vosco Katalog Fiyat Düzeltme Raporu

**Tarih:** 2026-06-19T13:37:18.954Z
**Kaynak:** Vosco Katalog 2026 PDF (157 ürün, 142 kod)
**Formül:** Equsto = liste (USD/EUR→TL TCMB) × **48%** (%52 iskonto) × 1.20 KDV
**Kur:** 1 USD = 46.4253 TRY · 1 EUR = 53.1848 TRY

## Özet

| Metrik | Değer |
|--------|-------|
| Equsto Vosco ürün | 164 |
| Düzeltilen | **0** |
| İskonto %45→%48 | 0 |
| Liste fiyatı düzeltme | 0 |
| Manuel TL | 4 |
| Site fallback (PDF yok) | 15 |
| Fiyatsız | 1 |
| Hedef kaynak PDF | 144 |

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
| VXY-PT965S | vosco-site-tl | ₺187.662 |
| VHS-J319 | vosco-site-tl | ₺2.581 |
| VKM-G3R | vosco-site-tl | ₺31.807 |
| VHS-360CG | vosco-site-tl | ₺10.510 |
| VHS-360CS | vosco-site-tl | ₺10.510 |
| VSC-70C | vosco-site-tl | ₺80.599 |
| VLJH-12 | vosco-manual-tl | ₺26.275 |
| VSC-KB1 | vosco-site-tl | ₺761 |
| VST-520ECB | vosco-manual-tl | ₺42.375 |
| VST-520ECS | vosco-manual-tl | ₺42.375 |
| VAF-74B | vosco-site-tl | ₺49.785 |
| VAF-74K | vosco-site-tl | ₺54.764 |
| VAF-74S | vosco-site-tl | ₺49.785 |
| VSC-PCS | vosco-site-tl | ₺1.750 |
| VFTR-50L | vosco-manual-tl | ₺21.000 |
