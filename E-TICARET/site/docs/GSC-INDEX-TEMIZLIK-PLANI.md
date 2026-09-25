# GSC sayfa dizine ekleme — kontrollü temizlik planı

**Kaynak:** Search Console → Sayfa dizine ekleme (≈29.8 B dizine eklenmedi / 11.9 B dizine eklendi, Eyl 2026).  
**Amaç:** Bilerek hariç tutulanları dokunmadan; yalnızca **kontrol dışı teknik sorunları** kontrollü şekilde indirmek.  
**Canlı:** Hetzner (`equsto.com`); mevcut katman: `proxy.ts` + `legacy-pdp-redirects.json` + sitemap.

---

## 0) Kapsam sınırı (dokunulmayacak)

Aşağıdakiler **bilinçli / yapılandırılmış** sayılır; bu planda **değiştirilmez**, GSC’de “düzeltildi” diye işaretlenmez:

| GSC nedeni | ≈ sayfa | Neden dokunulmaz |
|------------|---------|------------------|
| `"noindex"` etiketi | 2.367 | Bilerek hariç |
| Robots.txt engeli | 963 | Bilerek engel |
| Doğru canonical alternatif | 1.165 | Doğru yapı |
| Yönlendirmeli sayfa (sağlıklı 3xx) | 7.115 | Hedef dizine girer; redirect bilerekse normal |

**İyileştirme satırı** (*Robots.txt engelli olsa da dizine eklendi* = 1): tek URL; robots ile çelişiyorsa ayrı mikro-fix (bu planın P3’ü).

---

## 1) Temizlenecek nedenler (öncelik)

| Öncelik | GSC nedeni | ≈ sayfa | Hedef sonuç |
|---------|------------|---------|-------------|
| **P0** | Bulunamadı (404) | 8.110 | Eşleşen → **308**; ölü → **410** + sitemap’ten çıkar |
| **P0** | Yeniden yönlendirme hatası | 408 | Zincir ≤2 hop, hedef **200**, loop yok |
| **P1** | Başka 4xx | 26 | 401/429 vb. kök neden |
| **P1** | Sunucu hatası (5xx) | 15 | Stabilize / retry; kalıcıysa 410 veya düzelt |
| **P1** | 403 Forbidden | 6 | Bot’a yanlış blok varsa aç; kasıtlıysa robots/noindex’e taşı |
| **P2** | Canonical’sız kopya | 7 | `rel=canonical` ekle |
| **P2** | (Tabloda gizli 3 neden, ≈9.6 B) | — | Muhtemel “Taranmış/Keşfedilmiş — henüz yok”; kalite, crawl bütçesi — **P0 bittikten sonra** |

**Başarı metriği (GSC, 28–45 gün):** P0+P1 toplamı **≤ 500**; 404 trendi düşüş; redirect hatası **≈ 0**.

---

## 2) Karar matrisi (her URL için tek aksiyon)

```
URL canlı mı?
├─ Evet, kanonik farklı slug/dept → 308 (proxy / legacy-pdp)
├─ Evet, soft-404 / boş sayfa → içerik düzelt VEYA 410
├─ Hayır, eşdeğer ürün/kategori var → 308 hedefe
├─ Hayır, kalıcı silindi / spam / WP kalıntısı → 410 Gone
└─ Hayır, yanlışlıkla sitemap’te → sitemap’ten çıkar (+ 410 tercih)
```

| Karar | HTTP | Sitemap | Ne zaman |
|-------|------|---------|----------|
| Yaşat / taşı | **308** | Yalnızca **hedef** URL | Ürün/sayfa hâlâ geçerli |
| Kalıcı ölü | **410** | Çıkar | Eşdeğer yok; crawl bütçesini boşa harcamasın |
| Geçici | **404** bırakma | — | Yalnızca kısa süre; planda hedef değil |
| Bilerek gizle | noindex / robots | Zaten kapsam dışı | Bu planda yeni ekleme yok |

**Kurallar:**
- Zincir: A→B→C yasak; **tek hop** 308.
- Hedef asla 404/5xx olmamalı (önce hedef doğrula).
- Ana sayfaya toplu 308 **yasak** (soft-404 sinyali).
- Batch boyutu: **≤ 500 URL / deploy**; ardından GSC örnek + canlı curl smoke.

---

## 3) Veri kaynağı ve sınıflandırma (Faz 0 — kod yok)

**Girdi (elle GSC’den export):**
1. Sayfa dizine ekleme → **Bulunamadı (404)** → örnekler / “Etkilenen sayfalar” CSV.
2. Aynı → **Yeniden yönlendirme hatası** CSV.
3. (İsteğe) Diğer 4xx, 5xx, 403 CSV.

