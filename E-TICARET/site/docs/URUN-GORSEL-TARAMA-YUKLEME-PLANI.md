# Ürün görsel tarama → internetten bulma → siteye yükleme planı

Hedef: katalogdaki **~15.6k ürün** için GMC / PDP kalitesine uygun **gerçek ek ürün fotoğrafları** bulmak, indirmek, S3/CDN’e yüklemek ve `ekipmanlar.json` + dept JSON’a yazmak.

Bu plan, sentetik kırpım API’sinin (`/api/gmc/img/…`) yerine veya üzerine **gerçek multi-angle foto** koymayı hedefler. Kırpımlar geçici köprüdür; asıl skor ve dönüşüm gerçek galeriden gelir.

---

## 0. Mevcut durum (snapshot)

| Metrik | Değer |
|--------|------:|
| Toplam ürün | ~15 611 |
| Geçerli foto yok | ~2 |
| Tek geçerli foto | ~15 512 (%99+) |
| 2+ geçerli foto (jpg/png/webp) | ~97 |
| `cafemarkt_url` olan | ~7 759 |
| `kaynak_url` (üretici) | ~1 806 |

**En büyük tek-görsel markalar**

| Marka | Tek görsel | Not |
|-------|----------:|-----|
| Öztiryakiler | ~3 567 | ax-images + CafeMarkt script’leri hazır |
| İnoksan | ~962 | kısmi `inoksan_image_url` |
| Atalay | ~834 | cafemarkt / GMC `-B` script’i var |
| Proso | ~743 | çoğunlukla 1 jpg + svg/pdf (GMC’ye sayılmaz) |
| Empero | ~685 | CafeMarkt URL yoğun |
| Electrolux | ~685 (+47 multi) | resmi PDP / Mirror Doc |
| GastroPlast, Remta, Pimak, … | yüzlerce | marka sitesi / CafeMarkt |

**Mevcut araçlar (yeniden kullan)**

- CafeMarkt: `fetch-cafemarkt-plp-images.mjs`, `fetch-atalay-gmc-images.mjs`, `mirror-cafemarkt-witcdn-images.mjs`, `apply-cafemarkt-*-images.mjs`
- Ozti: `fetch-ozti-web-images.mjs`, `repair-ozti-plp-images.mjs`, ax-images
- Electrolux: `scrape-electrolux-professional.mjs` (çoklu `hero-N`)
- Genel: `fetch-missing-product-images.mjs`, `analyze-missing-images.mjs`, `check-catalog-images-deploy.mjs`
- Yayın: `npm run assets:s3:sync` → CloudFront; katalog `var/catalog/ekipmanlar.json` + dept rebuild

---

## 1. Başarı kriterleri

| Seviye | Tanım |
|--------|--------|
| **P0** | Feed + PDP’de ürün başına ≥2 **farklı gerçek** foto (veya 1 gerçek + kaliteli 2. açı) — skor kartı “Tamamlanmadı” kalksın |
| **P1** | Ortalama ≥3 gerçek foto / ürün (GMC “Good” bandı) |
| **P2** | Ortalama ≥4–5; premium markalarda 5–8 (Exceptional hedefi) |
| **Kalite** | min **800×800** (GMC güvenli); stub/wireframe/logo yok; yanlış varyant yok |
| **Operasyon** | Her görsel: kaynak URL + indirilme zamanı + SHA256 rapor JSON’da |

Sentetik kırpım P0’ı sayısal olarak şişirebilir; Google uzun vadede gerçek açıları tercih eder. Bu planın çıktısı **katalog `images[]` içinde gerçek dosyalar** olmalıdır.

---

## 2. Kaynak önceliği (güven → kapsam)

Sadece bu sırayla ara; rastgele web araması / rakip site kapma **son çare** ve manuel onay ister.

1. **Üretici resmi site / DAM**  
   Electrolux Mirror, Ozti ax-images, İnoksan, Rational, Hoshizaki, Vitrum, …  
2. **CafeMarkt ürün sayfası galerisi** (`cafemarkt_url` → witcdn `-B` / `-O`, asla yalnız `-K`)  
3. **Markanın kendi TR/EN katalog PDF’inden çıkarılmış foto** (mevcut extract script’leri)  
4. **Yetkili distribütör / markanın açık CDN’i** (Shopify, scene7, cloudinary marka hesapları)  
5. **Manuel / AI Product Studio** — eşleşmeyen veya tek-foto kalanlar için (IPTC AI metadata zorunlu)

