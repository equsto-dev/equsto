# PFOS geri bildirim döngüsü — P0 tasarım

**Durum:** Tasarım (uygulama bekliyor)  
**Hedef:** Teklif geri bildirimini DB’ye kaydetmek, admin onay hattı ile `pfos-referans-sku-links.json` kalıbına otomatik öneri üretmek, motorun zamanla daha doğru eşleşmesini sağlamak.

**İlgili dosyalar (mevcut):**

| Bileşen | Yol |
|---------|-----|
| Thumbs UI (localStorage + GA) | `components/pfos/TeklifV14Proforma.tsx` |
| Kullanım telemetry | `lib/pfos/usage-log.ts`, `PfosUsageEvent` |
| Teklif snapshot | `PfosTeklifSnapshot`, `POST /api/pfos/teklif-snapshot` |
| SKU link tablosu | `public/data/pfos-referans-sku-links.json` |
| Eşleme motoru | `lib/pfos/referans/referans-eslestirme.ts` |
| Manuel düzeltme örneği | `PFOS/veri/proje-veri/iyileştirme.md` |

---

## 1. Problem özeti

Bugün PFOS “öğrenme” verisi üç yerde dağılık ve motora geri dönmüyor:

```
Teklif üretildi → snapshot (opsiyonel) → kullanıcı 👎 → localStorage + GA → kaybolur
Uzman düzeltme → iyileştirme.md → geliştirici elle kural/JSON yazar
```

**P0 hedefi:** Bu döngüyü kapatmak — geri bildirim kalıcı, yapılandırılmış ve admin onaylı SKU link önerisine dönüşür.

---

## 2. Mimari genel bakış

```mermaid
flowchart TB
  subgraph client [Müşteri / teklif ekranı]
    Q[POST /api/pfos/quote]
    S[POST /api/pfos/teklif-snapshot]
    F[POST /api/pfos/feedback]
  end

  subgraph db [Supabase Postgres]
    FE[PfosFeedbackEvent]
    SO[PfosSkuLinkOneri]
    SL[PfosReferansSkuLink]
    SN[PfosTeklifSnapshot]
    UE[PfosUsageEvent]
  end

  subgraph admin [/yonetim/pfos — Eşleşme düzeltmeleri]
    L[Liste: bekleyen geri bildirimler]
    D[Detay: kalem karşılaştırma]
    A[Onay → DB link + motor]
  end

  subgraph motor [lib/pfos/referans/referans-eslestirme.ts]
    M1[1. DB PfosReferansSkuLink]
    M2[2. JSON pfos-referans-sku-links.json]
    M3[3. tip-shop-links + aile kuralları …]
  end

  Q --> S
  S --> SN
  F --> FE
  FE --> L
  L --> D
  D --> SO
  SO -->|onaylandi| SL
  SL --> M1
  M2 --> M1
  M1 --> M3
```

**Temel ilke:** Onaylanmış eşlemeler önce **DB**’de tutulur (anında etkili); periyodik export ile JSON dosyası git’te versiyonlanır.

---

## 3. Prisma şeması

### 3.1 `PfosFeedbackEvent` — ham geri bildirim

```prisma
/// PFOS teklif geri bildirimi (👍/👎 + isteğe bağlı kalem düzeltmesi)
model PfosFeedbackEvent {
  id              String   @id @default(cuid())
  /// up | down
  vote            String
  /// wizard | liste | admin
  source          String   @default("wizard")
  teklifSayi      String   @default("") @map("teklif_sayi")
  snapshotId      String?  @map("snapshot_id")
  snapshot        PfosTeklifSnapshot? @relation(fields: [snapshotId], references: [id], onDelete: SetNull)
  konsept         String   @default("")
  konseptLabel    String   @default("") @map("konsept_label")
  referansId      String?  @map("referans_id")
  referansListeKey String? @map("referans_liste_key")
  m2              Int?
  guvenSkoru      Float?   @map("guven_skoru")
  genelToplamEur  Decimal? @map("genel_toplam_eur") @db.Decimal(14, 4)
  /// Serbest metin (müşteri veya admin)
  yorum           String?  @db.Text
  /// Kalem düzeltmesi: [{ poz, yanlisSku, dogruSku?, sorunTipi?, not }]
  kalemDuzeltmeleri Json?  @map("kalem_duzeltmeleri")
  memberLoggedIn  Boolean  @default(false) @map("member_logged_in")
  memberId        String?  @map("member_id")
  /// pending_review | reviewed | dismissed
  durum           String   @default("pending_review")
  reviewedAt      DateTime? @map("reviewed_at")
  reviewedBy      String?  @map("reviewed_by")
  createdAt       DateTime @default(now()) @map("created_at")

  oneriler        PfosSkuLinkOneri[]

  @@index([vote])
  @@index([durum])
  @@index([teklifSayi])
  @@index([konsept])
  @@index([createdAt])
  @@map("pfos_feedback_event")
}
```

