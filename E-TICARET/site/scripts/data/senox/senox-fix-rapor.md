# Şenox Katalog Fiyat Düzeltme Raporu

**Tarih:** 2026-06-19T11:48:25.638Z
**Kaynak:** SENOX 2026-1 PDF (245 ürün, 486 fiyat kodu)
**Formül:** Equsto = PDF liste EUR × 50% × kur × 1.20 (KDV dahil)
**Kur:** 1 EUR = 53.2898 TRY

> **DRY-RUN** — dosyalara yazılmadı

## Özet

| Metrik | Değer |
|--------|-------|
| Equsto Şenox ürün | 214 |
| Düzeltilen | **0** |
| Kaynak Mutbex → PDF | 0 |
| OCR hatası → Mutbex | 0 |
| Fiyat artan | 0 |
| Fiyat düşen | 0 |
| Manuel TL | 0 |
| Zaten doğru | 211 |
| Hedef kaynak PDF | 116 |
| Hedef kaynak Mutbex | 97 |
| PDF ≠ Mutbex çakışma | 115 |

## Teknik düzeltmeler

1. **PDF yeniden çıkarım** — `SENOX 2026-1 4 (1).pdf`
2. **descMap birleştirme** — çoklu varyant tabloları (SBC/SBCS, SLD, ADA, MT …)
3. **Kısa kod indeksi** — BS, DVF, VN, SET, KO, CMVA vb.
4. **OCR güvenlik** — PDF liste > Mutbex × 2,5 ise Mutbex tercih
5. **Override** — DT, WN, VM, SLD-03/04, YSO, SNX-17/25 …

## OCR reddedildi (Mutbex tercih)

| Model | PDF € (hatalı) | Mut € | TL |
| --- | --- | --- | --- |
| DVF-01 | 1000 | 43 | ₺1.375 |
| VN-25HA | 1400 | 438.6 | ₺14.024 |

## PDF'de yok — Mutbex liste × %50

_95 ürün; SENOX PDF'de kod yok, Mutbex satış × 2 = liste._

| Model | SKU | Liste € | TL KDV dahil |
| --- | --- | --- | --- |
| HIJYENB-TF | 118.HIJYENB.TF | 12900 | ₺412.463 |
| CKM-180T | 118.CKM.180T | 12900 | ₺412.463 |
| HIJYENB | 118.HIJYENB | 11610 | ₺371.217 |
| DP-98 | 118.DP.98 | 11610 | ₺371.217 |
| CKM-150T | 118.CKM.150T | 10965 | ₺350.594 |
| CKM-120T | 118.CKM.120T | 9030 | ₺288.724 |
| PST-200T | 118.PST.200T | 9030 | ₺288.724 |
| PST-150T | 118.PST.150T | 7740 | ₺247.478 |
| MT-213 | 118.MT.213 | 7095 | ₺226.855 |
| DP-360 | 118.DP.360 | 6450 | ₺206.232 |
| DP-600 | 118.DP.600 | 5805 | ₺185.608 |
| ICT-130 | 118.ICT.130 | 5805 | ₺185.608 |
| SSC-1600 | 118.SSC.1600 | 4773 | ₺152.611 |
| SEMG-16K | 118.SEMG.16K | 4515 | ₺144.362 |
| SSC-1500 | 118.SSC.1500 | 4515 | ₺144.362 |
| SC-900-K | 118.SC900.K | 4300 | ₺137.488 |
| SDS-1510-DC-3CF | 118.SDS1510.DC3CF | 4257 | ₺136.113 |
| BLK-01-110 | 118.BLK01.110 | 4128 | ₺131.988 |
| BLK-01-90 | 118.BLK01.90 | 3934.5 | ₺125.801 |
| DP-250 | 118.DP.250 | 3870 | ₺123.739 |
| CKA | 118.CKA | 3289.5 | ₺105.178 |
| DP-270 | 118.DP.270 | 3096 | ₺98.991 |
| SSC-900 | 118.SSC.900 | 3031.5 | ₺96.929 |
| SSC-900K | 118.SSC.900K | 3031.5 | ₺96.929 |
| SDS-770-DC-2DF | 118.SDS770.DC2DF | 2967 | ₺94.867 |
| PD-400D | 118.PD400D | 2967 | ₺94.867 |
| SDS-1010-DC-2CF-S | 118.SDS1010.DC2CF.S | 2902.5 | ₺92.804 |
| SDS-1010-SC-2CF-S | 118.SDS1010.SC2CF.S | 2902.5 | ₺92.804 |
| SDS-1010-DC-2YF-S | 118.SDS1010.DC2YF.S | 2902.5 | ₺92.804 |
| SDS-1010-SC-2YF-S | 118.SDS1010.SC2YF.S | 2902.5 | ₺92.804 |
| S-900K | 118.S.900K | 2709 | ₺86.617 |
| PD-400 | 118.PD400 | 2709 | ₺86.617 |
| SDS-1010-DC-2CF-B | 118.SDS1010.DC2CF.B | 2580 | ₺82.493 |
| SDS-1010-SC-2CF-B | 118.SDS1010.SC2CF.B | 2580 | ₺82.493 |
| SDS-1010-SC-2YF-B | 118.SDS1010.SC2YF.B | 2580 | ₺82.493 |
| KSC-458 | 118.KSC.458 | 2580 | ₺82.493 |
| SET-E-120S | 118.SET.E.120S | 2580 | ₺82.493 |
| AAMH-300 | 118.AAMH300 | 2451 | ₺78.368 |
| WF-377 | 118.WF377 | 2451 | ₺78.368 |
| 300-COMBİ | 118.300.COMBİ | 2386.5 | ₺76.306 |
| … | | | +55 ürün |