**Yerel araçlar (repo):**
- `npm run legacy-pdp:build` → `public/data/legacy-pdp-redirects.json` (~8k ürün / ~26k alias).
- `npm run sitemap:build` + `scripts/seo/sitemap-audit.mjs` (sitemap içi 404/5xx).
- `proxy.ts` mevcut kalıplar: WP, yanlış dept, marka `?b=`, PDP alias.

**Sınıflandırma TSV şeması** (`scripts/seo/output/gsc-cleanup-classify.tsv`):

| alan | açıklama |
|------|----------|
| `gsc_reason` | 404 / redirect_error / 4xx / 5xx / 403 |
| `url` | GSC URL |
| `path_family` | `shop-pdp` / `shop-hub` / `pfos` / `besos` / `geo` / `wp-legacy` / `en` / `other` |
| `decision` | `308` / `410` / `fix_TARGET` / `SITEMAP_DROP` / `SKIP_INTENTIONAL` / `NEEDS_HUMAN` |
| `target` | 308 hedef path (varsa) |
| `confidence` | high / med / low |
| `batch` | `B1`…`Bn` |

**Path family tahmini (önce histogram, sonra aksiyon):**
- `/shop/{dept}/{slug}` → PDP alias / yanlış dept (mevcut `legacy-pdp` + proxy kuralları).
- `/pfos/...` programmatic → sayfa yoksa 410 veya kanonik PFOS hub’a 308 (**hub’a yalnızca aile tutuyorsa**).
- `/category`, `/urun`, `/wp-*` → zaten `resolveLegacySiteRedirect`; eksik kalıplar genişletilir.
- `/en/...` → TR kanonik + hreflang politikasına göre; kör `/en`→`/` yapma.

---

## 4) Uygulama fazları

### Faz 0 — Envanter (kapı: sınıflandırma hazır)

1. GSC CSV’leri `scripts/seo/input/` altına koy (gitignore’lu ham dump OK).
2. Path family histogram + top 20 pattern.
3. Sitemap audit yenile: sitemap’te kalan 404/5xx listesi (`SITEMAP_URL_404` vb.) — bunlar **önce** düzeltilir (Google’a “indexle” deyip 404 vermek).
4. Çıktı: `gsc-cleanup-classify.tsv` + özet JSON (`total`, `by_decision`, `by_family`).

**Kapı:** P0 URL’lerin ≥80%’i `decision` dolu; `NEEDS_HUMAN` ≤ %10.

---

### Faz 1 — Redirect hatası (408) — önce bunu bitir

Redirect hatası 404’ten küçük ama crawl’ı zehirler.

1. Her URL için hop trace (`curl -sI -L --max-redirs 5`).
2. Sınıflar: loop / hedef 404 / protokol-www karışımı / kırık ara hop.
3. Düzeltme yerleri:
   - `proxy.ts` / `legacy-pdp-redirect.ts` (yanlış hedef),
   - `legacy-pdp-redirects.json` (alias → ölü slug),
   - Nginx/Docker önünde ikinci redirect varsa tek katmana indir.
4. Smoke: batch’teki her kaynak → tek 308 → **200** + self-canonical.

**Kapı:** Örnek 50 URL’de redirect hatası 0; deploy sonrası GSC’de “Doğrulama başlat” (Redirect error satırı).

---

### Faz 2 — 404 yüksek kaldıraç (batch’ler)

| Batch | Kapsam | Mekanizma | Boyut |
|-------|--------|-----------|-------|
| **B1** | Sitemap’te 404 olan URL’ler | Sitemap’ten çıkar **veya** sayfayı geri getir | Önce (audit ~50+) |
| **B2** | Shop PDP eski slug / yanlış dept | `legacy-pdp:build` + gerekirse alias ek + `proxy.ts` | ≤500 |
| **B3** | WP / `/urun` / `/category` kalıntıları | `resolveLegacySiteRedirect` genişlet | ≤200 |
| **B4** | PFOS/BESOS ölü programmatic | 410 veya kanonik hub 308; sitemap temizliği | ≤500 |
| **B5** | Eşleşmeyen ölü URL’ler | **410** + sitemap drop | ≤500 / tur |

Her batch için:
1. Staging/canlıda 20 URL manuel curl.
2. `npm run seo:build` (sitemap + legacy-pdp).
3. Commit → Hetzner deploy (`scripts/hetzner-deploy.sh`).
4. GSC ilgili satırda **Doğrulama** (batch bitince; her URL için değil).
5. 7 gün bekle → sonraki batch (üst üste büyük redirect patlaması yok).

