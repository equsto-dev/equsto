# PFOS ↔ Prisma tek katalog — uygulama planı

**Referanslar:** `schema-product-sketch.prisma` (v0.1), `prisma/schema.prisma`, `docs/PRISMA-PFOS-KATALOG-MERGE.md`, **`docs/KATALOG-URUN-HIYERARSI.md`**  
**Hedef:** PFOS teklif satırları ve e-ticaret aynı `Product.priceListTl` değerini kullanır; kural motoru (`pfos-rules.json`) aynı kalır, **ürün seçimi ve fiyat** DB’den gelir.

### Katalog sütun hiyerarşisi (Haziran 2026)

Equsto kodu → Marka (ad) → Marka kodu → Ürün kodu → Kategori (depth 0) → Alt kategori 1–4+ → Açıklama → Detay → Ölçü (mm) → Fiyat (KDV hariç döviz). Ayrıntı: **`KATALOG-URUN-HIYERARSI.md`**.

---

## PFOS konsept şablonları (repo)

Zip `files (1).zip` → `lib/pfos/core/rules/`:

| Klasör | Konsept |
|--------|---------|
| `coffee-shop/` | Coffee shop |
| `pizzaci/` | Pizzacı |
| `turk-restoran/` | Türk restoranı |
| `meyhane/` | Meyhane |
| `kebap-ortadogu/` | Kebap & Ortadoğu |

Tipler: `lib/pfos/core/engine-types.ts` — dışa aktarım: `lib/pfos/core/index.ts`.

### `/pfos` sayfası (equsto.com/pfos)

Şablonlar **soru formunun kendisini değil**, teklif motorunu tarif eder:

1. Kullanıcı `/pfos` sihirbazında konsept + m² seçer.
2. `EqustoPfosTemplateApi.normKonseptSlug(D.konsept, D.dukkan)` → `pizzaci`, `coffee-shop`, …
3. Eşleşme varsa `POST /api/pfos/calculate` → kalemler + DB fiyat (`priceListTl`).
4. Eşleşme yoksa (Steakhouse, Hotel, Pastane…) eski yol: `pfos-zone-catalog.json` + `pfos-rules.json`.

Dosyalar: `public/pfos-template-api.js`, `buildEkipmanList()` önceliği `public/pfos.html`.

---

## 0. Bugünkü durum (baseline)

| Katman | Kaynak | Not |
|--------|--------|-----|
| Kural motoru | `public/pfos-rule-engine.js` + `/data/pfos-rules.json` | SHORT key üretir: `DAV_B`, `IND_OCAK_6`, `KNV`… |
| Key → vitrin kategori | `public/data/pfos-key-to-kategori.json` | `kategori`: pisirme, sogutma… (legacy PLP) |
| Zone / m² katalog | `public/data/pfos-zone-catalog.json` | `tip_kodu`, `unit_price_try` (statik) |
| Mağaza havuzu | `ekipmanlar.json` / `EqustoShopCatalog` | PFOS fiyat eşleştirme (`findShopMatch`) |
| Referans TRY | `pfos-pricing.js` → `REF_TRY_BY_KOD` | API yoksa yedek |
| DB şeması | `Product.pfos*`, `PfosUrunTipiEslesme`, `PfosTeklifSnapshot` | **Migration uygulandı; veri ve API yok** |
| PFOS API | — | `app/api` altında `pfos` route yok |

**Prensip (sketch ile aynı):** Tek fiyat = `priceListTl` (TRY). EUR liste (`fiyatListe` + `bayiIskonto`) sadece import/TCMB için.

---

## 1. Kavram haritası (üç katman)

