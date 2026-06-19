# PFOS — detaylandırılacak konsept hatırlatmaları

Bu dosya, referans listesi içe aktarılmış ancak **sihirbaz / teklif motoru henüz bağlanmamış** projeleri takip eder.

**İlke:** Eski referans listeleri ve şablonlar **silinmez**. Yeni proje listesi eklenir; teklifte hangi kaynağın kullanılacağına m² kuralı, `referansId` veya ileride **AI** karar verir.

---

## ⏸ Site performansı (PageSpeed) — sonra

**Tarih notu:** 2026-05-31 · Mobil skor ~62 · **LCP 8,6 sn** (hedef &lt;2,5 sn)

Öncelikli işler (PFOS sonrası):

1. Hero görselleri WebP/AVIF + mobil `srcset`; tek `fetchpriority="high"` (PFOS veya Besos)
2. Ana sayfa script diyeti: `pfos-rule-engine`, `equsto-engine`, `eq-product-compare` → lazy / PFOS tıklanınca
3. Çift `theme.css` / `eq-home-mutbex.css` linklerini tekilleştir
4. Orta vade: ürün şeritleri SSR, `next/image`

Detay: sohbet özeti + `E-TICARET/site` ana sayfa (`LegacyVitrinPage`, `HOME_SCRIPTS`).

---

## 2016-101 — Muş Selinöz Mimarlık (Türk mutfağı) — motor bağlandı

| Alan | Değer |
|------|--------|
| **Proje** | SELİNÖZ MİMARLIK MUŞ PROJESİ |
| **Kaynak Excel** | `2016-101 MUŞ SELİNÖZ MİMARLIK/2016-101.xlsx` |
| **Kopya** | `PFOS/veri/mus-selinoz-2016-101.xlsx` |
| **Referans JSON** | `E-TICARET/site/public/data/pfos-referans/mus-selinoz-turk-100-250.json` |
| **Motor slug (taslak)** | `mus-selinoz-turk` |
| **Shop type id** | `ff_mus_selinoz_turk` |
| **Kalem** | **89** poz (toplam adet import sonrası JSON’da) |
| **Durum** | `aktif` — motor: `mus-selinoz-turk` · Kiremit (`kiremit-akasya`) ile **karıştırma** |

### Kiremit Akasya (085) ile fark

- **Kiremit:** ~30 kalem, self servis / food court, 100–250 m², **aktif** → `ff_turk_mutfagi`
- **Muş 101:** **89** kalem, bar + pasta teşhir ağırlıklı, tam mutfak hatları (et/sebze/pişirme/sac tava/bulaşık)

### Bölüm dağılımı (özet)

| Bölüm | Kalem |
|-------|------:|
| BAR VE PASTA TEŞHİR | 22 |
| FIRIN SERVİS HATTI | 12 |
| ET HAZIRLIK | 9 |
| BULAŞIKHANE | 9 |
| SEBZE HAZIRLIK | 8 |
| SAC TAVA | 7 |
| HAMUR HAZIRLIK | 5 |
| PİŞİRME | 5 |
| MEVCUT CAFE TEŞHİR DOLAPLARI | 5 |
| SOĞAN HAZIRLIK | 3 |
| YER IZGARASI | 3 |
| KURU DEPO | 1 |

### Detaylandırırken netleştirilecekler

1. **Dükkan tipi:** Fast Food “Türk Mutfağı” mu, “Türk / Esnaf lokanta” (`turk-restoran`) mu, yeni alt tip mi?
2. **m² bandı:** Plan PDF / DWG (`2016-101-2.dwg`) ile referans m² doğrulansın (şimdilik **200 m²** taslak).
3. **Self servis vs masa servisi:** Liste cafe teşhir + bar + a la carte mutfağa işaret ediyor.
4. **Motor:** Ayrı slug (`mus-selinoz-turk`) mı, yoksa `kiremit-akasya` ikinci bant mı?
5. **PFOS panel:** Sihirbaz → Fast Food → **Türk Mutfağı — Lokanta** (`mus-selinoz-turk`).

