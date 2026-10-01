# Google Ads — kısıtlı bütçe planı (Equsto)

**Tarih:** 2026-10-01  
**Hesap:** `416-696-9695` (Equsto Google)  
**GA4:** `G-MVRNFQC4PQ`  
**Aktif bütçe:** **2.000 TL / ay** (Senaryo A — kilitli)
**Birincil hedef:** **Shop** (`/shop/pisirme`) — PFOS sonra  
**İş modeli:** B2B endüstriyel mutfak — satış = teklif / lead, sepet değil  
**İlgili:** [`GOOGLE-ADS-PANEL-ADIMLAR.md`](./GOOGLE-ADS-PANEL-ADIMLAR.md) · [`GOOGLE-ADS-BASLANGIC.md`](./GOOGLE-ADS-BASLANGIC.md) · [`GOOGLE-MERCHANT-CENTER.md`](./GOOGLE-MERCHANT-CENTER.md)

---

## 1. Tek cümle strateji

Kısıtlı parayı **yüksek niyetli arama** + **shop landing** + **dar ürün kelimesi** ile yak; birincil dönüşüm `equsto_lead` / (aktifse) `equsto_order`. PFOS sonra. Display / PMax / geniş eşleme **açma**.

---

## 2. Gerçekçi çerçeve (B2B mutfak)

| Gerçek | Sonuç |
|--------|--------|
| Ortalama sepet / proje yüksek (on binler–yüz binler TL) | 1 kaliteli lead, 10 ucuz tıklamadan daha değerli |
| Satın alma kararı yavaş (karşılaştırma, proforma, keşif) | Dönüşüm = **teklif**, sipariş değil |
| Rakipler (Cafemarkt vb.) agresif | Geniş kelimelerde CPC şişer → **dar / intent** kelimelere git |
| Kısıtlı bütçe | Tek kampanya, tek ad grubu seti, günlük tavan |

**Başarı tanımı (30 gün):**  
Ölçülebilir **teklif / iletişim** (GA4 `quote` / `lead`) ve **maliyet / teklif (CPL)** — tıklama sayısı değil.

---

## 3. Kilitli bütçe — 2.000 TL / ay

| Ayar | Değer |
|------|--------|
| Aylık tavan (hesap) | **2.000 TL** |
| Günlük kampanya bütçesi | **65 TL** (2000 ÷ 30,5 ≈ 65,6) |
| İlk 7 gün (temkinli) | **50 TL/gün** → ~350 TL öğrenme |
| Gün 8–30 | **65–70 TL/gün** (ay 2.000’i aşmadan) |
| Teklif | Manuel CPC; max CPC tavanı **~12 TL** (ilk hafta) |
| Ad grupları | **Yalnız 1** (`/pfos`) ilk **14 gün**; 2. grup en erken gün 15 |

### 2.000 TL ile gerçekçi beklenti

| Varsayım | Aralık |
|----------|--------|
| Ortalama CPC (dar B2B) | 8–20 TL |
| Aylık tıklama | ~100–250 |
| Teklif (dönüşüm) | **0–4** (1–2 kaliteli lead = başarı) |
| Ham CPL (1–2 teklifte) | ~1.000–2.000 TL |

Bu ayın işi “her gün lead” değil: **ölçümü kanıtla + 1–2 gerçek teklif + hangi kelime işe yarıyor öğren**.

### Bu bütçede özellikle yapma

- 2. ad grubunu ilk 14 günde açma (bütçe parçalanır)  
- PMax / Display / Shopping / remarketing  
- Günlüğü 100+ TL’ye çekme  
- Geniş eşleme  

### Sonraki adım (bütçe artarsa)

| Senaryo | Aylık | Günlük | Ne zaman |
|---------|-------|--------|----------|
| **A — şimdi** | **2.000 TL** | **~65 TL** | Aktif |
| B | 4.000–7.000 TL | 130–230 TL | ≥2 teklif + CPL kabul |
| C | 10.000–15.000 TL | 330–500 TL | B oturunca |

