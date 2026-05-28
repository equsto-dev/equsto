# Referans proformalar ve projeler

Doğrulanmış gerçek proje listeleri → PFOS motor `referansId` + teklif pozları.

---

## Özet tablo

| Referans ID | Konsept | m² bandı | Kalem | Kaynak |
|-------------|---------|----------|-------|--------|
| `thc-baku-280` | all-day-dining-cafe | 200–400 (ref 280) | 42 | THC BAKÜ PROFORMA.pdf + 2017-044 xlsx |
| `thc-kayseri-073` | all-day-dining-cafe | 200–400 (ref 250) | 43 | 2017-073-1.xlsx |
| `s13-388-turk-220` | turk-restoran | 150–300 (ref 220) | 40 | S13-388-2-Model.pdf |
| `s13-388-all-day-220` | all-day-dining-cafe | 150–300 (ref 220) | 40 | S13-388 (aynı hat) |
| `espressolab-sube-1` | coffee-shop | — | geniş | Espressolab proforma |
| `espressolab-sube-2` | coffee-shop | — | kompakt | Espressolab proforma |
| `espressolab-sube-3` | coffee-shop | — | tam (varsayılan) | Espressolab proforma |

---

## THC Bakü (2017-044)

**Profil:** `thc-baku-280`  
**JSON:** `public/data/pfos-all-day-dining-referanslar.json`

**Kaynak dosyalar:**

| Dosya | Yol |
|-------|-----|
| Proforma PDF | `c:\Users\User\OneDrive\Masaüstü\THC BAKÜ PROFORMA.pdf` |
| Yerleşim PDF | `c:\Users\User\OneDrive\Masaüstü\THC DÜNYA MUTFAĞI.pdf` |
| xlsx | `C:\D Disk\EQUSTO-CURSOR\arşiv\projeler\2017-044 THC BAKÜ +\2017-044-6.1.xlsx` |

**Yerleşim notları (DÜNYA MUTFAĞI):** kafe ~78,5 m², mutfak ~39 m², bar ~8 m², koridor+servis ~30 m².

**Özellik:** Gerçek proforma poz kodları (C2, C21, E4, D1, F1 …).

---

## THC Kayseri / AGÜ (2017-073)

**Profil:** `thc-kayseri-073`

| Dosya | Yol |
|-------|-----|
| xlsx | `C:\D Disk\2017\2017-073 THC ABDULLAH GÜL ÜNİVERSİTESİ KAYSERİ\2017-073-1.xlsx` |
| Plan PDF | `c:\Users\User\OneDrive\Masaüstü\AB THC KAYSERİ.pdf` |

**Zone dağılımı (xlsx):** bar 16, izgara_meze 23, bulaşıkhane 4 (şartlar satırları hariç).

---

## S13-388 (Sütiş tipi model)

**Profiller:** `s13-388-turk-220`, `s13-388-all-day-220`  
**JSON:** `public/data/pfos-s13-388-referanslar.json`

| Dosya | Yol |
|-------|-----|
| Model PDF | `c:\Users\User\OneDrive\Masaüstü\S13-388-2-Model.pdf` |

**Plan alanları (PDF):** ~205,94 + ~89 m² ≈ 296 m² toplam footprint.

**Teşhir kalemleri (8 adet, `tip: tavsiye`):**

- Börek teşhir dolabı  
- Soğuk teşhir dolabı (motor dışarıda)  
- Pasta dolabı  
- Kahvaltı dolabı  
- Sütlü tatlı dolabı  
- Kurabiye dolabı  
- Salata dolabı (çekmeceli)  
- Et teşhir dolabı  

> Kullanıcı notu: teşhir vitrinleri opsiyonel mi zorunlu mu — **karar bekliyor**.

**Sıcak hat özeti:** tandır, taş fırın, kömürlü ızgara, döner, iskender, davlumbaz ×2, fritöz, bain-marie, make-up, tezgah tipi buzdolabı …

---

## Espressolab (coffee-shop)

**Kod:** `lib/pfos/referans/coffee-shop-espressolab.ts`  
**Yedek JSON:** `public/data/pfos-coffee-shop-referanslar.json`  
**Varsayılan:** `espressolab-sube-3`

Şube 1 geniş (3+2 kapılı soğutucu, depo G), şube 2 kompakt, şube 3 tam set.

---

## Arşiv 2017 (zone çıkarımı)

**Script:** `scripts/extract-pfos-referans-projeler.py`  
**Çıktı:** `public/data/pfos-referans-projeler.json`, `pfos-zone-proje-kurallari.json`

| ID | Proje | PFOS dükkan |
|----|-------|-------------|
| 2017-050 | DoubleTree Hilton Topkapı | 5 Yıldız Otel |
| 2017-044 | THC Bakü | All Day Cafe |
| 2017-073 | THC AGÜ Kayseri | All Day Cafe |
| 2017-120 | Sütiş Mersin | Türk Restoran |
| 2017-204 | Vadistanbul | Food Court |

---

## Referans kod modülleri

| Konsept | Modül |
|---------|--------|
| all-day-dining-cafe | `lib/pfos/referans/all-day-dining/` (+ THC JSON, S13 merge) |
| turk-restoran | `lib/pfos/referans/turk-restoran/` (S13 varsayılan) |
| coffee-shop | `lib/pfos/referans/coffee-shop-espressolab.ts` |
| S13 paylaşımlı | `lib/pfos/referans/s13-388.ts` |

**Yenileme komutları:** [07-KOMUTLAR.md](./07-KOMUTLAR.md)