### Komutlar

```bash
cd E-TICARET/site
npm run pfos:mus-selinoz:import
npx tsx scripts/seed-proje-akis-konsept.ts
```

---

## 2016-178 — Liva Fabrika (yerinde üretim mutfağı)

| Alan | Değer |
|------|--------|
| **Proje** | LİVA FABRİKA YEMEKHANESİ |
| **Kaynak Excel** | `2016-178 LİVA FABRİKA/2016-178.xlsx` |
| **Kopya** | `PFOS/veri/liva-fabrika-2016-178.xlsx` |
| **Teklif** | 2016-178 · Doruk Endüstriyel Mutfak (SKTürk) |
| **Kapasite** | **20–60 kişi** yerinde üretim / fabrika personel mutfağı |
| **Referans JSON** | `pfos-referans/yerinde-uretim-20-60.json` |
| **Motor slug (taslak)** | `yerinde-uretim` |
| **Shop type id** | `catering_yerinde` — “Yerinde Üretim” |
| **Kalem** | **18** poz · 18 adet |
| **Durum** | `planlanan` — liste + [yonetim/pfos](https://equsto.com/yonetim/pfos) Kategoriler; motor/sihirbaz yok |

### Bölüm dağılımı

| Bölüm | Kalem |
|-------|------:|
| MUTFAK | 14 |
| KURU DEPO | 3 |
| YER IZGARASI | 1 |

### Excel parse notu

Sütun kayması (Mefftech benzeri değil): **col2=poz** (K1, M1, Y1), **col4=ürün**, **col5=ölçü**, **col6=adet**.

### Büyük yemekhane (Yozgat) ile fark

| | Liva 178 | buyuk-yemekhane |
|--|----------|-----------------|
| Ölçek | 20–60 **kişi** | 2000–3500 **kişi/gün** |
| Kalem | 18 | 285 |
| Konsept | Fabrika **yerinde** üretim | Hastane/catering mega hat |

### Aktifleştirirken

1. `ListeBantId`: `20-60` (kişi bandı; `referansM2` = 40 kişi taslak)
2. Sihirbaz: Catering → **Yerinde Üretim**
3. `buyuk-yemekhane` ile **karıştırma**

### Komutlar

```bash
cd E-TICARET/site
npm run pfos:liva-yerinde:import
npx tsx scripts/seed-proje-akis-konsept.ts
```

---

## 2017-006 — Sütiş Şişhane (Türk restoranı) — aktif

| Alan | Değer |
|------|--------|
| **Proje** | SÜTİŞ ŞİŞHANE |
| **Kaynak Excel** | `2017-006 SÜTİŞ ŞİŞHANE/2017-006-2.xlsx` |
| **Kopya** | `PFOS/veri/sutis-sislihane-2017-006.xlsx` |
| **Referans JSON** | `pfos-referans/turk-restoran-200-5000.json` |
| **Motor** | `turk-restoran` |
| **Shop type** | `turk_restoran` — Türk / Esnaf lokanta |
| **m²** | **150–5000** (iki bant) |
| **Kalem** | S13 ~40 + Sütiş **77** |

### Bölümler

HAZIRLIK/DEPOLAR · PİDE · HAZIRLIK · SICAK SERVİS · BAR · BULAŞIKHANE · TEŞHİR

### Çift referans (silinmez)

| Kaynak | id | m² | Kalem |
|--------|-----|-----|------:|
| S13-388 PDF model | `s13-388-turk-220` | 150–300 | ~40 |
| Sütiş Excel 2017-006 | `turk-restoran-200-5000` | 200–5000 | 77 |

**Geçici kural:** ≤300 m² → S13; >300 m² → Sütiş. **İleride:** API `referansId` veya AI hangi listenin doğru olduğuna karar verecek.

```bash
npm run pfos:sutis-turk-restoran:import
npx tsx scripts/seed-proje-akis-konsept.ts
```

*Son güncelleme: 2026-05-31*