**Hesap güvenliği**

1. Faturalandırma → **aylık harcama limiti = 2.000 TL**.  
2. Kampanya günlük **65 TL** + manuel CPC.  
3. Otomatik “önerileri uygula” / Smart goals **kapalı**.

---

## 4. Açmadan önce checklist (para yokken)

Mevcut başlangıç notuyla uyumlu; kısaca:

| # | İş | Durum notu |
|---|-----|------------|
| 1 | GA4 canlı (`G-MVRNFQC4PQ`) | Başlangıç doc: Adım 2 tamam |
| 2 | Ads ↔ GA4 bağlantısı | Adım 3 |
| 3 | Dönüşüm: PFOS teklif = birincil; iletişim = ikincil | `quote` / `lead` |
| 4 | Test teklifi → panelde 1 dönüşüm | Adım 4 — **görünmeden reklam yok** |
| 5 | Env: `NEXT_PUBLIC_GOOGLE_ADS_ID` + conversion label’lar (canlı) | Hetzner / prod |
| 6 | KVKK / çerez: analitik+reklam onayı sonrası etiket | Consent |

Detay: `GOOGLE-ADS-BASLANGIC.md`.

---

## 5. Kampanya mimarisi (kısıtlı bütçe)

### Faz 0 — Yasaklar (ilk 30–45 gün)

- Performance Max  
- Display Network (arama ağı kampanyasında “Display ortakları” **kapalı**)  
- Geniş eşleme (Broad)  
- Marka dışı jenerik: yalnız “mutfak”, “fırın” vb.  
- YouTube / Discovery  
- Merchant / Shopping (feed hazır olsa bile — bütçe bölünmesin)  
- Birden fazla paralel kampanya

### Faz 1 — Tek Search kampanyası

**Kampanya adı:** `EQ | Search | Lead | TR`  
**Ağ:** Yalnız Arama  
**Konum:** Türkiye (veya önce İstanbul + Ankara + İzmir — bütçe çok kısıtlıysa)  
**Dil:** Türkçe  
**Cihaz:** Tümü (mobilde CPL kötüyse −%20–30 teklif ayarı)  
**Program:** İş saatleri ağırlıklı (ör. 08:00–20:00) — gece tıklama yakmayı azaltır  
**Teklif:** Manuel CPC (başlangıç) → 15–20 dönüşüm sonrası Maximize conversions + isteğe bağlı hedef CPL  

**Final URL önceliği:** `https://equsto.com/shop/pisirme`  
(PFOS / marka ad grupları — bütçe artınca.)

---

## 6. Ad grupları ve kelimeler

İki ad grubu yeter. Üçüncüyü yalnızca Senaryo B+ ve Faz 1 CPL iyi gittikten sonra ekle.

### Ad grubu 1 — Shop / pişirme (birincil)

| | |
|--|--|
| Landing | `/shop/pisirme` |
| Eşleme | **Tam + ifade** (phrase); geniş yok |
| Amaç | Ürün / fiyat niyeti → mağaza |

**Pozitif örnekler (ifade / tam):**

- `"sanayi tipi ocak"`
- `"endüstriyel fırın"`
- `"konveksiyonlu fırın"`
- `"kombi fırın"`
- `"sanayi tipi ızgara"`
- `"endüstriyel fritöz"`

**Reklam (RSA) — yön:**

- Başlık: Equsto · Proje Fabrikası · Anlık teklif · Endüstriyel mutfak  
- Açıklama: Liste yükle veya oluştur → fiyatları birlikte netleştir. Restoran / otel / kafe.  
- CTA: Teklif al / Projeni başlat  
- Siteline: `/pfos`, `/iletisim`, `/shop/pisirme` (yalnız sitelink; ana final URL PFOS kalsın)

