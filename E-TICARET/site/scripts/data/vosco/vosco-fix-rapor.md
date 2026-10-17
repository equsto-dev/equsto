# Vosco Katalog Fiyat Düzeltme Raporu

**Tarih:** 2026-10-17T17:01:56.921Z
**Kaynak:** Vosco Katalog 2026 PDF (156 ürün, 125 kod)
**Formül:** Equsto = liste (USD/EUR→TL TCMB) × **48%** (%52 iskonto) × 1.20 KDV
**Kur:** 1 USD = 47.3206 TRY · 1 EUR = 53.8725 TRY

## Özet

| Metrik | Değer |
|--------|-------|
| Equsto Vosco ürün | 189 |
| Düzeltilen | **0** |
| İskonto %45→%48 | 0 |
| Liste fiyatı düzeltme | 0 |
| Manuel TL | 4 |
| Site fallback (PDF yok) | 26 |
| Fiyatsız | 1 |
| Hedef kaynak PDF | 133 |

## Teknik

- `VOSCO_SATIS_ORAN = 0.48` (müşteri listenin %48'ini öder)
- PDF USD/EUR → TCMB kur ile TL, ardından × 0.48 + KDV
- PDF'de olmayan 12 ürün: vosco.com.tr site fiyatı veya manuel TL

## PDF'de yok (site / manuel)

| Model | Kaynak | TL |
| --- | --- | --- |
| VICM-15A | vosco-site-tl | ₺20.744 |
| VSC-MT3 | vosco-site-tl | ₺1.083 |
| VSC-MT4 | undefined | — |
| VSC-MT58 | vosco-site-tl | ₺461 |
| VSC-MT58-PT | vosco-site-tl | ₺598 |
| VSC-MT6 | vosco-site-tl | ₺2.347 |
| VHS-J319 | vosco-site-tl | ₺2.581 |
| VKM-G3R | vosco-site-tl | ₺31.807 |
| VKM-G4R | vosco-site-tl | ₺34.573 |
| VKM-G5R | vosco-site-tl | ₺40.105 |
| VSC-70C | vosco-site-tl | ₺80.599 |
| VXY-SJ15X1S | vosco-site-tl | ₺60.848 |
| VXY-SJ15X1SR | vosco-site-tl | ₺60.848 |
| VXY-SJ15X2S | vosco-site-tl | ₺83.667 |
| VXY-SJ15X2SR | vosco-site-tl | ₺83.667 |
| VLJH-12 | vosco-manual-tl | ₺26.275 |
| VSC-6 | vosco-site-tl | ₺1.337 |
| VSC-600B | vosco-site-tl | ₺1.337 |
| VSC-KB1 | vosco-site-tl | ₺761 |
| VST-520ECB | vosco-manual-tl | ₺42.375 |
| VST-520ECS | vosco-manual-tl | ₺42.375 |
| VSC-PCS | vosco-site-tl | ₺1.750 |
| VSC.F03 | cafemarkt-plp | ₺119.635 |
| VSL.FRT2C08B | cafemarkt-plp | ₺53.870 |
| VCP.03 | cafemarkt-plp | ₺29.244 |
| VBL.818 | cafemarkt-plp | ₺7.080 |
| VAF.95 | cafemarkt-plp | ₺177.001 |
| VACK.240 | cafemarkt-plp | ₺130.827 |
| VCP.04 | cafemarkt-plp | ₺50.792 |
| VBL.821 | cafemarkt-plp | ₺9.235 |
| VBL.818A | cafemarkt-plp | ₺6.464 |
| VAS.WN6D | cafemarkt-plp | ₺530.003 |
| VBL.822 | cafemarkt-plp | ₺10.774 |
| VBL.820 | cafemarkt-plp | ₺9.235 |
| VAS.CH10Q | cafemarkt-plp | ₺400.176 |
| VAS.CH10D | cafemarkt-plp | ₺400.176 |
| VBL.922 | cafemarkt-plp | ₺12.313 |
| VAS.WN10D | cafemarkt-plp | ₺591.836 |
| VACK.140 | cafemarkt-plp | ₺100.044 |
| VACK.120 | cafemarkt-plp | ₺76.957 |
| VESD.8A | cafemarkt-plp | ₺50.792 |
| VBL.819 | cafemarkt-plp | ₺8.619 |
| VAF.910 | cafemarkt-plp | ₺207.784 |
| VSC.F04 | cafemarkt-plp | ₺162.008 |
| VSC.F02 | cafemarkt-plp | ₺87.234 |
| V.6L.2 | cafemarkt-plp | ₺8.004 |
| V.6L | cafemarkt-plp | ₺4.310 |
| VSS-10H | vosco-site-tl | ₺14.106 |
| VWG-8T | vosco-site-tl | ₺63.614 |
| VAS-CME02 | vosco-site-tl | ₺21.020 |
| VWJG-5P | vosco-site-tl | ₺96.804 |
| VWG-4T | vosco-site-tl | ₺38.722 |
| FT-235LB | vosco-site-tl | ₺71.359 |
| FT-235LS | vosco-site-tl | ₺71.359 |
| VFTR-50L | vosco-manual-tl | ₺21.000 |
| VFTW-120LYP | vosco-site-tl | ₺46.466 |