```
┌─────────────────────────────────────────────────────────────────┐
│  Katman A — Kural (değişmez, JSON)                               │
│  ctx (konsept, dükkan, alan…) → pfos-rule-engine → SHORT keys   │
│  Örn: KNV, BZDL_600, PIZZA_FIR                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Katman B — Tip sözlüğü (yeni: DB + seed JSON)                   │
│  SHORT key → pfosUrunTipi + PfosKategoriKodu + etiket            │
│  Örn: KNV → combi-firin, B, "Kombi fırın konvektörlü"           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  Katman C — Ürün (Prisma Product)                                │
│  pfosUrunTipi + marka + oncelik → teklif satırı + priceListTl   │
└─────────────────────────────────────────────────────────────────┘
```

**Önemli:** `pfos-rule-engine` SHORT key’leri **silinmez**; sadece Katman B’de `pfosUrunTipi`’ye map edilir. Admin kuralları bozulmaz.

---

## 2. `PfosKategoriKodu` (A–H, X)

| Kod | Anlam (structure.md) | Örnek `pfosUrunTipi` |
|-----|----------------------|----------------------|
| A | Bar & kahve | `espresso-2-grup`, `kahve-degirmeni` |
| B | Sıcak servis / pişirme | `combi-firin`, `ocak-6-gozlu`, `izgara` |
| C | Hazırlık | `spiral-hamur`, `vakum`, `tezgah-2m` |
| D | Pastane | `raflı-firin`, `hamur-acma` |
| E | Soğuk hazırlık | `sogutmali-tezgah` |
| F | Pizza | `pizza-firini`, `pide-firini` |
| G | Depolama | `buzdolabi-600`, `dry-age` |
| H | Bulaşık | `bulasik-tunel`, `bardak-yikama` |
| X | Nakliye & montaj | `nakliye`, `montaj` (teklif OPS satırı) |

`pfosAltKod`: proforma poz no (`B.3`, `G.1`) — Excel çıktısı için; import sonrası elle veya script ile doldurulabilir.

---

## 3. SHORT key → `pfosUrunTipi` (seed tablosu)

Yeni dosya: **`prisma/seed-pfos-tip-sozluk.ts`** (veya `public/data/pfos-short-key-map.json` + tek seferlik import).

Örnek satırlar (`pfos-key-to-kategori.json` + rules DEFAULT ile hizalı):

| SHORT key | pfosUrunTipi | PfosKategoriKodu | Legacy `kategori` |
|-----------|--------------|-------------------|-------------------|
| DAV_B | davlumbaz-buyuk | B | pisirme |
| DAV_K | davlumbaz-kucuk | B | pisirme |
| IND_OCAK_6 | ocak-6-gozlu | B | pisirme |
| IND_OCAK_4 | ocak-4-gozlu | B | pisirme |
| KNV | combi-firin | B | pisirme |
| BZDL_600 | buzdolabi-dik-600 | G | sogutma |
| BZDL_400 | buzdolabi-dik-400 | G | sogutma |
| BULASIK_T | bulasik-tunel | H | yikama |
| ESPRESSO | espresso-2-grup | A | kahve |
| PIZZA_FIR | pizza-firini | F | pisirme |
| … | … | … | … |

`pfos-key-to-kategori.json` içine ileride `pfosUrunTipi` ve `pfosKategoriKodu` alanları eklenebilir (dosyadaki `_not` ile uyumlu).

---

## 4. Milestone’lar

### M1 — Ürün kartlarında PFOS alanları (import)

**Amaç:** `public/data/dept/*.json` ve `ekipmanlar.json` içindeki her SKU için `Product` satırında `pfosUrunTipi` + `pfosKategoriKodu` dolu olsun.

**Script:** `scripts/sync-dept-to-prisma-pfos.mjs`