### 3.2 `PfosSkuLinkOneri` — admin onay kuyruğu

```prisma
/// Geri bildirimden veya manuel girişten üretilen SKU link önerisi
model PfosSkuLinkOneri {
  id              String   @id @default(cuid())
  feedbackId      String?  @map("feedback_id")
  feedback          PfosFeedbackEvent? @relation(fields: [feedbackId], references: [id], onDelete: SetNull)
  /// pfos-referans-sku-links anahtarı: {listeKey}|{POZ}
  linkKey         String   @map("link_key")
  listeKey        String   @map("liste_key")
  poz             String
  /// Motorun seçtiği (yanlış kabul edilen)
  eskiSku         String?  @map("eski_sku")
  eskiAd          String?  @map("eski_ad") @db.Text
  /// Önerilen doğru ürün
  yeniSku         String   @map("yeni_sku")
  yeniAd          String?  @map("yeni_ad") @db.Text
  yeniMarka       String?  @map("yeni_marka")
  /// iyileştirme.md kalıbı: yanlis_marka | yanlis_model | yanlis_olcu | yanlis_goz_sayisi | marka_tercihi | genel
  sorunTipi       String   @default("genel") @map("sorun_tipi")
  /// pending | approved | rejected
  durum           String   @default("pending")
  onaylayan       String?  @map("onaylayan")
  onayNotu        String?  @map("onay_notu") @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  resolvedAt      DateTime? @map("resolved_at")

  @@index([durum])
  @@index([linkKey])
  @@index([listeKey, poz])
  @@index([createdAt])
  @@map("pfos_sku_link_oneri")
}
```

### 3.3 `PfosReferansSkuLink` — onaylanmış canlı eşleme (DB katmanı)

```prisma
/// Doğrulanmış referans poz → SKU (DB; JSON’un üzerine yazar)
model PfosReferansSkuLink {
  id        String   @id @default(cuid())
  /// {listeKey}|{POZ} — referans-eslestirme.ts referansLinkKey() ile aynı
  linkKey   String   @unique @map("link_key")
  listeKey  String   @map("liste_key")
  poz       String
  sku       String
  name      String?  @db.Text
  marka     String?
  /// feedback | manual | import_json | script
  kaynak    String   @default("feedback")
  oneriId   String?  @map("oneri_id")
  onaylayan String?  @map("onaylayan")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([listeKey])
  @@map("pfos_referans_sku_link")
}
```

### 3.4 `PfosFiyatKurali` — fiyat hesabı kuralları (karar: ayrı tablo)

Bazı hatalar **yanlış SKU** değil, **yanlış fiyat**dır: doğru ürün seçilmiş ama fiyat başka bir katalog satırından veya çarpanla türetilmeli. SKU link tablosu bunu çözmez.

**Örnek (EQS-2026-650, G14):** Referansta “TAVA RAFI” var; motor duvar rafı SKU’sunu buluyor (`duvar-raf-match.ts`) ama fiyat **normal duvar rafının 4 katı** olmalı — katalogda ayrı “tava rafı” satırı yok.