**Yasak / riskli**

- Yanlış SKU / kardeş model fotoğrafı (GMC “yanlış görsel” cezası)
- Logo, watermark, fiyat şeridi, stub (~10 KB UNOX tipi)
- Rakip marketplace ekran görüntüsü
- Aynı dosyanın yeniden adlandırılmış kopyası “ek görsel” diye saymak

---

## 3. Pipeline (her marka / her batch için aynı)

```
① AUDIT          → gap raporu (SKU, brand, #foto, kaynak URL, boyut)
② DISCOVER       → aday URL listesi (üretici / CafeMarkt / PDF)
③ DOWNLOAD       → public/images/catalog/{brand}/…  (≥800px, sharp)
④ QA             → boyut, stub hash, perceptual benzerlik, SKU eşlemesi
⑤ APPLY          → images[] güncelle (ekipmanlar + dept); rapor JSON
⑥ SYNC           → aws s3 sync / npm run assets:s3:sync
⑦ VERIFY         → feed additional_image_link + canlı PDP galeri + 404 taraması
⑧ INDEX (ops.)   → search:index
```

### 3.1 Yeni birleşik orchestrator (yapılacak)

Tek giriş noktası önerisi:

```bash
# Faz 1 — sadece rapor
npm run catalog:images:enrich -- --audit-only --out=scripts/data/image-enrich/audit.json

# Faz 2 — keşif (indirme yok)
npm run catalog:images:enrich -- --discover --source=cafemarkt,manufacturer --limit=500

# Faz 3 — indir + uygula (dry-run)
npm run catalog:images:enrich -- --apply --dry-run --brand=Empero --min-photos=3

# Faz 4 — yaz + S3
npm run catalog:images:enrich -- --apply --brand=Empero --min-photos=3
npm run assets:s3:sync
```

Script iskeleti: `scripts/enrich-product-gallery-images.mjs`  
Raporlar: `scripts/data/image-enrich/`  
Ortak lib: `scripts/lib/image-enrich/` (`audit.mjs`, `discover-cafemarkt.mjs`, `discover-manufacturer.mjs`, `qa.mjs`, `apply.mjs`)

Mevcut marka script’leri silinmez; orchestrator onları çağırır veya mantığı paylaşır.

---

## 4. Fazlar (öncelik sırası)

### Faz A — Envanter & ölçüm (kod: audit)

- Tüm satırlar: geçerli foto sayısı, min kenar (HEAD/CDN probe örneklem), `cafemarkt_url` / `kaynak_url` varlığı
- Çıktı: `audit.json` + marka bazlı CSV
- KPI panosu: “kaç üründe 0 / 1 / 2+ gerçek foto”

### Faz B — CafeMarkt galeri hasadı (yüksek ROI)

Kapsam: `cafemarkt_url` olan ~7.8k ürün.

1. PDP HTML’den ürün slug’ına bağlı witcdn ID’lerini topla (`-B` tercih)
2. Yerelde / CDN’de olmayanları indir → `images/catalog/cafemarkt/…` veya marka klasörü
3. `images[]` içine ana görselden sonra ekle (max 10)
4. Probe’a göre ~%10–20’sinde 2+ galeri var; önce **Faema, Santos, Dito Sama, Animo, Robot Coupe, Electrolux CM, premium ithal**

Beklenen etki: birkaç yüz – ~1k üründe gerçek multi-foto.

### Faz C — Üretici siteleri (marka paketleri)

| Sıra | Marka | Kaynak | Mevcut kanca |
|-----:|-------|--------|----------------|
| 1 | Electrolux | PDP + Mirror Doc `PH_*` | scrape + fetch-missing |
| 2 | Öztiryakiler | ax-images + web + CafeMarkt | fetch-ozti-web / plp |
| 3 | Atalay | CafeMarkt `-B` GMC | fetch-atalay-gmc-images |
| 4 | İnoksan | web + CafeMarkt | inoksan script’leri |
| 5 | Empero / Remta / GastroPlast / … | CafeMarkt + marka sitesi | CM import pattern |
| 6 | Proso / Çağlayan | üretici galeri / çizim dışı foto | market-reyon patch |
| 7 | Vosco / Pimak / Yuksel | PDF extract + web | mevcut extract script’leri |

