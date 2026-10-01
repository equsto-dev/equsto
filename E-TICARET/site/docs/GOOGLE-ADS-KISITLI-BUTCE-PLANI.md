# Google Ads — kısıtlı bütçe planı (Equsto)

**Tarih:** 2026-10-01  
**Hesap:** `416-696-9695` (Equsto Google)  
**GA4:** `G-MVRNFQC4PQ`  
**İş modeli:** B2B endüstriyel mutfak — satış = teklif / lead, sepet değil  
**İlgili:** [`GOOGLE-ADS-BASLANGIC.md`](./GOOGLE-ADS-BASLANGIC.md) · [`GOOGLE-MERCHANT-CENTER.md`](./GOOGLE-MERCHANT-CENTER.md)

---

## 1. Tek cümle strateji

Kısıtlı parayı **yüksek niyetli arama** + **tek dönüşüm (PFOS teklifi)** + **dar anahtar kelime** ile yak; Display / PMax / marka dışı geniş eşleme **açma**.

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

## 3. Bütçe senaryoları (TRY)

Aylık brüt bütçeni seç; günlük = aylık ÷ 30,5 (Google günlük aşımı olabilir → hesap tavanı koy).

| Senaryo | Aylık | Günlük tavan | Ne yapar |
|---------|-------|--------------|----------|
| **A — Mikro test** | 1.500–2.500 TL | 50–80 TL | Ölçüm + 1 kampanya; öğrenme |
| **B — Dar büyüme** (önerilen) | 4.000–7.000 TL | 130–230 TL | 2 ad grubu; kelime budama |
| **C — Kontrollü ölçek** | 10.000–15.000 TL | 330–500 TL | 3. ad grubu + remarketing (yalnız site ziyaretçisi) |

**Kural:** Senaryo A bitmeden B’ye geçme. B’de CPL kabul edilebilir değilse C’ye geçme — önce teklif metni / landing / negatif kelime düzelt.

**Hesap güvenliği**

1. Google Ads → Faturalandırma → **hesap bütçesi / aylık harcama limiti** (mümkünse).  
2. Kampanya günlük bütçe + **manuel CPC** veya **maksimize dönüşüm** ama **hedef CPL tavanı** (veri yokken ilk 7–14 gün manuel CPC daha güvenli).  
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

**Final URL önceliği:** `https://equsto.com/pfos`  
(İkinci ad grubunda marka sayfası — aşağıda.)

---

## 6. Ad grupları ve kelimeler

İki ad grubu yeter. Üçüncüyü yalnızca Senaryo B+ ve Faz 1 CPL iyi gittikten sonra ekle.

### Ad grubu 1 — Teklif / proje (birincil)

| | |
|--|--|
| Landing | `/pfos` |
| Eşleme | **Tam + ifade** (phrase); geniş yok |
| Amaç | Proje / teklif niyeti |

**Pozitif örnekler (ifade / tam):**

- `"restoran mutfak teklifi"`
- `"endüstriyel mutfak teklifi"`
- `"mutfak projesi fiyat"`
- `"sanayi tipi mutfak kurulumu"`
- `"restoran mutfak ekipman listesi"`
- `[pfos mutfak]` (marka / ürün bilinirliği düşükse düşük hacim — opsiyonel)

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

**Not:** Marka kelimeleri pahalı olabilir ama niyet yüksek. Günlük bütçenin **%30–40’ı** bu ad grubuna kalsın; kalan **%60–70** teklif ad grubuna.

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

### Gün 1–3 — Soft launch

- Günlük tavan: Senaryo A (50–80 TL) veya B’nin altı  
- Yalnız Ad grubu 1 (teklif)  
- Günde 1 kez: arama terimleri + harcama (panik yok)

### Gün 4–14 — Öğrenme

- Ad grubu 2’yi aç (bütçe payı %30–40)  
- CTR &lt; %2 veya bounce yüksekse: reklam metni + landing hızı / CTA  
- CPL &gt; hedef (ör. 400–800 TL / teklif — senin marjına göre ayarla) → kelime budama, teklif düşürme  
- Dönüşüm 0 ve harcama &gt; 1.000 TL → landing / form / etiket denetimi (reklamı büyütme)

### Gün 15–30 — Karar

| Sonuç | Karar |
|-------|--------|
| ≥ 3–5 kaliteli teklif, CPL kabul | Senaryo B’ye sabitle; kelime genişletme dikkatli |
| Tıklama var, teklif yok | Landing + form + telefon CTA; reklam kelimesini daralt |
| Ne tıklama ne öğrenme (çok düşük gösterim) | Teklifi / eşlemeyi biraz aç (hâlâ ifade); konum genişlet |
| CPL felaket | Durdur; SEO/GEO + Merchant ücretsiz listeleme’ye ağırlık ver |

---

## 9. Hedef CPL nasıl seçilir?

Kabaca:

```
Hedef CPL ≤ (ortalama proje brüt kâr × kapanış oranı)
```

Örnek: Ortalama kapanan projede net katkı 15.000 TL, kapanış %10 → lead değeri ~1.500 TL → **hedef CPL 400–700 TL** makul bant.  
Sayıların yoksa ilk ay **öğrenme bütçesi** kabul et; hedef CPL uydurma.

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
2. Aylık limit + Senaryo A/B seç  
3. `EQ | Search | Lead | TR` + negatif liste  
4. Ad grubu 1 → `/pfos`  
5. 3–4 gün sonra Ad grubu 2 → Öztiryakiler landing  
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

**Önerilen başlangıç:** Senaryo **A** (≈50–80 TL/gün) → ölçüm kanıtı → Senaryo **B**.