```prisma
/// PFOS fiyat türetme kuralı (ürün doğru, fiyat formülü özel)
model PfosFiyatKurali {
  id            String   @id @default(cuid())
  /// global | konsept | liste_key — kapsam
  kapsam        String   @default("global")
  konseptSlug   String?  @map("konsept_slug")
  listeKey      String?  @map("liste_key")
  poz           String?
  urunTipi      String?  @map("urun_tipi")
  /// Referans isim regex veya alt string (ör. tava raf)
  isimKalibi    String?  @map("isim_kalibi")
  /// carp | sabit_sku | sabit_fiyat_eur
  kuralTipi     String   @map("kural_tipi")
  /// carp: 4.0 — baz fiyat × çarpan
  carpan        Float?
  /// sabit_sku: fiyat kaynağı SKU (ör. 7897.10030.30 duvar rafı)
  bazSku        String?  @map("baz_sku")
  sabitFiyatEur Decimal? @map("sabit_fiyat_eur") @db.Decimal(14, 4)
  aciklama      String?  @db.Text
  kaynak        String   @default("feedback")
  onaylayan     String?  @map("onaylayan")
  aktif         Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([kapsam, konseptSlug])
  @@index([listeKey, poz])
  @@index([urunTipi])
  @@index([aktif])
  @@map("pfos_fiyat_kurali")
}
```

**Motor entegrasyonu:** `matchDuvarRafiByReferans` içindeki sabit `× 4` kodu → `applyPfosFiyatKurallari(eslesmis, context)` ile DB kurallarından okunur. Kural yoksa mevcut hard-coded davranış fallback.

**Geri bildirim akışı:** `sorunTipi=fiyat_kurali` olan öneri onaylandığında `PfosFiyatKurali` insert; SKU link oluşturulmaz.

### 3.5 `PfosTeklifSnapshot` genişletmesi (P0)

Mevcut snapshot yalnızca `projeRef` + `kalemler` tutuyor. Geri bildirim bağlamı için quote meta eklenmeli:

```prisma
model PfosTeklifSnapshot {
  id               String   @id @default(cuid())
  projeRef         String?
  kalemler         Json
  /// P0 — quote anı meta
  konsept          String?
  referansId       String?  @map("referans_id")
  referansListeKey String?  @map("referans_liste_key")
  m2               Int?
  guvenSkoru       Float?   @map("guven_skoru")
  requestJson      Json?    @map("request_json")
  createdAt        DateTime @default(now())

  feedbackEvents   PfosFeedbackEvent[]

  @@index([projeRef])
  @@index([createdAt])
}
```

### 3.6 `PfosUsageEvent` ilişkisi

Yeni event türü eklenmez; `PfosFeedbackEvent` ayrı tablo. İsteğe bağlı: admin panelinde `teklifSayi` ile `PfosUsageEvent` join (dönüşüm + memnuniyet birlikte görünür).

---

## 4. Eşleme katmanı günlüğü (motor değişikliği)

`referans-eslestirme.ts` çıktısına **geçici olmayan** meta eklenir; feedback ve öneri üretiminde kullanılır.

### 4.1 Yeni tip

```typescript
// lib/pfos/schemas/pfos.schema.ts
export const EslesmeKatmaniEnum = z.enum([
  "verified_db",      // PfosReferansSkuLink
  "verified_json",    // pfos-referans-sku-links.json
  "tip_shop_link",    // pfos-tip-shop-links.json
  "aile_kurali",      // yer izgarası, make-up, fırın …
  "katalog_arama",    // isim + ölçü arama
  "ozel_imalat",      // tezgah/davlumbaz yakın ölçü
  "eslesmedi",
]);
```

`PFOSKalemi` şemasına ekle:

```typescript
eslesmeKatmani: EslesmeKatmaniEnum.optional(),
eslesmeLinkKey: z.string().optional(), // örn. s13-388-turk-220|G7
```

### 4.2 Motor öncelik sırası (güncellenmiş)

```
1) PfosReferansSkuLink (DB)          ← YENİ
2) pfos-referans-sku-links.json
3) pfos-tip-shop-links.json
4) Aile kuralları
5) Katalog araması
6) Özel imalat
```

`loadReferansSkuLinks()` → `mergeDbAndJsonLinks()`: DB kayıtları JSON ile birleştirilir, **aynı linkKey için DB kazanır**.

---