Her marka paketi: `--brand=X --limit=N --dry-run` ile başlar; QA eşiğini geçmeden `images[]` yazılmaz.

### Faz D — PDF / katalog geri dönüşümü

Zaten indirilmiş PDF sayfa görselleri varsa ürün koduyla yeniden eşleştir (Ozti/Atalay/Yüksel/Senox extract).  
“Teknik çizim” ana görsel olmaz; ek görsel olarak yalnızca net ürün foto ise eklenir.

### Faz E — Kalan boşluklar

- Eşleşmeyen SKU listesi → manuel queue (`scripts/data/image-enrich/manual-queue.json`)
- İsteğe bağlı: Google Product Studio / kontrollü AI açı (metadata zorunlu)
- Sentetik kırpım API yalnızca hâlâ 1 foto kalanlarda devrede kalır

---

## 5. Teknik kurallar

| Kural | Değer |
|-------|--------|
| Min çözünürlük | 800×800 (kabul 500×500, hedef 1000+) |
| Format | JPEG (mozjpeg q≈85–90) veya WebP |
| Yol | `images/catalog/{brand-slug}/…` — gitignore’da; S3 kaynak gerçeği |
| Katalog | `var/catalog/ekipmanlar.json` + ilgili `dept/*.json` (rebuild zinciri) |
| Feed | `collectGmcPhotoRels` zaten svg/pdf/kesit eler; gerçek ek foto otomatik `additional_image_link` olur |
| Rate limit | CafeMarkt / üretici: paralel ≤8, sleep 150–300 ms |
| Idempotent | aynı SHA varsa atla; `--force` ile yenile |

---

## 6. Doğrulama checklist

- [ ] `npm run feed:google:verify-images`
- [ ] Feed örneklem: `additional_image_link` oranı (≥2 görsel ürün %)
- [ ] Canlı: `https://equsto.com/api/gmc/img/detail?src=…` ve CDN 200
- [ ] PDP’de thumb sayısı ≥ hedef (gerçek dosyalar)
- [ ] `npm run catalog:deploy:check` (404 / küçük görsel)
- [ ] GMC Teşhis: görsel hataları / yanlış görsel uyarısı yok
- [ ] Skor kartı “Fırsat başına resimler” → en az **İyi / Fair+**

---

## 7. Riskler ve azaltma

| Risk | Azaltma |
|------|---------|
| Yanlış ürün fotoğrafı | SKU/model needle skor + manuel spot-check (marka başına 20 örnek) |
| CafeMarkt rate-limit / blok | cache’li discover JSON; düşük paralellik; gece batch |
| S3’siz deploy | görseller git’te değil → sync olmadan 404; her apply sonrası `assets:s3:sync` |
| Katalog şişmesi | images[] max 10; duplicate URL/SHA drop |
| Telif | yalnızca üretici / yetkili kanal; belirsiz kaynak → manual queue |

---

## 8. Uygulama sırası (ilk sprint)

### Komutlar (hazır)

```bash
# Audit
npm run catalog:images:audit
# → scripts/data/image-enrich/audit.json + audit-gaps.csv

# CafeMarkt premium (dry-run)
npm run catalog:images:enrich:cm -- --premium --dry-run --limit=30

# CafeMarkt premium uygula + dept yaz + ekipmanlar rebuild
npm run catalog:images:enrich:cm:premium

# Görselleri CDN’e
npm run assets:s3:sync
```

Script’ler: `audit-product-images.mjs`, `enrich-cafemarkt-galleries.mjs`, `lib/image-enrich/*`

### Sonraki

1. Electrolux multi hero tamamla (Faz C.1)  
2. Ozti / Atalay mevcut script’leri `min-photos=3`  
3. Empero + diğer CM yoğun markalar  
4. Haftalık audit cron / catalog-agent (opsiyonel)

---

## 9. İlgili dosyalar

- Plan: bu dosya  
- GMC köprü: `docs/GOOGLE-MERCHANT-CENTER.md`, `lib/gmc-additional-images.ts`  
- Sync: `npm run assets:s3:sync`, `docs/HETZNER-DEPLOY.md`  
- Katalog zinciri: `docs/KATALOG-MASTER-ZINCIR.md`
