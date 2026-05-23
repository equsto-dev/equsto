# PFOS — Sektör taksonomisi (taslak)

> **Ana çalışma klasörü:** [`../PFOS/README.md`](../PFOS/README.md) — tüm PFOS notları, listeler ve referanslar burada derleniyor.

> **Amaç:** `/yonetim/pfos` ve PFOS motorunu eğitirken kullanılacak **üst kategori → alt kategori** yapısı.  
> **Durum:** Karar taslağı — henüz kod/schema’ya taşınmadı.  
> **Son güncelleme:** 2026-05-23 (API esnekliği + detay seviyesi sorusu eklendi)

---

## Üst kategori (onaylı)

**Restaurant & Cafe** — mevcut PFOS’ta tek `konseptUst: "Restaurant"` altında toplanan konseptlerin hedef üst etiketi.

---

## Referans: geniş sektör listesi (Mado / Sütiş / Şazeli tarzı)

Aşağıdaki liste “profesyonel alt kategori” havuzu olarak not edildi; hepsi ayrı PFOS şablonu olmak zorunda değil.

| # | Alt kategori (İngilizce etiket) |
|---|----------------------------------|
| 1 | Cafe |
| 2 | Coffee Shop |
| 3 | Bakery |
| 4 | Patisserie |
| 5 | Dessert Shop |
| 6 | Ice Cream Shop |
| 7 | Breakfast Place |
| 8 | Family Restaurant |
| 9 | Casual Dining |
| 10 | Fine Dining |
| 11 | Steakhouse |
| 12 | Grill House |
| 13 | Kebab Restaurant |
| 14 | Seafood Restaurant |
| 15 | Turkish Cuisine |
| 16 | World Cuisine |
| 17 | Fast Casual |
| 18 | Food Court Concept |
| 19 | Bistro |
| 20 | Brasserie |
| 21 | Lounge |
| 22 | Rooftop Restaurant |
| 23 | Buffet Restaurant |
| 24 | Hotel Restaurant |
| 25 | Catering Kitchen |
| 26 | Dark Kitchen |
| 27 | Franchise Restaurant |
| 28 | Chain Restaurant |

---

## Önerilen yapı (Türkiye pazarı + Equsto premium)

**Tercih edilen gruplama** — UI’da iki seviye: üst → segment → (ileride) motor `konsept` slug.

```
Restaurant & Cafe
├── Cafe & Coffee
├── Bakery & Dessert
├── Breakfast Concepts
├── Casual Dining
├── Premium Dining
├── Steakhouse & Grill
├── Turkish Cuisine
├── Fast Casual
├── Hotel & Hospitality
└── Franchise Concepts
```

### Segment → örnek marka / iş modeli

| Segment | Örnekler (TR) | Not |
|---------|----------------|-----|
| **Cafe & Coffee** | Espressolab, Starbucks, Gloria Jean’s, The House Café (kafe ağırlıklı) | Coffee shop + all-day cafe |
| **Bakery & Dessert** | Simit Sarayı (fırın), Mado, Baylan, Hacı Bekir | Pastane / tatlı / dondurma |
| **Breakfast Concepts** | Sütiş (kahvaltı), Van Kahvaltı Evi | Kahvaltı + servis teşhir |
| **Casual Dining** | Big Chefs, Happy Moon’s, Cookshop | Aile / günlük yemek |
| **Premium Dining** | Fine dining, brasserie, lounge, rooftop | Yüksek CAPex, özel ekipman |
| **Steakhouse & Grill** | Nusr-Et tarzı, mangal / steak | Izgara + dry age |
| **Turkish Cuisine** | Sütiş (tam hat), Köfteci Ramiz, kebap, meyhane | Döner, pide, meze |
| **Fast Casual** | Burger, döner zincir, food court ünite | Hızlı servis, kompakt mutfak |
| **Hotel & Hospitality** | Otel ana mutfak, banket, catering kitchen | Zone katalog + çoklu hat |
| **Franchise Concepts** | Zincir standardı, dark kitchen | Şube varyantları (referans profilleri) |

---

## Mevcut PFOS motor slug’ları → hedef segment (geçici eşleme)

Kodda bugün `Konsept` slug’ları (tek seviye). Yeni taksonomiye **taşınırken** referans:

| Mevcut `konsept` slug | Bugünkü etiket | Önerilen segment |
|----------------------|----------------|------------------|
| `coffee-shop` | Coffee Shop | Cafe & Coffee |
| `all-day-dining-cafe` | All Day Dining Cafe | Cafe & Coffee veya Casual Dining |
| `turk-restoran` | Türk Restoranı | Turkish Cuisine |
| `kebap-ortadogu` | Kebap & Ortadoğu | Turkish Cuisine / Steakhouse & Grill |
| `meyhane` | Meyhane / Mezeli | Turkish Cuisine |
| `pizzaci` | Pizzacı | Casual Dining / Fast Casual |

**Referans projeler (ör.):**

- THC Bakü / AGÜ Kayseri → `all-day-dining-cafe` (200–400 m²)
- S13-388 model → `turk-restoran` + `all-day-dining-cafe` (150–300 m²)
- Espressolab → `coffee-shop`

---

## `/yonetim/pfos` eğitimi — çalışma prensipleri (taslak)

1. **Üst kategori seçimi** → `Restaurant & Cafe` (ileride UI’da görünür grup).
2. **Segment seçimi** → yukarıdaki 10’luk liste (dropdown / kart).
3. **Motor konsepti** → segment altında 1+ `konsept` slug (şablon + referans profilleri).
4. **Referans proforma** → segment başına 1–3 doğrulanmış proje (PDF/xlsx); `public/data/pfos-*-referanslar.json`.
5. **m² bandı** → segment bazlı (ör. coffee 60–300, turk 150–500, hotel ayrı).
6. **Teşhir vitrinleri** → karar bekleyen kalemler `tip: "tavsiye"` (S13-388 örneği); zorunlu yapılmadan teklif üretilebilir.

### Eğitim verisi katmanları

| Katman | İçerik | Dosya / modül |
|--------|--------|----------------|
| Taksonomi | Üst + segment etiketleri | Bu doküman → ileride `pfos-sektor-taksonomisi.json` |
| Konsept şablonu | Zorunlu/tavsiye/opsiyonel kalemler | `lib/pfos/core/rules/*/template.ts` |
| Referans proforma | Gerçek proje satırları | `public/data/pfos-*-referanslar.json` |
| Arşiv zone | xlsx zone satırları | `pfos-referans-projeler.json`, `pfos-zone-proje-kurallari.json` |
| Shop eşleşme | SKU / `urunTipi` | `ekipmanlar.json`, `pfos-tip-shop-links.json` |

---

## API-esnek mimari (ileride dış entegrasyon)

Taksonomi ve teklif akışı **yalnızca UI’ya kilitlenmemeli**; aynı model REST (veya partner) API üzerinden de çalışabilmeli.

### Tasarım ilkeleri

1. **Katmanlı kimlik** — tek `konsept` slug yerine isteğe bağlı hiyerarşi:
   - `ustKategori` (ör. `restaurant-cafe`)
   - `segment` (ör. `turkish-cuisine`)
   - `konsept` (motor slug, örn. `turk-restoran`)
   - `referansId` (ör. `s13-388-turk-220`)  
   API geriye uyumlu kalsın: sadece `konsept` gönderilirse segment otomatik çıkarılsın.

2. **Versiyonlu sözlük** — `pfos-sektor-taksonomisi.json` (veya DB):
   - `version`, `locale`, `segments[]`, `konseptler[]`, `m2Bands`, `referansProfilleri[]`
   - UI ve API aynı dosyayı/endpoint’i okur; hard-code etiket yok.

3. **Genişletilebilir istek gövdesi** — `PFOSRequest` üzerinde:
   - `detaySeviyesi`: `"hizli" | "standart" | "detayli"` (aşağıdaki wizard sorusu)
   - `referansId?`, `segment?`, `ustKategori?`
   - `bolumM2?`, `ozelKalemler?`, `haricTutulanUrunTipleri?` (ileride)
   - Bilinmeyen alanlar `.passthrough()` veya ayrı `extensions` objesi — partner alanları kırmadan.

4. **Ayrı read / write endpoint’leri (hedef)**  
   | Endpoint | Amaç |
   |----------|------|
   | `GET /api/pfos/taxonomy` | Üst kategori + segment + konsept ağacı |
   | `GET /api/pfos/concepts` | Mevcut (genişletilmiş meta: m² bandı, referans listesi) |
   | `GET /api/pfos/referanslar?konsept=&segment=` | Doğrulanmış proforma profilleri |
   | `POST /api/pfos/quote` | Teklif (mevcut; `detaySeviyesi` + `referansId` eklenir) |
   | `POST /api/pfos/quote/preview` | Hızlı önizleme (eksik zorunlu uyarılarıyla) |

