# PFOS · 06 SUSHI — Veo / Gemini / Flow video brief

Taslak arşiv (`veri/`). Canlı siteye dahil değil.  
Kaynak: `06-SUSHI-ekipman-listesi.xlsx`, `SUSHI.-PLANpdf.pdf` (~20,1 m² pişirme-teşhir hattı).

---

## 1. Manuel deneme checklist (Gemini veya Google Flow)

### Hazırlık
- [ ] [Google AI Studio](https://aistudio.google.com/) veya [Flow](https://labs.google/fx/tools/flow) hesabı açık
- [ ] Video modeli: **Veo 3.1 Fast** (deneme) veya **Veo 3.1** (final kalite)
- [ ] En-boy: **16:9** (PFOS / web hero) veya **9:16** (Reels — ayrı üret)
- [ ] Süre: **8 sn** (tek klip); uzun sahne = 2–3 klip + montaj
- [ ] Referans görsel hazır (aşağıdaki Brief Bölüm 2)

### Üretim
- [ ] Prompt 1 (genel sushi bar) yapıştır → üret
- [ ] Aynı referans görsel + Prompt 2 (şef detay) → üret
- [ ] Aynı referans görsel + Prompt 3 (müşteri / teşhir) → üret
- [ ] Negative prompt’u her seferinde ekle
- [ ] Çıktıyı indir; dosya adı: `sushi-veo-01-hero.mp4` vb.

### Kontrol (PFOS için yeterli mi?)
- [ ] Paslanmaz çelik mutfak, gerçekçi ışık, buhar yok / abartı yok
- [ ] Sushi teşhir bandı veya hazırlık tezgahı okunabilir (marka/model uydurması kabul)
- [ ] Metin/logo/watermark PFOS dışında yok (SynthID hariç)
- [ ] İnsan yüzü varsa doğal, distortions yok
- [ ] **Teknik doğruluk beklenmez** — pazarlama hissi yeterli

### PFOS’ta kullanım (ileride, “tamam” sonrası)
- [ ] Alt yazı: *“AI görselleştirme · nihai ekipman projeye göre değişir.”*
- [ ] Konsept: `06-sushi` / Dükkan tipi: sushi bar

---

## 2. Referans görsel brief (image-to-video için)

Veo’ya önce **1 ana + 1 opsiyonel** statik görsel verin; tutarlılık artar.

### Görsel A — Ana referans (öncelik)
**Konu:** Kompakt sushi / Japon füzyon mutfak hattı, kuşbakışı veya 3/4 açı.

| Öğe | Tarif |
|-----|--------|
| Ortam | ~20 m² hissi, dar ama profesyonel; tek hat |
| Malzeme | Paslanmaz tezgah, siyah/gri zemin, cam buzdolabı kapıları |
| Odak | Uzun **sushi hazırlık tezgahı** + **teşhir ünitesi** (C5, C7) |
| Arka plan | Davlumbaz silüeti, buz makinesi köşesi, soft rack |
| Işık | Gün ışığı + sıcak tavan LED; temiz, premium |
| Renk | Nötr çelik, ahşap aksan yok veya minimal |
| İnsan | Yok (sadece tezgah) veya sadece eller / sırt |

**Üretim yolları:**  
- Gerçek showroom fotoğrafı (Equsto stok)  
- veya Imagen / Gemini Image: aynı brief İngilizce (Bölüm 3 altında)

**Dosya adı önerisi:** `sushi-ref-ana-plan-hatti.jpg` (1920×1080 min.)

### Görsel B — Opsiyonel (şef / ritim)
**Konu:** Şef, sushi hazırlık evyesinde pirinç / nori; yüz profilden veya el close-up.

| Öğe | Tarif |
|-----|--------|
| Kıyafet | Beyaz chef ceket, temiz önlük |
| Eylem | Sakin, hassas; hızlı hareket blur yok |
| Arka plan | Bokeh mutfak, teşhir vitrininde renkli rulolar |

**Dosya adı:** `sushi-ref-sef-hazirlik.jpg`

### Kaçınılacaklar (referans görselde)
- Okunur marka logosu (Mareno, Cimbali vb.) — AI video sonra bozar
- Kalabalık restoran salonu (PFOS mutfak hattı değil)
- Fast food / burger estetiği
- Karanlık, yağlı, neon gece kulübü

---

## 3. Video prompt’ları (kopyala-yapıştır)

Dil: **İngilizce** (Veo için daha iyi sonuç). Türkçe alt başlık fikri ayrı.

### Negative prompt (hepsine ekleyin)

```text
blurry, distorted hands, extra fingers, wrong food, burger, pizza, messy kitchen, 
dirty floor, cartoon, watermark, readable brand logos, text overlay, shaky camera, 
low resolution, oversaturated, crowded dining room, waiters, cash register close-up
```

---

### Prompt 1 — Hero / PFOS wizard arka plan (genel hat)

**Süre:** 8 sn · **Hareket:** yavaş dolly-in veya sabit + hafif buhar

```text
Cinematic slow push-in over a compact professional sushi kitchen line, about 20 square meters feel. 
Stainless steel prep counters, glass-door refrigerated display, sushi preparation sink area, 
overhead exhaust hood, soft daylight mixed with warm ceiling LEDs. Fresh nigiri and maki rolls 
on a chilled display band, subtle steam from rice cooker in background. Clean, premium, 
Japanese-inspired restaurant back-of-house, no people, no logos, photorealistic, 4K look, 
shallow depth of field, 24fps film grain subtle.
```

**Türkçe özet:** Kompakt sushi mutfak hattı; tezgah, teşhir, davlumbaz; insan yok; sinematik yavaş zoom.

---

### Prompt 2 — Hazırlık / ekipman hissi (şef elleri)

**Referans:** Görsel B veya Görsel A  
**Hareket:** close-up, sabit kamera

```text
Close-up of a sushi chef's hands shaping rice on a stainless preparation counter, 
professional kitchen, sushi prep sink nearby, chilled display case softly blurred behind. 
Precise, calm movements, fresh fish slices on ice tray, clean white chef coat sleeves only. 
Soft key light from left, realistic stainless reflections, no face visible, no brand names, 
photorealistic commercial food video style, 8 seconds loop-friendly ending.
```

**Türkçe özet:** Şef elleri, pirinç/balık hazırlık; teşhir arka planda blur.

---

### Prompt 3 — Teşhir / müşteri perspektifi (ön vitrin)

**Hareket:** yavaş pan soldan sağa

```text
Slow horizontal pan across a sushi display counter in a modern compact restaurant kitchen opening 
to a small service area. Colorful sushi rolls and nigiri on black slate and glass display, 
ice mist subtle, espresso machine silhouette far background out of focus. Bright appetizing 
food styling, stainless and glass materials, premium casual dining atmosphere, no text, 
no logos, photorealistic, gentle camera pan 8 seconds.
```

**Türkçe özet:** Teşhir bandında sushi çeşitleri; yavaş pan; arka planda bar/kahve silüeti.

---

## 4. Referans görsel — Imagen / Gemini Image prompt (Görsel A)

```text
Architectural visualization style, compact sushi restaurant back kitchen 20 sqm, bird's eye 
three-quarter view, stainless steel long prep counter, sushi display refrigerator with glass doors, 
prep sink, exhaust hood, ice machine corner, clean grey floor, professional lighting, empty of people, 
high detail, photorealistic, 16:9
```

---

## 5. PFOS metinleri (video yanında)

| Kullanım | Metin |
|----------|--------|
| Kısa başlık | **06 · Sushi bar mutfak hattı** |
| Alt satır | Proje Fabrikası örnek görselleştirme |
| Yasal not | AI ile üretilmiştir. Ekipman listesi projeye göre netleşir. |
| CTA | equsto.com/pfos |

---

## 6. Dosya organizasyonu (veri içinde)

```
veri/
  sushi-ref-ana-plan-hatti.jpg    ← siz üretin / yükleyin
  sushi-ref-sef-hazirlik.jpg      ← opsiyonel
  sushi-veo-01-hero.mp4           ← Veo çıktıları
  sushi-veo-02-prep.mp4
  sushi-veo-03-display.mp4
  SUSHI-VEO-BRIEF.md              ← bu dosya
```

---

## 7. Beklenti özeti

| Beklenen | Beklenmeyen |
|----------|-------------|
| Premium, temiz sushi mutfak atmosferi | SKU / ölçü / Mareno model doğruluğu |
| PFOS’ta konsept seçiminde duygu | Plan PDF ile piksel piksel örtüşme |
| 8 sn’lik hero klipler | Tek videoda 27 kalem ekipmanın hepsi |

Onaylı klip seçildikten sonra “tamam” ile siteye alınabilir.
