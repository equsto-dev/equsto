# Master katalog zinciri — nasıl yapılır?



## Ana besleyici (canonical upstream)



**`PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx`** — tüm EQ- kodları, kategori yolları ve PFOS eşlemesi bu dosyadan türetilir.



Yol sabiti: `scripts/catalog-master-paths.mjs` ve `lib/catalog/master-catalog.ts`



```

ÜRÜN KATEGORİZASYONU-DOLU.xlsx  (ana besleyici)

    ↓ ① import-xlsx

equsto-katalog-master.json

    ↓ ② apply

ekipmanlar.json + dept/*.json  (EQ- kodları canlı katalog)

    ↓ ③ search:index

Meilisearch (equsto_kod, kategori_yolu)

    ↓ ④ PFOS parse / referans / sihirbaz

Müşteri listesi → EQ- kod → tek ürün satırı

    ↓ ⑤ (opsiyonel) prisma

Supabase Product

```



**Ters yön** (`catalog:kategorizasyon:export`): yalnızca ilk doldurma — ekipmanlar → Excel. Üretim akışında düzenleme her zaman DOLU.xlsx üzerinde yapılır, ardından `import-xlsx`.



---



## Tek komut — tam senkron



Excel'de değişiklik yaptıysanız:



```bash

cd E-TICARET/site

npm run catalog:master:sync

```



Supabase dahil tam zincir:



```bash

npm run catalog:master:sync:full

```



(`import-xlsx` → `apply` → `search:index` [→ `prisma`])



---



## Adım ① — Excel'i master JSON'a al



```bash

npm run catalog:master:import-xlsx

```



Özel dosya yolu:



```bash

npm run catalog:master:import-xlsx -- "C:\D Disk\EQUSTO-WORK\PFOS\ÜRÜN KATEGORİZASYONU-DOLU.xlsx"

```



Çıktı: `public/data/equsto-katalog-master.json`



---



## Adım ② — Canlı kataloğa yaz (EQ- kodları)



```bash

npm run catalog:master:apply

```



Ne yapar:



- `ekipmanlar.json` içindeki her ürüne `equsto_kod`, `marka_kodu`, `kategori_yolu` ekler

- Aynı alanları `public/data/dept/*.json` dosyalarına da yazar (rebuild sonrası kaybolmasın diye)

- Yedek: `ekipmanlar.json.backup-master-*.json`



---



## Adım ③ — Meilisearch'i güncelle



```bash

npm run catalog:master:publish

```



(`apply` + `search:index` tek komut)



Meilisearch'te yeni alanlar:



| Alan | Örnek |

|------|--------|

| `equsto_kod` | `EQ-ATALAY.ADR-10E` |

| `marka_kodu` | `ATALAY` |

| `marka_urun_kodu` | `ADR-10E` |

| `kategori_yolu` | `["Pişirme","Adr Seri Döner Robotu",…]` |



Gerekli: `.env.local` içinde `MEILISEARCH_HOST` + `MEILISEARCH_MASTER_KEY`



---



## Adım ④ — PFOS eşlemesi (otomatik)



EQ- kodu önceliği (master tablo → canlı katalog → master JSON yedek):



1. **Liste upload** (`meili-kalem-eslestir`): tanımda `EQ-…`, parantez stok kodu, marka+SKU

2. **Referans / sihirbaz** (`referans-eslestirme`, `catalog-fallback`): doğrulanmış linklerden sonra EQ- araması

3. Bulunursa master satırı (skor ~0.97)

4. Bulunamazsa aile kuralları + isim araması (yedek)



Test: `http://localhost:3099/pfos` → PDF/Excel yükle → teklif satırlarında doğru ürün.



---



## Adım ⑤ — Supabase (opsiyonel, admin API)



Migration uygulandıktan sonra:



```bash

npm run db:migrate:deploy

npm run catalog:master:prisma

```



Admin `/api/urunler` ve gelecekteki DB-first PFOS bu tabloyu kullanır.



---



## Yeni ürün eklendiğinde



1. **DOLU.xlsx**'e satır ekle (EQ- kodu + kategori sütunları)

2. `npm run catalog:master:sync`

3. (İsteğe bağlı) `npm run catalog:master:prisma`



Marka PDF'ini **tekrar import etmenize gerek yok** — sadece master tabloya satır.



---



## Sık komutlar



| Komut | Ne zaman |

|-------|----------|

| `catalog:master:sync` | DOLU.xlsx düzenlendi → canlı katalog + Meili |

| `catalog:master:sync:full` | Yukarı + Supabase |

| `catalog:kategorizasyon:export` | İlk doldurma (ekipmanlar → Excel, ters yön) |

| `catalog:master:import-xlsx` | Excel → master JSON |

| `catalog:master:apply` | JSON → canlı katalog |

| `catalog:master:publish` | apply + Meilisearch |

| `catalog:master:prisma` | Supabase senkron |



---



## Henüz yapılmayan (Faz 2)



- Excel liste-fiyat (`/api/pfos/liste-fiyat`) tam EQ- eşlemesi

- PFOS kural motoru → `pfosUrunTipi` master kategori ağacına bağlama

- Vitrin PLP'de Equsto kodu gösterimi