1. `Brand` upsert (atalay, oztiryakiler, inoksan, …).
2. `Category` upsert (dept slug → category).
3. Her ürün için:
   - `modelCode` / `sku` ← JSON `model` veya `sku`
   - `priceListTl` ← `fiyat_tl` veya EUR×kur (mevcut `lib/tcmb-kur.ts` mantığı)
   - `fiyatListe`, `dovizListe`, `bayiIskonto` ← Öztiryakiler kaynak alanları varsa
   - `pfosUrunTipi` ← eşleme tablosu (aşağıdaki öncelik sırası)
   - `pfosKategoriKodu` ← eşleme tablosundan
   - `pfosAktif` / `ecommerceAktif` ← varsayılan `true`; görsel yoksa `ecommerceAktif=false` opsiyonel
   - `ebat`, `elektrikGucuKw`, `gazGucuKw` ← specs’ten parse
4. `ProductImage` ← `images[]` veya tek `image`

**`pfosUrunTipi` tahmini öncelik:**

1. Elle kürasyon CSV (`data/pfos-urun-tip-map.csv`: `modelCode,pfosUrunTipi,pfosKategoriKodu`)
2. Dept `tip` / `alt_tip` / kategori slug heuristic (`scripts/lib/pfos-tip-heuristic.mjs`)
3. Boş bırak → admin’de doldurulacak listesi (`pfosAktif=false` veya rapor)

**npm:**

```json
"catalog:pfos:sync-products": "node --import ./scripts/load-env.mjs scripts/sync-dept-to-prisma-pfos.mjs",
"db:seed:pfos-tips": "node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs prisma/seed-pfos-tip-sozluk.ts"
```

**Kabul kriteri:** En az Atalay + Öztiryakiler dept’lerinde `pfosAktif=true` ürünlerin ≥%70’inde `pfosUrunTipi` dolu; `priceListTl > 0`.

---

### M2 — `PfosUrunTipiEslesme` (konsept × tip → ürün)

**Amaç:** PFOS bir SHORT key / `pfosUrunTipi` istediğinde hangi `Product` önerilecek.

**Script:** `scripts/seed-pfos-eslesme.mjs`

- Girdi: `PfosUrunTipi` sözlüğü + `Product` where `pfosUrunTipi` + `pfosAktif`
- `konseptSlug`: `*` (genel) veya `restaurant`, `cafe`, `pizzaci`…
- Aynı `(konseptSlug, pfosUrunTipi)` için birden fazla ürün → `oncelik` (fiyat, stok, marka tercihi)
- `zorunlu`: varsayılan teklif setinde mutlaka olsun mu

**Örnek:**

| konseptSlug | pfosUrunTipi | productId | oncelik |
|-------------|--------------|-----------|---------|
| * | combi-firin | …-inoksan-fbe20t | 10 |
| * | combi-firin | …-atalay-… | 5 |
| cafe | espresso-2-grup | … | 10 |

**Kabul kriteri:** `GET /api/pfos/eslesme?konsept=Restaurant&keys=KNV,BZDL_600` her key için ≥1 aday döner (veya açık `missing[]`).

---

### M3 — REST API

Tüm route’lar `app/api/pfos/...` — legacy `pfos.html` fetch ile tüketilir.

#### `GET /api/pfos/catalog`

PFOS mağaza havuzu (bugünkü `ekipmanlar` + fiyat birleşimi).

```ts
// Query: ?pfosOnly=true&brand=atalay
// Response
{
  "version": 1,
  "updatedAt": "ISO",
  "products": [{
    "id": "cuid",
    "sku": "9805-…",
    "slug": "…",
    "brand": "Öztiryakiler",
    "name": "…",
    "priceListTl": 125000,
    "pfosUrunTipi": "buzdolabi-dik-600",
    "pfosKategoriKodu": "G",
    "image": "https://…",
    "equstoPage": "/shop/…"
  }]
}
```

Prisma:

```ts
prisma.product.findMany({
  where: { pfosAktif: true, priceListTl: { gt: 0 }, status: "PUBLISHED" },
  include: { brand: true, images: { where: { isPrimary: true }, take: 1 } },
});
```

#### `GET /api/pfos/resolve`

Kural çıktısı → ürün adayları.