## 5. API uç noktaları

### 5.1 `POST /api/pfos/feedback` — herkese açık (anonim)

Mevcut `POST /api/pfos/usage` ile aynı güven modeli: rate limit + dedup.

**Request body:**

```json
{
  "vote": "down",
  "source": "wizard",
  "teklifSayi": "EQS-2026-650",
  "snapshotId": "clx…",
  "konsept": "turk-restoran",
  "konseptLabel": "Türk Restoranı",
  "referansId": "s13-388-turk-220",
  "referansListeKey": "s13-388-turk-220",
  "m2": 220,
  "guvenSkoru": 0.72,
  "genelToplamEur": 184500.5,
  "yorum": "G7 ocak yanlış",
  "kalemDuzeltmeleri": [
    {
      "poz": "G7",
      "referansIsim": "2 AÇIK ALEVLİ OCAK",
      "yanlisSku": "7919.XXXX",
      "yanlisAd": "4 gözlü ocak …",
      "sorunTipi": "yanlis_goz_sayisi",
      "not": "Listede 2 gözlü"
    }
  ],
  "memberLoggedIn": false
}
```

**Davranış:**

1. `vote` zorunlu: `up` | `down`
2. `teklifSayi` + `vote` için 24 saat dedup (aynı teklif tekrar 👎 gönderilemez)
3. `vote === "down"` ve `kalemDuzeltmeleri` doluysa → her kalem için `PfosSkuLinkOneri` **taslak** oluştur (`durum: pending`, `yeniSku` boşsa admin doldurur)
4. `vote === "down"` ve sadece genel geri bildirim → `PfosFeedbackEvent` kaydı, admin kuyruğuna düşer
5. `vote === "up"` → yalnızca `PfosFeedbackEvent`; SKU önerisi üretilmez

**Response:**

```json
{
  "success": true,
  "data": {
    "feedbackId": "clx…",
    "oneriSayisi": 1,
    "deduped": false
  }
}
```

**Lib:** `lib/pfos/feedback-log.ts` (usage-log.ts kalıbında)

### 5.2 `GET /api/pfos/feedback` — admin (Bearer)

Query: `?durum=pending_review&vote=down&days=30&limit=100`

Response: feedback listesi + ilişkili öneri sayısı + snapshot özeti.

### 5.3 `GET /api/pfos/feedback/[id]` — admin

Tam detay: snapshot kalemleri, motor eşleme meta, bekleyen öneriler.

### 5.4 `PATCH /api/pfos/feedback/[id]` — admin

```json
{ "durum": "reviewed", "reviewedBy": "admin@equsto.com" }
```

veya `dismissed` (spam / geçersiz).

### 5.5 `GET /api/pfos/sku-link-oneri` — admin kuyruk

Query: `?durum=pending&listeKey=s13-388-turk-220`

### 5.6 `POST /api/pfos/sku-link-oneri` — manuel öneri (admin)

`iyileştirme.md` satırlarını elle girmek için:

```json
{
  "listeKey": "s13-388-turk-220",
  "poz": "I12",
  "yeniSku": "9805.CB425.HC",
  "sorunTipi": "marka_tercihi",
  "onayNotu": "Brema her zaman — iyileştirme.md"
}
```

### 5.7 `POST /api/pfos/sku-link-oneri/[id]/onayla` — admin

**İşlem (transaction):**

1. `PfosSkuLinkOneri.durum` → `approved`
2. `PfosReferansSkuLink.upsert` — `linkKey` ile
3. İlgili `PfosFeedbackEvent.durum` → `reviewed` (tüm öneriler çözüldüyse)
4. Audit log (opsiyonel): `onaylayan`, `resolvedAt`

**Response:** güncel link + motor test sonucu (opsiyonel dry-run).

### 5.8 `POST /api/pfos/sku-link-oneri/[id]/reddet` — admin

`durum: rejected`, `onayNotu` zorunlu.

### 5.9 `POST /api/pfos/referans-sku-links/export` — admin (bakım)

DB’deki onaylı linkleri `public/data/pfos-referans-sku-links.json` formatına export (git commit için). **Canlıda otomatik yazma yok** — admin tetikler veya haftalık cron.