5. **Motor çıktısı zengin meta** — yanıtta:
   - `detaySeviyesi`, `kullanilanReferansId`, `eksikZorunlu[]`, `tavsiyeKalemler[]`
   - API tüketicisi “yeterli mi?” kararını sunucu tarafında da verebilsin.

6. **Slug stabilitesi** — segment/konsept ID’leri değişince `aliases: string[]` ile eski API istekleri eşlensin.

### Örnek API istek (hedef)

```json
{
  "ustKategori": "restaurant-cafe",
  "segment": "turkish-cuisine",
  "konsept": "turk-restoran",
  "referansId": "s13-388-turk-220",
  "detaySeviyesi": "hizli",
  "m2": 220,
  "sehir": "istanbul",
  "fiyatStratejisi": "orta"
}
```

`detaySeviyesi: "detayli"` → zone m², teşhir tercihleri, opsiyonel kalemler ve ek soru seti açılır.

---

## Wizard UX — detay seviyesi sorusu (PFOS’ta sorulacak)

Kullanıcıya (veya API partner’ına) **erken aşamada** şu soru sorulacak:

> **“Bu bilgiler yeterli mi, yoksa projeyi senin için detaylandırayım mı?”**

### UI metin önerisi (TR)

| Seçenek | Kısa etiket | `detaySeviyesi` | Davranış |
|---------|-------------|-----------------|----------|
| A | Evet, bu yeterli — hızlı teklif | `hizli` | Segment + m² (+ isteğe bağlı şehir); referans profilden şablon; minimum soru |
| B | Projeyi detaylandır | `detayli` | Zone m², teşhir/opsiyonel tercihler, referans seçimi, eksik zorunlu uyarıları |

İsteğe bağlı orta yol: **“Standart”** (`standart`) — m² + 2–3 segment sorusu (kahvaltı var mı, teşhir hattı, bulaşıkhane kapasitesi).

### Akış (taslak)

```
Konsept / segment seçimi → m²
        ↓
[Detay sorusu]
  “Bu yeterli mi, yoksa detaylandırayım mı?”
        ↓
   hizli ──→ referansId otomatik (m²’ye göre) → quote
   detayli ──→ bölüm m², teşhir toggles, referans listesi → quote
```

### API ile aynı sözleşme

Partner doğrudan `detaySeviyesi` gönderir; UI sorusu atlanır. Yanıtta `onerilenDetaySeviyesi: "detayli"` ve `neden: ["eksik zorunlu: …"]` dönülebilir — client ikinci turda detay isteyebilir.

### Kod notu (henüz uygulanmadı)

- `lib/pfos/schemas/pfos.schema.ts` → `detaySeviyesi`, `referansId`, `segment` alanları
- `PfosProWizard` / `KonseptStep` sonrası yeni adım: `DetaySeviyesiStep`
- `pick*ReferansForM2()` zaten var; `hizli` modda otomatik seçim

---

## Açık kararlar

- [ ] Segment mi yoksa doğrudan 28 alt kategori mi UI’da gösterilecek?
- [ ] `Hotel Restaurant` ayrı üst kategori mi, `Hotel & Hospitality` segment mi?
- [ ] `Bakery` vs `Patisserie` vs `Dessert Shop` tek segment altında mı birleşecek?
- [ ] Teşhir vitrinleri: segment bazlı zorunlu mu, tavsiye mi (S13-388: şimdilik **tavsiye**)?
- [ ] Franchise: ayrı şablon mu, yoksa referans profil varyantı mı (`espressolab-sube-1/2/3` gibi)?
- [ ] Detay sorusu: iki seçenek mi (hızlı / detaylı), üç mü (standart ortada)?
- [ ] `POST /api/pfos/quote/preview` ayrı endpoint mi, `?preview=true` query mi?
- [ ] Taksonomi JSON ilk sürümde repo’da mı, DB’de mi tutulacak?

---

## İlgili dokümanlar

- [PFOS-REFERANS-PROJELER.md](./PFOS-REFERANS-PROJELER.md) — arşiv proje → konsept eşlemesi  
- [PFOS-TEKLIF-SABLONU.md](./PFOS-TEKLIF-SABLONU.md) — teklif / poz yapısı  
- [PFOS-DB-ENTEGRASYON-PLANI.md](./PFOS-DB-ENTEGRASYON-PLANI.md) — DB tarafı