```
GET /api/pfos/resolve?konseptSlug=restaurant&keys=KNV,BZDL_600,DAV_B
```

1. Her SHORT key → `pfos-short-key-map` → `pfosUrunTipi`
2. `PfosUrunTipiEslesme` + fallback `Product` where `pfosUrunTipi`
3. Dönüş: `{ key, pfosUrunTipi, pfosKategoriKodu, candidates: [{ productId, name, priceListTl, oncelik }] }`

#### `GET /api/pfos/fiyat-map`

Bugünkü `PFOS_EQ_FIYATLAR` / zone `tip_kodu` için düz map:

```json
{ "EQ-PIS-001": 780000, "KNV_DEFAULT": 145000 }
```

Üretim: `tip_kodu` (zone catalog) → `pfosUrunTipi` → birincil eşleşmenin `priceListTl`.

#### `POST /api/pfos/teklif-snapshot`

Body: `{ projeRef?, kalemler: [{ productId, sku, priceListTl, qty, … }] }`  
→ `PfosTeklifSnapshot.create` — teklif anı fiyat kilidi.

#### `GET /api/pfos/rules` (opsiyonel, M5)

Admin’de kuralları DB’ye taşıyınca; şimdilik **JSON dosyada kalır**.

**Lib:** `lib/pfos-db.ts` — map, resolve, catalog DTO (`productToPfosDto`).

---

### M4 — `pfos.html` / motor bağlantısı (aşamalı)

| Adım | Değişiklik | Geri dönüş |
|------|------------|------------|
| 4a | `pfosEnsureCatalogPool()` önce `GET /api/pfos/catalog`, fail → `ekipmanlar.json` | Flag: `window.__PFOS_USE_DB_CATALOG__` |
| 4b | `hydrateCatalogPrices` → `GET /api/pfos/fiyat-map` | Eski `REF_TRY_BY_KOD` fallback |
| 4c | Teklif satırı oluştururken `POST /api/pfos/resolve` | Eski `findShopMatch` only |
| 4d | Excel/PDF export öncesi `POST /api/pfos/teklif-snapshot` | Opsiyonel |

**`pfos-rule-engine.js`:** Bu dosyaya dokunulmaz (sadece key listesi). Bridge: `public/pfos-teklif-bridge.js` (yeni) — `evaluateKeys` → `resolve` API.

**`index.html` bridge:** `__PFOS_KEY_KATEGORI__` yerine veya yanında API’den `pfosUrunTipi` ile `eqEngineProposeList` force pick.

---

### M5 — Zone catalog (`pfos-zone-catalog.json`) hizalama

Zone ürünlerindeki `tip_kodu` (ör. `EQ-PIS-001`) → `pfosUrunTipi` map dosyası: `public/data/pfos-eq-kod-map.json`.

Uzun vadede zone `products[]` DB’den üretilir (`scripts/export-pfos-zone-from-db.mjs`); kısa vadede sadece **fiyat** DB’den, geometri JSON’da kalır.

---

### M6 — Admin & operasyon

| İş | UI / araç |
|----|-----------|
| Eksik `pfosUrunTipi` raporu | `scripts/report-pfos-gaps.mjs` → CSV |
| Eşleme düzenleme | Admin Pro: ürün formuna `pfosUrunTipi`, `pfosKategoriKodu`, `pfosAktif` |
| Konsept eşleme | Yeni sayfa: `PfosUrunTipiEslesme` CRUD veya CSV import |
| Marka tipi | `Brand.markaTipi`: Equsto Atölyesi → `OZEL_URETIM` |

---

## 5. Dosya listesi (yeni / değişecek)