### Ad grupu 2 — Marka / bayilik niyeti (yüksek intent, düşük hacim)

| | |
|--|--|
| Landing | `/oztiryakiler-ekipmani-tedarik` |
| Eşleme | Tam + ifade |

**Pozitif örnekler:**

- `"öztiryakiler bayii"`
- `"öztiryakiler fiyat"`
- `"öztiryakiler fiyat listesi"`
- `"öztiryakiler yetkili satıcı"`
- `"rational icombi fiyat"` (stok/yetki netse; değilse ekleme)

**Not (2.000 TL/ay):** Bu ad grubunu **en erken gün 15** aç. Açınca bile günlük payı düşük tut (~%25–30); asıl bütçe PFOS’ta kalsın. CPC şişerse hemen duraklat.

### Ad grupu 3 — (sonra) Kategori intent

Yalnız CPL iyi + bütçe ≥ Senaryo B:

- Landing: ilgili GEO / kategori (ör. konveksiyonlu fırın, sanayi tipi ocak)  
- Kelime: P0 SEO listesindeki **satın alma niyetli** olanlar (`kombi fırın fiyat`, `sanayi tipi ocak`)  
- Geniş kategori trafiğine kayma; ürün sayfasına değil **teklif CTA’lı** landing’e yönlendir

---

## 7. Negatif kelime listesi (gün 1’den ekle)

Paylaşılan negatif liste oluştur; her Search kampanyasına bağla.

**B2C / alakasız**

- ev, ev tipi, ev için, küçük ev aleti  
- ikinci el, sahibinden, kiralık, rent  
- tarif, yemek tarifi, nasıl yapılır  
- iş ilanı, maaş, kariyer, staj  

**Ücretsiz / düşük niyet**

- ücretsiz, bedava, pdf indir, katalog indir (indirilebilir PDF’in reklam hedefi değilse)  
- video, youtube  

**Rakip / yanlış ürün (stratejiye göre)**

- kendi markanı korumak için rakip marka kelimelerini **bilinçli** ekle veya ekleme; bütçe dar ise rakip marka **açma** (CPC yüksek, dönüşüm belirsiz)

**Coğrafya (ihtiyaca göre)**

- yurt dışı şehirler / İngilizce only sorgular (TR dışı satmıyorsan)

Haftalık: Arama terimleri raporu → alakasız sorguyu negatife taşı.

---

## 8. 30 günlük çalışma takvimi

### Gün 0 — Kapı

- Dönüşüm testi yeşil  
- Fatura + aylık limit  
- Negatif liste hazır  
- **Tek** kampanya taslak; henüz etkin değil

### Gün 1–3 — Soft launch (2.000 TL/ay)

- Günlük **50 TL**; yalnız Ad grubu 1 → `/pfos`  
- Manuel CPC, max ~12 TL  
- Günde 1 kez: arama terimleri + harcama (panik yok)

### Gün 4–14 — Öğrenme (hâlâ tek ad grubu)

- Günlüğü **65 TL**’ye çıkar  
- Ad grubu 2 **açma** — bütçe yetmez, parçalanır  
- CTR &lt; %2 veya bounce yüksekse: reklam metni + landing / CTA  
- Dönüşüm 0 ve harcama &gt; **1.000 TL** → etiket / form / landing denetimi (büyütme)

### Gün 15–30 — Karar

| Sonuç | Karar |
|-------|--------|
| ≥ 1–2 kaliteli teklif | 2.000 TL’de devam; isteğe bağlı Ad grubu 2 (~%25 pay) |
| ≥ 3 teklif + CPL kabul | Bütçeyi 4.000+ (Senaryo B) düşün |
| Tıklama var, teklif yok | Landing + form; kelime daralt — bütçe artırma |
| Gösterim çok düşük | Max CPC’yi 15 TL’ye çek; konum TR kalsın |
| CPL / alakasız trafik | Durdur; SEO/GEO + Merchant ücretsiz listeleme |