### 5.10 `POST /api/pfos/teklif-snapshot` — genişletme

Mevcut endpoint’e meta alanları eklenir:

```json
{
  "projeRef": "EQS-2026-650",
  "konsept": "turk-restoran",
  "referansId": "s13-388-turk-220",
  "referansListeKey": "s13-388-turk-220",
  "m2": 220,
  "guvenSkoru": 0.72,
  "requestJson": { "konsept": "turk-restoran", "m2": 220 },
  "kalemler": [
    {
      "poz": "G7",
      "isim": "2 AÇIK ALEVLİ OCAK",
      "urunTipi": "acik_alevli_ocak",
      "sku": "7919.…",
      "ad": "…",
      "marka": "Öztiryakiler",
      "eslesmeKatmani": "aile_kurali",
      "eslesmeLinkKey": "s13-388-turk-220|G7"
    }
  ]
}
```

---

## 6. İstemci değişiklikleri

### 6.1 `TeklifV14Proforma.tsx`

| Adım | Değişiklik |
|------|------------|
| Quote render sonrası | `POST /api/pfos/teklif-snapshot` (zengin kalemler + meta) |
| `snapshotId` state | Feedback isteğine eklenir |
| `submitTeklifFeedback` | localStorage + GA **korunur**; ek olarak `POST /api/pfos/feedback` |
| 👎 genişletme (**P0**) | “Hangi satır yanlış?” — en fazla 3 poz seçimi + opsiyonel yorum; seçilen pozlar `kalemDuzeltmeleri` olarak API’ye gider |

**Yeni client modül:** `lib/pfos/log-pfos-feedback.client.ts` (`log-pfos-usage.client.ts` ile aynı kalıp)

### 6.2 Snapshot kalemleri

`map-pfos-response.ts` çıktısından her satıra eklenecek alanlar:

- `referansListeKey` (motor context’ten)
- `eslesmeKatmani`
- `eslesmeLinkKey`
- `urunTipi`

Böylece admin panelinde “motor ne seçti?” sorusu snapshot’tan cevaplanır.

---

## 7. Admin paneli — `/yonetim/pfos`

Yeni sekme: **「Eşleşme düzeltmeleri」** (`PfosEslesmeFeedbackPanel.tsx`)

Panel üç alt sekme içerir (karar: hepsi aynı sekme altında):

| Alt sekme | Veri kaynağı | Onay sonucu |
|-----------|--------------|-------------|
| **Geri bildirimler** | `PfosFeedbackEvent` + `PfosSkuLinkOneri` | `PfosReferansSkuLink` |
| **Tip eşlemeleri** | `PfosUrunTipiEslesme` + öneri kuyruğu | DB `PfosUrunTipiEslesme` güncelleme |
| **Fiyat kuralları** | `PfosFiyatKurali` + öneri kuyruğu | Motor fiyat hesabı (SKU değil) |

### 7.1 Üst özet kartları

| Kart | Kaynak |
|------|--------|
| Bekleyen 👎 | `PfosFeedbackEvent` where `durum=pending_review` |
| Bekleyen SKU önerisi | `PfosSkuLinkOneri` where `durum=pending` |
| Bu ay onaylanan link | `PfosReferansSkuLink` count |
| En çok hata — konsept | GROUP BY `konsept` |
| En çok hata — poz | GROUP BY `linkKey` |

### 7.2 Ana tablo (ProTable)

Kolonlar: tarih, teklif no, konsept, m², güven, vote, bekleyen öneri, durum, işlem.

Filtreler: vote, durum, konsept, son 7/30/90 gün.

### 7.3 Detay drawer

```
┌─────────────────────────────────────────────────────────┐
│ EQS-2026-650 · Türk Restoranı · 220 m² · güven %72     │
├─────────────────────────────────────────────────────────┤
│ POZ │ Referans isim      │ Seçilen ürün    │ Katman    │
│ G7  │ 2 AÇIK ALEVLİ OCAK │ 4 gözlü Öztir…  │ aile_kurali│
│ I12 │ BUZ MAKİNESİ       │ …               │ verified_json│
├─────────────────────────────────────────────────────────┤
│ [Katalogda ara] → SKU seç → Öneri oluştur               │
│ Sorun tipi: [yanlis_goz_sayisi ▼]                       │
│ [Öneriyi kaydet]  [Tümünü onayla]  [Reddet / kapat]     │
└─────────────────────────────────────────────────────────┘
```