| Dosya | Rol |
|-------|-----|
| `docs/PFOS-DB-ENTEGRASYON-PLANI.md` | Bu plan |
| `lib/pfos-db.ts` | Prisma sorguları + DTO |
| `lib/pfos-short-keys.ts` | SHORT → urunTipi map (seed ile aynı kaynak) |
| `app/api/pfos/catalog/route.ts` | M3 |
| `app/api/pfos/resolve/route.ts` | M3 |
| `app/api/pfos/fiyat-map/route.ts` | M3 |
| `app/api/pfos/teklif-snapshot/route.ts` | M3 |
| `scripts/sync-dept-to-prisma-pfos.mjs` | M1 |
| `scripts/seed-pfos-eslesme.mjs` | M2 |
| `prisma/seed-pfos-tip-sozluk.ts` | SHORT key seed |
| `public/data/pfos-short-key-map.json` | Runtime fallback (API yokken) |
| `public/pfos-teklif-bridge.js` | M4 resolve wrapper |

**Güncelleme:** `docs/PRISMA-PFOS-KATALOG-MERGE.md` → bu plana link.

---

## 6. Sıra ve tahmini efor

| # | Milestone | Bağımlılık | Efor |
|---|-----------|------------|------|
| 1 | M1 sync-products | DB migrate + `.env` | 1–2 gün |
| 2 | SHORT key seed (B tablosu) | M1 öncesi veya paralel | 0.5 gün |
| 3 | M2 eslesme seed | M1 | 1 gün |
| 4 | M3 API (catalog + resolve + fiyat-map) | M1–M2 | 1 gün |
| 5 | M4 pfos.html flag’li geçiş | M3 | 1 gün |
| 6 | M5 zone fiyat | M3 | 0.5 gün |
| 7 | M6 admin | M3 | 1–2 gün |

**İlk canlı değer (MVP):** M1 + M3 `catalog` + M4a → PFOS teklif satırları gerçek `priceListTl` ile mağazayla aynı.

---

## 7. Test planı

1. `npm run db:migrate:deploy && npm run db:generate`
2. `npm run catalog:pfos:sync-products` → `db:verify` veya SQL: `SELECT COUNT(*) FROM "Product" WHERE "pfosUrunTipi" IS NOT NULL`
3. `curl /api/pfos/catalog?pfosOnly=true` → JSON ürün sayısı ≈ aktif dept SKU
4. `/pfos` → soru formu → teklif; Network’te `api/pfos/catalog` 200; satır fiyatı = shop PDP aynı model
5. Aynı `modelCode` için `priceListTl` değiştir → PFOS ve `/shop` aynı güncellemeyi gösterir
6. `POST /api/pfos/teklif-snapshot` → DB’de `kalemler` JSON; fiyat sonradan değişse snapshot eski kalır

---

## 8. Açık kararlar (onay)

| # | Soru | Öneri |
|---|------|--------|
| Q1 | `konseptSlug` normalize? | Küçük harf slug: `restaurant`, `pastane-patisserie` |
| Q2 | Eşleşme yoksa ne? | Satır `eksik` + admin raporu; teklif REF_TRY fallback (geçici) |
| Q3 | `status` filtresi | API: yalnızca `PUBLISHED`; PFOS internal draft gösterme |
| Q4 | Legacy JSON ne zaman silinir? | `pfos-catalog.json` boş; 4c sonrası `fiyat-map` API tek kaynak |
| Q5 | `sku` zorunlu mu? | M1 sonrası migration: `sku` NOT NULL (yeni ürünler) |

---

## 9. Hızlı başlangıç (ilk komut seti)

```powershell
cd "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
$env:PRISMA_SKIP_POSTINSTALL_GENERATE="true"
npm run db:generate
npm run db:migrate:deploy

# Planlandıktan sonra (script'ler eklendiğinde):
npm run db:seed:pfos-tips
npm run catalog:pfos:sync-products
npm run dev
# → http://localhost:3000/api/pfos/catalog
# → http://localhost:3000/pfos
```

---

*Son güncelleme: Mayıs 2026 — sketch v0.1 ile repo şeması hizalı.*