---

## 9. Hedef CPL nasıl seçilir?

Kabaca:

```
Hedef CPL ≤ (ortalama proje brüt kâr × kapanış oranı)
```

Örnek: Ortalama kapanan projede net katkı 15.000 TL, kapanış %10 → lead değeri ~1.500 TL → **hedef CPL 400–700 TL** makul bant.  
2.000 TL’lik ilk ayda **öğrenme bütçesi** kabul et: 1 teklif bile CPL’yi ~2.000 TL gösterir; bu “başarısızlık” değil, örneklem küçük. Hedef CPL’yi 2. aya bırak.

---

## 10. Reklam metni ilkeleri (Equsto)

- **Ürün değil süreç sat:** “Proje Fabrikası’nda liste oluştur / yükle → teklif”  
- **Marka görünür:** Equsto başlıkta (brand test)  
- Abartılı “en ucuz / #1” yok — politika + güven  
- Fiyat vaadi yoksa “fiyat listesi anında” gibi iddialardan kaçın; “birlikte netleştir” daha dürüst  
- Uzantılar: sitelink (PFOS, iletişim, pişirme), callout (B2B, katalog, teklif), çağrı uzantısı (satış hattı varsa)

---

## 11. Ölçüm paneli (haftalık 15 dk)

| Metrik | Bak |
|--------|-----|
| Harcama | Günlük / aylık limit |
| Tıklama / CTR | &lt;%1–2 → metin / alaka |
| Dönüşüm (quote+lead) | Asıl KPI |
| CPL | Hedef bant |
| Arama terimleri | Negatif / pozitif |
| Cihaz | Mobil CPL kötüyse teklif ayarı |
| Landing (GA4) | PFOS oturum → teklif oranı |

Pro panel: **Google Ads Ajan** (`GoogleAdsAgentPanel`) — etiket, feed, landing denetimi; kampanya açmadan önce bir kez çalıştır.

---

## 12. Sonraki fazlar (bilinçli ertele)

Sıra sabit; erken açma bütçeyi yakar:

1. **Remarketing** (yalnız site ziyaretçisi, düşük günlük) — yeterli cookie havuzu sonrası  
2. **Merchant Center ücretsiz listelemeler** — Ads harcaması değil; feed kalitesi  
3. **Shopping / PMax** — feed + dönüşüm geçmişi + daha yüksek bütçe  
4. **Kategori Search** — P0 kelime seti (SEO raporuyla uyumlu)

---

## 13. Uygulama özeti (yapılacaklar listesi)

**Sen (Ads paneli)**

1. Dönüşüm + GA4 bağlantısını kilitle  
2. Aylık limit **2.000 TL** + günlük **65 TL**  
3. `EQ | Search | Lead | TR` + negatif liste  
4. Ad grubu 1 → `/pfos` (14 gün yalnız bu)  
5. Gün 15+ (isteğe bağlı) Ad grubu 2 → Öztiryakiler  
6. Haftalık arama terimi temizliği  

**Biz (repo / site)** — ihtiyaç olursa

- Conversion label env’lerin prod’da dolu olması  
- PFOS / landing hızı ve CTA netliği  
- Ads ajan raporunun yeşile yakın olması  

---

## 14. Tek bakışta “yapma / yap”

| Yap | Yapma |
|-----|--------|
| Tek Search, dar kelime | PMax / Display ilk ay |
| PFOS = birincil dönüşüm | Sipariş sayısına göre optimize |
| Negatif liste + arama terimi | Geniş eşleme |
| Günlük + aylık tavan | “Önerilen bütçeyi uygula” |
| 14 gün sabır + budama | Her gün teklif / yapı değiştir |

**Kilitli:** **2.000 TL/ay ≈ 65 TL/gün** → ölçüm + 1–2 lead → gerekirse Senaryo **B**.
