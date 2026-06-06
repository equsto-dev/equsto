# Google reklam — sıfırdan başlangıç notu

**Tarih:** 2026-06-02  
**Durum:** Adım 1 tamamlandı (GA4). Adım 2 bekliyor (kodu siteye bağlama).  
**Kullanıcı notu:** Bilgi sıfır — her adım tane tane, ekran ekran anlatılacak.

### Kayıtlar

| | |
|--|--|
| GA4 Ölçüm kimliği | `G-MVRNFQC4PQ` |
| Google Ads hesap | `416-696-9695` (Equsto Google, jurnaldang@gmail.com) — **henüz fatura/para ekleme** |

---

## Özet (tek cümle)

Dükkan açık; ama «reklamdan kaç müşteri geldi?» sorusunu cevaplayacak sayaç henüz takılı değil.

---

## Site ne durumda?

| Soru | Cevap |
|------|--------|
| Müşteri teklif alabilir mi? | Evet — PFOS, iletişim, kedi sohbet çalışıyor |
| Ürünler görünür mü? | Evet — mağaza, GEO sayfalar, katalog var |
| Reklam parası harcanabilir mi? | **Henüz hayır** — önce ölçüm kurulmalı |

**Eksik olan sayfa değil; ölçüm ve Google hesapları.**

---

## Sıfır bilgiyle bilmen gereken 3 kelime

1. **Google Analytics (GA4)** — Sitede ne oluyor? Kaç kişi geldi, hangi sayfaya baktı? Ücretsiz sayaç.
2. **Google Ads** — Google’da ücretli reklam verdiğin panel. Parayı buradan harcarsın.
3. **Dönüşüm** — Senin için başarı = müşteri **teklif gönderdi** veya **iletişime geçti**. Reklamın işe yarayıp yaramadığını bu sayar.

Başka terim öğrenmene gerek yok; sıradaki adımda sadece bunlara odaklanacağız.

---

## Reklam açmadan önce yapılacaklar (sıra sabit)

### Adım 1 — Google Analytics hesabı (sen)
- analytics.google.com
- equsto.com için yeni «mülk» (property) açılır
- Sana `G-XXXXXXXX` gibi bir kod verilir
- **Henüz reklam yok; sadece sayaç**

### Adım 2 — Kodu siteye bağlama (biz)
- Kod Vercel ortam değişkenine yazılır: `NEXT_PUBLIC_GA4_ID`
- Deploy sonrası Google’da «bugün X ziyaretçi» görünmeye başlar

### Adım 3 — Google Ads hesabı (sen)
- ads.google.com
- Analytics ile bağlanır
- «Dönüşüm» tanımı: PFOS teklif gönderimi = başarı

### Adım 4 — Test (birlikte)
- Sen siteden test teklifi gönderirsin
- Google panelinde «1 dönüşüm» görünür mü bakarız
- Görünüyorsa → reklam açılabilir
- Görünmüyorsa → reklam açmayız, önce düzeltiriz

### Adım 5 — İlk küçük reklam (çok düşük bütçe)
- Tek hedef: **PFOS teklifi**
- Tek landing: `https://equsto.com/pfos`
- Günlük 50–100 TL test; sonuçları birlikte okuruz

**Adım 5’e Adım 1–4 bitmeden geçilmez.**

---

## İlk reklamda kullanılacak sayfalar (not — şimdilik açma)

| Sayfa | Ne zaman |
|-------|----------|
| `/pfos` | İlk reklam — ana hedef |
| `/oztiryakiler-ekipmani-tedarik` | Ölçüm çalıştıktan sonra |
| `/restoran-mutfak-teklif` | Ölçüm çalıştıktan sonra |
| `/contact` | Yedek |

Mağaza, Performance Max, Merchant Center → **çok sonra**; şimdilik düşünme.

---

## Kod tarafında hazır olan (senin yapman gerekmiyor)

- `components/seo/AnalyticsScripts.tsx` — GA4 + Ads tag’leri env dolunca yüklenir
- `public/eq-analytics.js` — dönüşüm event’leri: `lead`, `quote`, `order`
- PFOS, iletişim, sepet gönderiminde otomatik tetiklenir

**Eksik:** Vercel’de `NEXT_PUBLIC_GA4_ID` ve `NEXT_PUBLIC_GOOGLE_ADS_ID` henüz yok.

---

## Nasıl ilerleyeceğiz?

- Her seferinde **tek adım**; bitmeden sonrakine geçmeyiz
- Jargon kullanırsak hemen altında Türkçe açıklama
- Ekran görüntüsü / «şu butona tıkla» tarzı yönlendirme
- Sen «tamam» demeden sonraki adıma geçmeyiz

**Sıradaki adım:** Adım 2 — `G-MVRNFQC4PQ` kodunu Vercel'e yaz, deploy et, Analytics'te veri geldi mi kontrol et.

---

## İlgili dosyalar

- `.env.example` — GA4 / Ads değişkenleri
- `docs/GOOGLE-MERCHANT-CENTER.md` — ürün feed (ileride, şimdilik okuma)