**Katalog arama:** mevcut `GET /api/pfos/catalog` veya admin ürün araması.

### 7.4 Hızlı işlemler

- **Toplu onay:** Aynı `sorunTipi=marka_tercihi` + aynı `yeniSku` olan önerileri tek tıkla onayla (ör. tüm I12 → Brema)
- **Tip eşlemesi düzenle:** `konseptSlug` + `pfosUrunTipi` → katalog ürünü ata (`PfosUrunTipiEslesme` CRUD)
- **Fiyat kuralı düzenle:** poz / `urunTipi` / isim kalıbı → çarpan veya sabit fiyat kaynağı (bkz. §9.1)
- **iyileştirme.md import:** Metin dosyası parse → toplu `PfosSkuLinkOneri` veya `PfosFiyatKurali` önerisi (bkz. §8)

### 7.5 Deploy’da otomatik JSON export (karar: evet)

Onaylanmış `PfosReferansSkuLink` kayıtları canlıda DB’de kalır; **her deploy öncesi** dosyaya yazılır ki git geçmişi ve JSON fallback güncel kalsın.

**Tetikleyici:** `scripts/hetzner-deploy.sh` içinde, `docker compose build` öncesi:

```bash
npm run pfos:referans-sku-links:export
# → public/data/pfos-referans-sku-links.json (DB merge, version bump)
```

**Script davranışı:**

1. DB’den tüm `PfosReferansSkuLink` oku
2. Mevcut JSON `links` ile birleştir (**DB kazanır**)
3. Dosyayı atomik yaz (`*.tmp` → rename)
4. CI’da export dry-run diff kontrolü (opsiyonel)

Manuel “Export” butonu admin panelde de kalır (deploy beklemeden test için).

### 7.6 `page.tsx` sekmesi

```typescript
{
  key: "eslesme",
  label: <span><BugOutlined /> Eşleşme düzeltmeleri</span>,
  children: <PfosEslesmeFeedbackPanel />,
}
```

---

## 8. `iyileştirme.md` → otomatik öneri (import script)

Manuel liste formatı korunur; script ile DB’ye aktarılır.

**Script:** `scripts/import-pfos-iyilestirme-oneri.mjs`

**Parse kuralları (örnek):**

| Metin kalıbı | `sorunTipi` | Aksiyon |
|--------------|-------------|---------|
| `X MARKA KULLANALIM - HER ZAMAN` | `marka_tercihi` | poz + marka → katalogdan SKU bul |
| `YANLIŞ ÜRÜN` | `yanlis_model` | admin SKU tamamlar |
| `N'LÜ MODELİ KOYMUŞSUN` (G7) | `yanlis_goz_sayisi` | poz + göz sayısı hint |
| `FİYATINI N İLE ÇARP` | `fiyat_kurali` | motor kuralı (SKU link değil) — ayrı kuyruk |

**CLI:**

```bash
npm run pfos:iyilestirme:import -- \
  --file PFOS/veri/proje-veri/iyileştirme.md \
  --liste-key s13-388-turk-220 \
  --teklif EQS-2026-650 \
  --dry-run
```

Çıktı: `PfosSkuLinkOneri` kayıtları `durum=pending`, `feedbackId=null`, `onayNotu` = kaynak satır.

---

## 9. Sorun tipi sözlüğü

`iyileştirme.md` ve otomatik sınıflandırma için sabit enum:

```typescript
export const PFOS_SORUN_TIPLERI = [
  "marka_tercihi",       // D2 EQUSTO, I12 Brema
  "yanlis_marka",        // E7 Portabianco yerine başkası
  "yanlis_model",        // çekmeceli vs raflı dolap
  "yanlis_olcu",         // ölçü uyuşmazlığı
  "yanlis_goz_sayisi",   // 2 gözlü vs 4 gözlü ocak
  "yanlis_kapasite",     // filtre kahve LT uyumsuzluğu
  "eksik_urun",          // katalogda yok
  "fiyat_kurali",        // G14 ×4 kuralı
  "genel",
] as const;
```

