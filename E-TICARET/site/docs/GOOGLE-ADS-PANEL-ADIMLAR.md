# Google Ads panel — nasıl yapılır (2.000 TL / Equsto)

**Hesap:** `416-696-9695` · **Giriş:** [ads.google.com](https://ads.google.com) (`jurnaldang@gmail.com`)  
**Bütçe:** 2.000 TL/ay ≈ 65 TL/gün · **Landing (birincil): `https://equsto.com/shop/pisirme`** · PFOS sonra  
**Plan:** [`GOOGLE-ADS-KISITLI-BUTCE-PLANI.md`](./GOOGLE-ADS-KISITLI-BUTCE-PLANI.md)  
**Ölçüm önkoşul:** [`GOOGLE-ADS-BASLANGIC.md`](./GOOGLE-ADS-BASLANGIC.md)

Menü isimleri Türkçe arayüze göre; İngilizce görürsen köşeli parantezdeki karşılığa bak.

**Sıra sabit:** A → B → C → D → E. Reklamı **E bitmeden** açma.

---

## A) Hesaba gir ve faturalandırmayı kilitle

1. [ads.google.com](https://ads.google.com) → hesap **416-696-9695** seçili olsun.  
2. Sağ üst **Araçlar ve ayarlar** (dişli / Tools) → **Faturalandırma** → **Ayarlar**.  
3. Ödeme yöntemi ekle (kart).  
4. **Hesap bütçesi / aylık harcama limiti** varsa → **2.000 TL**.  
   - Yoksa: kampanya günlük 65 TL yeter; yine de her hafta harcamaya bak.  
5. Para yükle / fatura aç — ama kampanyayı henüz **etkinleştirme**.

---

## B) GA4’ü Ads’e bağla

1. Ads’de **Araçlar ve ayarlar** → **Bağlı hesaplar** (Linked accounts).  
2. **Google Analytics (GA4)** → **Ayrıntılar** → **Bağla**.  
3. Mülk: Equsto / `G-MVRNFQC4PQ` → bağla + (varsa) otomatik etiketlemeyi aç.  
4. GA4 tarafında da onay: [analytics.google.com](https://analytics.google.com) → **Yönetici** → **Ürün bağlantıları** → **Google Ads bağlantıları** → aynı hesap bağlı mı kontrol.

---

## C) Dönüşümü tanımla (para harcamadan)

Hedef (shop-first): mağaza trafiği → **iletişim / sepet-sipariş**. Birincil event: `equsto_lead` (+ `equsto_order` aktif olunca). `equsto_quote` (PFOS) **ikincil**.

### Tercih 1 — GA4 event’i içe aktar (kolay)

1. Ads → **Hedefler** → **Dönüşümler** → **Özet** → **+ Yeni dönüşüm işlemi**.  
2. **İçe aktar** → **GA4 özelliklerinden**.  
3. `quote` (veya PFOS teklif event adın neyse) seç → **İçe aktar**.  
4. Ayarlar:
   - **Kategori:** Gönderim / Lead  
   - **Değer:** Don‘t use a value (veya sabit değer yok)  
   - **Sayım:** Bir (One) — aynı tıklamada bir kez  
   - **Birincil işlem:** Evet (kampanya optimize buna baksın)  
5. İstersen `lead` (iletişim) için ikinci işlem → **Birincil değil** (ikincil).

### Tercih 2 — Google Ads etiketi (site env ile)

GA4 import çalışmazsa:

1. **+ Yeni dönüşüm** → **Web sitesi** → domain `equsto.com`.  
2. Dönüşüm adı: `Equsto PFOS Teklif`.  
3. Google sana **Dönüşüm kimliği** (`AW-…`) ve **Etiket / Label** verir.  
4. Bunları canlıya yazmak gerekir (biz / Hetzner):
   - `NEXT_PUBLIC_GOOGLE_ADS_ID=AW-…`
   - `NEXT_PUBLIC_GOOGLE_ADS_LABEL_QUOTE=…`  
5. Site zaten `equstoTrackConversion('quote')` çağırıyor (`eq-analytics.js`).

**Bu adımda reklam açma.**

---

## D) Test (zorunlu kapı)

1. Gizli pencerede `https://equsto.com/pfos` aç.  
2. Çerezlerde analitik/reklam onayı varsa kabul et.  
3. Gerçekçi bir **test teklifi** gönder (notuna `TEST - silinecek` yaz).  
4. Ads → **Dönüşümler**: birkaç saat içinde (bazen ertesi gün) **1** görünmeli.  
5. GA4 → **Raporlar** → **Gerçek zamanlı** / Events: `quote` görünmeli.

**1 dönüşüm yoksa → E’ye geçme.** Yaz, birlikte etiket/env bakarız.

---

## E) Kampanyayı kur (2.000 TL planı)

Sol menü: **Kampanyalar** → **+ Yeni kampanya**.

### E1 — Hedef ve tür

| Soru | Seç |
|------|-----|
| Hedef | **Potansiyel müşteri / Leads** (veya “Satış olmadan oluştur”) |
| Dönüşüm | Az önce tanımladığın **PFOS / quote** |
| Kampanya türü | **Arama** (Search) |
| Sonuçlar | Web sitesi ziyaretleri |

**Seçme:** Performance Max, Display, Shopping, Video.

### E2 — Kampanya ayarları

- **Kampanya adı:** `EQ | Search | Lead | TR`  
- **Ağlar:**  
  - Google Arama: **Açık**  
  - **Arama Ağı ortakları: Kapalı**  
  - **Display Ağı: Kapalı**  
- **Konumlar:** Türkiye → “Bulunduğu veya düzenli bulunduğu yerler” (Presence).  
- **Diller:** Türkçe.  
- **Bütçe:** **50 TL/gün** (ilk 7 gün; sonra 65 TL).  
- **Teklif:** **Tıklama** / Manuel CPC (Maximize conversions **değil** — henüz veri yok).  
  - Max CPC tavanı: **12 TL** (kelime düzeyinde de koyabilirsin).  
- **Dönüşüm izleme:** Açık; birincil = PFOS teklif.

İleri / daha fazla ayar:

- **Reklam programı (ad schedule):** örn. Pzt–Cmt 08:00–20:00 (isteğe bağlı ama 2k’da önerilir).  
- **Cihaz:** şimdilik dokunma.

### E3 — Ad grubu 1 (tek grup) — shop-first

- **Ad grubu adı:** `Shop | Pişirme`  
- **Son URL:** `https://equsto.com/shop/pisirme`

**Anahtar kelimeler** — hepsini **ifade eşlemesi** (`"..."` ) veya panede “İfade” seç; **Geniş kullanma**:

```
"sanayi tipi ocak"
"endüstriyel fırın"
"konveksiyonlu fırın"
"kombi fırın"
"sanayi tipi ızgara"
"endüstriyel fritöz"
```

İstersen 2–3 tane **tam eşleme** `[...]` ekle; geniş (broad) ekleme.

### E4 — Reklam metni (duyarlı arama reklamı / RSA)

En az 5 başlık, 2 açıklama:

**Başlık örnekleri (30 karakter sınırı — kısalt):**

- Equsto Endüstriyel Mutfak  
- Sanayi Tipi Ocak & Fırın  
- Pişirme Ekipmanları  
- Restoran Mutfak Mağazası  
- Fiyatlı Katalog  
- Hemen İncele  

**Açıklama örnekleri:**

- Endüstriyel pişirme ekipmanları: ocak, fırın, ızgara. Equsto mağazadan incele.  
- Restoran ve kafe için sanayi tipi mutfak ürünleri — stok ve fiyat için mağaza.

**Son URL:** `https://equsto.com/shop/pisirme`  
**Görünen yol:** `equsto.com` / `shop`

### E5 — Uzantılar (varsa şimdi)

- **Site bağlantıları:** PFOS, İletişim, Pişirme mağaza  
- **Çağrı metni / callout:** B2B teklif, Katalog, Proje desteği  
- Telefon uzantısı: satış hattın varsa

### E6 — Negatif kelimeler (kampanya düzeyinde)

Kampanya kaydettikten sonra:

**Kampanya** → **Anahtar kelimeler** → **Negatif anahtar kelimeler** → **+**

Ekle (geniş veya ifade):

```
ev
ev tipi
ikinci el
sahibinden
kiralık
tarif
yemek tarifi
iş ilanı
maaş
kariyer
ücretsiz
bedava
youtube
```

İstersen **paylaşılan negatif liste** oluştur (`EQ | Negatif | B2C`) → kampanyaya bağla.

### E7 — Kaydet ama dikkat

- Özet ekranında **Display / ortaklar hâlâ kapalı** mı bak.  
- Bütçe 50 TL mi bak.  
- Kampanyayı **Duraklat** bırakabilirsin → D testi yeşil olduktan sonra **Etkinleştir**.  
- Google “bütçeyi artır / AI önerisi uygula” derse → **Reddet / Yoksay**.

---

## F) Açtıktan sonra (ilk 14 gün)

| Ne sıklıkla | Ne yap |
|-------------|--------|
| Her gün (2 dk) | Harcama ≤ günlük tavan mı |
| Her 2–3 gün | **Anahtar kelimeler → Arama terimleri** → alakasızı negatife ekle |
| Gün 7 | Günlüğü **65 TL** yap |
| Gün 14 | Hâlâ tek ad grubu; 2. grup yok |
| Gün 15+ | 1–2 teklif geldiyse isteğe bağlı Öztiryakiler ad grubu (plan doc) |

**Açma:** Performance Max, ikinci kampanya, geniş eşleme.

---

## Sık takılma noktaları

| Sorun | Ne yap |
|-------|--------|
| “AI Max / Performance Max önerisi” | Arama kampanyasında kal; PMax seçme |
| Bütçe önerisi 300 TL/gün | Yoksay; 50→65 TL |
| Kelime “düşük arama hacmi” | Normal; dar B2B kelime. Silme, 1–2 hafta bekle |
| Dönüşüm 0, para gidiyor | 1.000 TL’den önce duraklat; D + etiket kontrol |
| Yanlış dilde arayüz | Sağ alt / ayarlardan Türkçe |

---

## Bu turda senin yapacağın (kısa checklist)

- [ ] A — Fatura + aylık 2.000 TL limit  
- [ ] B — GA4 bağla  
- [ ] C — `quote` / PFOS dönüşümü  
- [ ] D — Test teklifi → 1 dönüşüm görünür  
- [ ] E — `EQ | Search | Shop | TR` kur → `/shop/pisirme` (50 TL/gün, Display kapalı)  
- [ ] Etkinleştir (yalnız D yeşilse)  

Takıldığın adımın harfini yaz (A/B/C/D/E); oradan devam ederiz.
