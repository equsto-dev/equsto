# Google reklam — sıfırdan başlangıç notu

**Tarih:** 2026-06-02  
**Durum:** Adım 2 tamamlandı (GA4 canlı, Gerçek zamanlı doğrulandı). Sırada Adım 3 (Google Ads bağlantısı).  
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

## Landing URL politikası (Ads Faz 0 — 2026-11-10)

Kampanya iniş URL’leri **yalnızca** şu kalıplarda olmalı:

| Kullan | Kullanma |
|--------|----------|
| `/pfos` (teklif kampanyası) | Ana sayfaya genel trafik dökme |
| `/shop/{dept}` (kategori Search) | `/shop/.../kategori/...` (filtre/grid zayıf) |
| `/shop/{dept}/{slug}` (ürün Search) | `/kategori/[slug]` Prisma storefront |
| `/iletisim` (yedek lead) | |

Mesaj eşleşmesi: reklam vaadi = sayfa H1 / birincil CTA.

## Dönüşüm event’leri (kod hazır)

| Event / conversion type | Ne zaman |
|-------------------------|----------|
| `whatsapp_click` → `lead` | FAB, PDP «WhatsApp», footer, iletişim |
| `phone_click` → `lead` | `tel:` linkleri, PDP «Hemen Ara», footer |
| `pfos_cta_click` → `lead` | PDP Proje Fabrikası, `/pfos` linkleri |
| `quote` | PFOS teklif tablosu oluşunca |
| `order` | Sipariş (env label doluysa) |

Env (Hetzner / `.env`): `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID`, `NEXT_PUBLIC_GOOGLE_ADS_LABEL_LEAD|QUOTE|ORDER`.

## İlk reklamda kullanılacak sayfalar

| Sayfa | Ne zaman |
|-------|----------|
| `/pfos` | İlk reklam — ana hedef |
| `/shop/pisirme` (ör. dept) | Ölçüm + mobil hız doğrulandıktan sonra |
| `/oztiryakiler-ekipmani-tedarik` | Marka kampanyası |
| `/iletisim` | Yedek |

Performance Max / Merchant Center → ölçüm oturduktan sonra.

---

## Kod tarafında hazır olan

- `components/seo/AnalyticsScripts.tsx` — GA4 + Ads + lead delegasyon
- `public/eq-analytics.js` — `equstoTrackLead` / conversion labels
- PDP: Hemen Ara + WhatsApp (Proje Fabrikası butonu PDP’de yok; nav/ana sayfa)
- Kamu telefon: `lib/site/public-phone.ts` ile JS senkron (`EQUSTO_HIDE_PUBLIC_PHONE = false`)

---

## Nasıl ilerleyeceğiz?

- Her seferinde **tek adım**; bitmeden sonrakine geçmeyiz
- Jargon kullanırsak hemen altında Türkçe açıklama
- Ekran görüntüsü / «şu butona tıkla» tarzı yönlendirme
- Sen «tamam» demeden sonraki adıma geçmeyiz

**Sıradaki adım:** Adım 3 — Google Ads hesabını Analytics'e bağla, «teklif gönderildi» dönüşümünü tanımla (henüz para ekleme).

---

## İlgili dosyalar

- `.env.example` — GA4 / Ads değişkenleri
- `docs/GOOGLE-MERCHANT-CENTER.md` — ürün feed (ileride, şimdilik okuma)