Bazı tipler SKU link ile çözülmez (`fiyat_kurali` → `PfosFiyatKurali`; bkz. §9.1). Admin panelinde tip seçilince uygun alt sekme ve aksiyon gösterilir.

### 9.1 `fiyat_kurali` nedir? (kısa)

**SKU link:** “Bu poz için **hangi ürün** seçilsin?” (ör. I12 → Brema CB425)

**Fiyat kuralı:** “Doğru ürün bulundu ama **fiyat nasıl hesaplansın**?” — katalogda birebir satır yok veya fiyat türetilmiş.

| Örnek | Sorun | Kural |
|-------|-------|-------|
| G14 TAVA RAFI | Duvar rafı SKU’su doğru, fiyat 1 birim | Baz duvar rafı fiyatı **× 4** |
| Salamander rafı | Katalogda yok | 60×60 raf, fiyat **100×30 duvar rafı** SKU’sundan |
| Özel imalat tezgah | Ölçü katalogda yok | En yakın ölçü + **ölçek çarpanı** |

Bu kurallar bugün `duvar-raf-match.ts`, `ozel-imalat-build.ts` gibi dosyalarda **sabit kod**. `PfosFiyatKurali` tablosu bunları DB’ye taşır; geri bildirimden onaylanınca koda deploy gerekmeden güncellenir.

**SKU link vs fiyat kuralı ayrımı (admin UI):**

- Yanlış marka/model → SKU önerisi sekmesi
- Doğru ürün, yanlış fiyat → Fiyat kuralları sekmesi

---

## 10. Güvenlik ve operasyon

| Konu | Karar |
|------|--------|
| Anonim feedback | İzin ver; `memberId` opsiyonel |
| Rate limit | IP başına 10 feedback / saat |
| Dedup | `teklifSayi` + `vote` 24h |
| Admin API | `assertAdminBearer` (usage GET ile aynı) |
| PII | `yorum` alanında kişisel veri uyarısı; log retention 365 gün |
| Onay yetkisi | Bearer token = yönetim kullanıcısı (ileride rol ayrımı) |

---

## 11. Uygulama fazları

### Faz A — Veri katmanı (1 PR) ✅

- [x] Prisma modelleri (`PfosFeedbackEvent`, `PfosSkuLinkOneri`, `PfosReferansSkuLink`, `PfosFiyatKurali`) + migration
- [x] `lib/pfos/feedback-log.ts`, `feedback-types.ts`
- [x] `POST/GET /api/pfos/feedback`, `GET/PATCH …/[id]`
- [x] `PfosReferansSkuLink` CRUD + `mergeDbAndJsonLinks()` + motor entegrasyonu
- [x] `GET/POST /api/pfos/referans-sku-links`

### Faz B — Motor + snapshot (1 PR) ✅

- [x] `eslesmeKatmani` / `eslesmeLinkKey` motor çıktısı (`matchReferansKalemWithMeta`)
- [x] `teklif-snapshot` meta genişletmesi (API + `pfosCreateTeklifSnapshot`)
- [x] `referans-eslestirme.ts` verified_db / verified_json ayrımı
- [x] `PfosFiyatKurali` motor entegrasyonu + tava rafı seed + legacy fallback

### Faz C — İstemci (1 PR) ✅

- [x] Snapshot otomatik kayıt (meta dahil) — `log-pfos-snapshot.client.ts`
- [x] `log-pfos-feedback.client.ts`
- [x] `TeklifV14Proforma.tsx` API entegrasyonu
- [x] 👎 sonrası poz seçici UI (en fazla 3 kalem + yorum) — **P0**

### Faz D — Admin panel (1 PR) ✅

- [x] `PfosEslesmeFeedbackPanel.tsx` (3 alt sekme: geri bildirim, tip eşlemesi, fiyat kuralı)
- [x] SKU öneri + `PfosUrunTipiEslesme` + `PfosFiyatKurali` onay/red API
- [x] `/yonetim/pfos` yeni sekme

