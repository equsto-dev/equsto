# Vosco Katalog Fiyat Düzeltme Raporu

**Tarih:** 2026-06-19T13:22:53.001Z
**Kaynak:** Vosco Katalog 2026 PDF (157 ürün, 142 kod)
**Formül:** Equsto = liste (USD/EUR→TL TCMB) × **48%** (%52 iskonto) × 1.20 KDV
**Kur:** 1 USD = 46.4253 TRY · 1 EUR = 53.1848 TRY

## Özet

| Metrik | Değer |
|--------|-------|
| Equsto Vosco ürün | 164 |
| Düzeltilen | **25** |
| İskonto %45→%48 | 0 |
| Liste fiyatı düzeltme | 17 |
| Manuel TL | 4 |
| Site fallback (PDF yok) | 7 |
| Fiyatsız | 1 |
| Hedef kaynak PDF | 144 |

## Teknik

- `VOSCO_SATIS_ORAN = 0.48` (müşteri listenin %48'ini öder)
- PDF USD/EUR → TCMB kur ile TL, ardından × 0.48 + KDV
- PDF'de olmayan 12 ürün: vosco.com.tr site fiyatı veya manuel TL

## Düzeltilen ürünler

| Model | Tip | Eski TL | Yeni TL | Fark | Liste |
| --- | --- | --- | --- | --- | --- |
| VXY-PT965S | site_tl | ₺28.078 | ₺187.662 | +₺159.584 (568.4%) | vosco-site-tl |
| VAF-74K | site_tl | ₺32.089 | ₺54.764 | +₺22.675 (70.7%) | vosco-site-tl |
| VAF-74B | site_tl | ₺32.089 | ₺49.785 | +₺17.696 (55.1%) | vosco-site-tl |
| VAF-74S | site_tl | ₺32.089 | ₺49.785 | +₺17.696 (55.1%) | vosco-site-tl |
| VWG-8T | fiyat | ₺76.212 | ₺61.504 | ₺-14.708 (-19.3%) | $2300 |
| VAS-CME02 | fiyat | ₺20.323 | ₺10.162 | ₺-10.161 (-50.0%) | $380 |
| FT-235LB | fiyat | ₺78.886 | ₺68.992 | ₺-9.894 (-12.5%) | $2580 |
| FT-235LS | fiyat | ₺78.886 | ₺68.992 | ₺-9.894 (-12.5%) | $2580 |
| VWJG-5P | fiyat | ₺102.953 | ₺93.593 | ₺-9.360 (-9.1%) | $3500 |
| VSL-FRT1C12BB | fiyat | ₺54.819 | ₺46.797 | ₺-8.022 (-14.6%) | $1750 |
| VALP-C05D | fiyat | ₺4.279 | ₺10.696 | +₺6.417 (150.0%) | $400 |
| VWG-4T | fiyat | ₺42.786 | ₺37.437 | ₺-5.349 (-12.5%) | $1400 |
| VKM-G4R | fiyat | ₺33.426 | ₺30.752 | ₺-2.674 (-8.0%) | $1150 |
| VBL-813E | fiyat | ₺14.708 | ₺17.382 | +₺2.674 (18.2%) | $650 |
| VKB-450 | fiyat | ₺22.730 | ₺25.404 | +₺2.674 (11.8%) | $950 |
| VFTW-120LYP | fiyat | ₺49.471 | ₺46.797 | ₺-2.674 (-5.4%) | $1750 |
| VHF-F4 | fiyat | ₺8.022 | ₺6.150 | ₺-1.872 (-23.3%) | $230 |
| VHS-360CG | site_tl | ₺12.301 | ₺10.510 | ₺-1.791 (-14.6%) | vosco-site-tl |
| VHS-360CS | site_tl | ₺12.301 | ₺10.510 | ₺-1.791 (-14.6%) | vosco-site-tl |
| VSS-10H | fiyat | ₺12.033 | ₺13.638 | +₺1.605 (13.3%) | $510 |
| VKM-G3R | site_tl | ₺30.752 | ₺31.807 | +₺1.055 (3.4%) | vosco-site-tl |
| VSC-1 | fiyat | ₺1.337 | ₺936 | ₺-401 (-30.0%) | $35 |
| VALP-A83 | fiyat | ₺9.359 | ₺9.627 | +₺268 (2.9%) | $360 |
| VSC-300B | fiyat | ₺936 | ₺1.177 | +₺241 (25.7%) | $44 |
| VSC-KB1 | site_tl | ₺669 | ₺761 | +₺92 (13.8%) | vosco-site-tl |

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