**Kapı (B2 sonrası):** Canlı rastgele 100 eski PDP’den ≥90’ı 308→200.

---

### Faz 3 — P1 küçük kovalar

- **5xx (15):** access/error log korelasyonu; timeout vs uygulama hatası. Kalıcı URL → düzelt veya 410.
- **403 (6):** WAF / auth / bot kuralı; Googlebot’a 403 kasıtsızsa aç.
- **Diğer 4xx (26):** 401, 429 — rate limit Googlebot’a uygulanmamalı.
- **Canonical’sız kopya (7):** eksik `rel=canonical` ekle; `seo:product-audit` ile doğrula.

---

### Faz 4 — Ölçüm ve kapanış

1. GSC ekran görüntüsü + CSV tarih damgalı arşiv (`scripts/seo/output/gsc-baseline-YYYYMMDD/`).
2. Sitemap audit: `http_404` → 0 hedef (en azından sitemap kapsamı).
3. Bilerek hariç tutulan satırlara dokunulmadığını kontrol listesi ile onayla.
4. “Taranmış/Keşfedilmiş” kovası: yalnızca P0+P1 düştükten sonra; thin PFOS URL üretimi kısma / iç link güçlendirme (ayrı iş).

---

## 5) Dokunulacak kod / dosya haritası

| Dosya / komut | Rol |
|---------------|-----|
| `proxy.ts` | 308 kuralları, host, legacy site |
| `lib/shop/legacy-pdp-redirect.ts` | PDP + WP site redirect çözümü |
| `public/data/legacy-pdp-redirects.json` | Alias indeksi (`npm run legacy-pdp:build`) |
| `scripts/build-legacy-pdp-redirects.mjs` | Alias üretim |
| `scripts/build-sitemap.mjs` | Ölü URL’leri sitemap’ten düş |
| `scripts/seo/sitemap-audit.mjs` | Canlı doğrulama |
| (yeni, uygulama turunda) `scripts/seo/classify-gsc-export.mjs` | CSV → TSV sınıflandırma |
| (yeni) `app` veya proxy **410** yanıtı | Kalıcı ölü yollar için |

Deploy: `docs/HETZNER-DEPLOY.md` — Vercel yok.

---

## 6) Risk kontrolleri

| Risk | Önlem |
|------|--------|
| Yanlış 308 (alakasız ürüne) | `confidence=high` olmadan otomatik yazma; med/low → `NEEDS_HUMAN` |
| Toplu ana sayfa redirect | Karar matrisinde yasak |
| Redirect zinciri uzaması | Faz 1 önce; tek hop zorunlu |
| Crawl bütçesi şişmesi | Batch ≤500; 410 ölü URL’ler için tercih |
| noindex/robots bozulması | Faz 0 kapsam dışı listesi; PR checklist |
| EN/TR karışması | Lang prefix koru; kör birleştirme yok |

**PR checklist (her batch):**
- [ ] Yalnızca P0/P1 URL’ler
- [ ] Smoke curl log eklendi
- [ ] Sitemap’te kaynak 404 URL kalmadı
- [ ] noindex / robots / sağlıklı redirect satırlarına dokunulmadı
- [ ] Batch boyutu ≤500

---

## 7) Operasyon sırası (tek bakış)

```
Faz 0  Envanter + sınıflandırma          → kapı: %80 sınıflı
Faz 1  Redirect error (408)              → kapı: örnek 0 hata
Faz 2  404 B1 sitemap → B2 PDP → B3 WP → B4 PFOS → B5 410
Faz 3  5xx / 403 / diğer 4xx / canonical
Faz 4  GSC doğrulama + arşiv + kapanış metriği
```

**İlk uygulanacak somut iş (kod turu):** Faz 0 script + B1 sitemap 404 temizliği — en düşük risk, en yüksek sinyal.

---

## 8) Bilinçli olarak yapılmayacaklar

- 7.115 “yönlendirmeli sayfa”yı “düzeltmeye” çalışmak (sağlıklılarsa GSC’de kalması normal).
- noindex / robots.txt gevşeterek indeks şişirmek.
- Tüm 8.1 B 404’ü tek deploy’da 308’lemek.
- Eşdeğeri olmayan URL’leri `/` veya `/shop`’a yığmak.

---

*Bu belge plan içindir. Uygulama PR’ları batch etiketiyle (`gsc-cleanup-B1` …) açılır; her PR bu planın ilgili fazına referans verir.*