### Faz E — Import, export & deploy (1 PR)

- [ ] `import-pfos-iyilestirme-oneri.mjs`
- [ ] `pfos:referans-sku-links:export` script
- [ ] `hetzner-deploy.sh` → deploy öncesi otomatik JSON export
- [ ] Mevcut `iyileştirme.md` satırlarının import’u (EQS-2026-650)

### Faz F — P0.1 (sonraki sprint)

- [ ] Düşük güven + 👎 öncelik skoru admin sıralamasında
- [ ] `IsletmePfosUsagePanel` ile birleşik görünüm (dönüşüm + memnuniyet)
- [ ] CI export diff kontrolü

---

## 12. Test planı

| Test | Beklenti |
|------|----------|
| `npm run pfos:motor:test` | DB link varken JSON’u override eder |
| Feedback dedup | Aynı teklif 2. 👎 → 200 deduped |
| Onay akışı | Onay sonrası aynı `linkKey` ile quote → yeni SKU |
| Export | DB → JSON dosyası mevcut şema ile uyumlu |
| Geri dönüş | DB boşken motor davranışı değişmez (JSON only) |

**Fixture:** EQS-2026-650 / G7 / I12 senaryoları `iyileştirme.md`’den.

---

## 13. Başarı metrikleri (30 gün sonra)

| Metrik | Hedef |
|--------|--------|
| 👎 geri bildirimlerin DB’ye düşme oranı | > %95 (localStorage yerine) |
| Admin inceleme süresi (median) | < 48 saat |
| Onaylanan link → tekrar 👎 aynı poz | < %10 |
| `verified_db` katmanı kullanım oranı | Artış (yeni onaylar) |
| Manuel `iyileştirme.md` satır sayısı | Azalma |

---

## 14. Kararlar (2026-06-29 — onaylandı)

| # | Soru | Karar |
|---|------|--------|
| 1 | 👎 sonrası poz seçimi | **P0** — en fazla 3 kalem + yorum |
| 2 | Onaylı linkler JSON export | **Evet** — `hetzner-deploy.sh` öncesi otomatik |
| 3 | `PfosUrunTipiEslesme` paneli | **Evet** — aynı sekme, “Tip eşlemeleri” alt sekmesi |
| 4 | `fiyat_kurali` tablosu | **Evet** — `PfosFiyatKurali` (bkz. §9.1) |

---

## 15. Dosya listesi (yeni / değişecek)

| Dosya | Aksiyon |
|-------|---------|
| `prisma/schema.prisma` | 4 model + snapshot alanları |
| `lib/pfos/fiyat-kurali.ts` | Kural uygulama + DB load |
| `lib/pfos/referans/duvar-raf-match.ts` | Hard-coded ×4 → `PfosFiyatKurali` |
| `scripts/hetzner-deploy.sh` | Deploy öncesi `pfos:referans-sku-links:export` |
| `lib/pfos/feedback-log.ts` | Yeni |
| `lib/pfos/referans/sku-link-db.ts` | DB load/merge/upsert |
| `lib/pfos/referans/referans-eslestirme.ts` | DB önceliği + katman meta |
| `lib/pfos/schemas/pfos.schema.ts` | `eslesmeKatmani`, sorun tipleri |
| `app/api/pfos/feedback/route.ts` | Yeni |
| `app/api/pfos/feedback/[id]/route.ts` | Yeni |
| `app/api/pfos/sku-link-oneri/...` | Yeni |
| `components/pfos/pro/PfosEslesmeFeedbackPanel.tsx` | Yeni |
| `components/pfos/TeklifV14Proforma.tsx` | Snapshot + feedback API |
| `lib/pfos/log-pfos-feedback.client.ts` | Yeni |
| `scripts/import-pfos-iyilestirme-oneri.mjs` | Yeni |
| `scripts/export-pfos-referans-sku-links.mjs` | Yeni |

---

*Son güncelleme: 2026-06-29 — P0 tasarım, uygulama Faz A ile başlanacak.*
