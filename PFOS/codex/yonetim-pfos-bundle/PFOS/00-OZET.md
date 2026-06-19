# PFOS — konuşma özeti (master)

Bu dosya, PFOS üzerine yapılan sohbetlerin **kronolojik ve konu bazlı** derlemesidir.

---

## 1. Teklif motoru ve UI iyileştirmeleri

### Ölçü / SKU düzeltmeleri

| Sorun | Çözüm |
|-------|--------|
| Combi fırın `7890.60400.3T` ölçüde tepsi kapasitesi (3×40×60) | Kabin mm: **805×828×471** — `pfos-katalog-olcu-mm.json` |
| Kahve değirmeni `9584.00MDX.00` ölçüsü yok | **240×390×620** mm eklendi |
| Buz makinesi `9805.ODB14.0A` | mm eklendi |
| `bar_buzdolabi` yanlış (1500×700 bar altı) | **Şişe soğutucu 3 kapılı** `8919.BBC35.00` → **1350×505×850** mm |

İlgili: `lib/pfos/teklif/olcu-mm.ts`, `shop-catalog-match.ts`, `pfos-tip-shop-links.json`

### Kur (TCMB)

- Canlı kur: **`GET /api/kur`** (TCMB efektif satış)
- Wizard + Excel export aynı kuru kullanır
- `lib/pfos/teklif/fetch-kur.client.ts`

### UI (yönetim)

- Kullanıcıya **“v14”** ifadesi kaldırıldı (iç kod adları duruyor)
- Kalem tablosunda **“Katalog: …”** ve **“Zone katalog”** badge kaldırıldı
- **Gaz/Elk kW**: değer yoksa boş hücre (0 gösterme)
- Bölüm satırları (`01. BAR & KAHVE` …): pastel yeşil `#e6f4ea`

---

## 2. All Day Dining — referans proformalar (200–400 m²)

**Kaynaklar (kullanıcı):**

- `THC BAKÜ PROFORMA.pdf`
- `THC DÜNYA MUTFAĞI.pdf` (yerleşim: kafe ~78,5 m², mutfak ~39 m², bar ~8 m²)
- `AB THC KAYSERİ.pdf`
- `2017-073-1.xlsx` (AGÜ Kayseri)
- Arşiv: `2017-044-6.1.xlsx` (Bakü)

**Üretilen profiller:**

| ID | m² | Kalem |
|----|-----|-------|
| `thc-baku-280` | 280 | 42 (PDF poz C/D/E/F) |
| `thc-kayseri-073` | 250 | 43 (xlsx zone) |

**Dosyalar:** `public/data/pfos-all-day-dining-referanslar.json`, `lib/pfos/referans/all-day-dining/`

**Komut:** `npm run pfos:referans:all-day-dining`

---

## 3. S13-388 — Türk Restoranı + All Day (150–300 m²)

**Kaynak:** `S13-388-2-Model.pdf` (Sütiş tipi yerleşim; plan ~296 m²)

| Profil | Konsept | Kalemler |
|--------|---------|----------|
| `s13-388-turk-220` | `turk-restoran` | 40 (32 zorunlu + **8 teşhir tavsiye**) |
| `s13-388-all-day-220` | `all-day-dining-cafe` | Aynı hat, farklı `urunTipi` eşlemesi |

**Teşhir vitrinleri:** Börek, soğuk teşhir, pasta, kahvaltı, sütlü tatlı, kurabiye, salata, et teşhir → `tip: "tavsiye"` (opsiyonellik **henüz karar verilmedi**).

**Komut:** `npm run pfos:referans:s13-388`

Türk restoranı motoru artık **S13 referans şablonundan** üretiliyor; `pfosZones: []` (zone katalog eklenmez).

---

## 4. Sektör taksonomisi (Restaurant & Cafe)

- **Üst kategori:** Restaurant & Cafe ✓
- **28 alt kategori** havuzu (Mado / Sütiş / Şazeli tarzı) — hepsi ayrı motor şablonu olmak zorunda değil
- **Tercih edilen 10 segment** (TR pazarı + premium Equsto) — bkz. [01-SEKTOR-TAKSONOMI.md](./01-SEKTOR-TAKSONOMI.md)

---

## 5. PFOS wizard — detay sorusu (planlanan)

> **“Bu bilgiler yeterli mi, yoksa projeyi senin için detaylandırayım mı?”**

| Seçenek | `detaySeviyesi` |
|---------|------------------|
| Yeterli — hızlı teklif | `hizli` |
| Detaylandır | `detayli` |

API’de aynı alan; partner UI sorusunu atlayabilir. Bkz. [03-WIZARD-VE-API.md](./03-WIZARD-VE-API.md)

---

## 6. API-esnek yapı (planlanan)

- `ustKategori` → `segment` → `konsept` → `referansId`
- Versiyonlu `pfos-sektor-taksonomisi.json`
- `GET /api/pfos/taxonomy`, `GET /api/pfos/referanslar`, `POST /api/pfos/quote` (+ preview)

Henüz tam uygulanmadı; mevcut API: `konsept` + `m2` + `bolumM2?`

---

## 7. Espressolab (coffee-shop)

- 3 şube referansı: `espressolab-sube-1/2/3`
- Kaynak: `lib/pfos/referans/coffee-shop-espressolab.ts` + `pfos-coffee-shop-referanslar.json`
- Varsayılan: `espressolab-sube-3`

---

## 8. Arşiv projeler (2017)

| ID | Proje | PFOS konsept / dükkan |
|----|-------|------------------------|
| 2017-044 | THC Bakü | All Day Cafe |
| 2017-073 | THC AGÜ Kayseri | All Day Cafe |
| 2017-120 | Sütiş Mersin | Türk Restoran |
| 2017-050 | DoubleTree Topkapı | Hotel |
| 2017-204 | Vadistanbul | Food Court |

Çıkarım: `python scripts/extract-pfos-referans-projeler.py`
