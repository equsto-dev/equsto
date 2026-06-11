# İnoksan 2026 — Equsto katalog import ön raporu

> Hazırlanma: 2026-06-08 · Commit/push yapılmadı (dry-run).

## 1. Kaynak dosyalar

| Kaynak | Durum | Not |
|--------|-------|-----|
| `İNOKSAN 2026 Yurtiçi Bayi Fiyatları R1.xlsx` | **Bulundu** (98 KB) | `c:\D Disk\FİYAT LİSTELERİ\` |
| [inoksan.com](https://inoksan.com/) | **Erişilebilir** | Ürünler AJAX ile yükleniyor |
| `iNOKSAN BAYI-FIYAT-LISTESI.pdf` | Mevcut (38 MB) | Yedek; öncelik Excel |
| Equsto `ekipmanlar.json` | **0 İnoksan satırı** | Sıfırdan import |

**Not:** Excel dosya adında Unicode birleştirici karakter var (`İNOKSAN`); scriptlerde `NFKD` normalizasyonu gerekli.

---

## 2. Fiyat listesi yapısı (Excel)

**Sayfa:** `Sayfa1` · **1306 ürün** (tümünde fiyat var)

| Kolon | Alan |
|-------|------|
| Ürün Hiyerarşisi 1–3 | Ana / alt kategori |
| **Malzeme** | SAP stok kodu (`INO-FKE20`, `INO-ABC100`, …) |
| Malzeme kısa metni | Kısa tanım |
| Uzunluk / Genişlik / Yükseklik (mm) | Ölçü |
| **A1 Bayi Fiyatı** | Liste fiyatı (**EUR**) |

### Kategori dağılımı (hiyerarşi 1)

- **Pişirici Cihazlar:** 479 ürün
- **Genel Aksesuar:** 335 ürün
- **Servis Hatları:** 298 ürün
- **Bulaşık Yıkama Makineleri:** 108 ürün
- **Fırınlar:** 38 ürün
- **Depolama ve İstifleme Üniteleri:** 32 ürün
- **Arabalar:** 9 ürün
- **Soğutucular:** 6 ürün
- **Tezgahlar:** 1 ürün

### Kod önekleri
- `INO-*`: 971 ürün (ana ekipman)
- `201/202/203/204/209-*`: 335 ürün (çoğunlukla **Genel Aksesuar** / yedek parça)

**Fiyat aralığı (liste EUR):** 1.26 – 25676.19 (ort. 1626)

---

## 3. Fiyat formülü (Equsto)

Kullanıcı tanımı:
- Alış: liste × **%77** (%23 iskonto)
- Satış: alış × **%110** (%10 kar)
- TL: canlı kur + **%20 KDV**

```
alis_eur      = liste_eur × 0.77
satis_eur     = alis_eur × 1.10    // = liste_eur × 0.847
fiyat_tl_net  = round(satis_eur × kur_eur_try)
fiyat_tl      = round(fiyat_tl_net × 1.20)
```

**Kısa çarpan:** `satis_eur = liste × 0.847`

Kur (mevcut katalog sabiti): **1 EUR = 53.2979 TRY**

### Örnek hesaplar

| Malzeme | Liste EUR | Alış EUR | Satış EUR | TL KDV dahil |
|---------|-----------|----------|-----------|--------------|
| `INO-ABC100` | 1844.28 | 1420.09 | 1562.10 | ₺99.908 |
| `INO-FKE006` | 3584.32 | 2759.93 | 3035.92 | ₺194.170 |
| `INO-FKE20` | 4982.47 | 3836.50 | 4220.15 | ₺269.910 |

*(Örnek: `INO-FKE20` web’de “FKE 20 Digital Panelli…” ile aynı ürün ailesi)*

---

## 4. inoksan.com veri çekme mimarisi

Site **ASP.NET + jQuery AJAX**. Ürün kartları statik HTML’de yok; partial endpoint’ten geliyor.

### 4.1 Kategori ürün listesi
```
GET https://inoksan.com/includes/urunler-cgty.asp
  ?altbolum=firinlar
  &altbaslik=konveksiyonlu-firinlar
  &katid=101
  &enkatid=1002
```
- Dönen HTML’de `/urun/{id}/{slug}` linkleri, galeri görselleri, kısa ölçü/spec listesi var.
- Test: `konveksiyonlu-firinlar` kategorisinde **14 ürün** kartı (partial HTML).

`katid` / `enkatid` / `altbolum` değerleri her kategori sayfasının JS’inde (`geturunlerpartial(...)`).

### 4.2 Ürün detay (PDP)
```
GET https://inoksan.com/urun/{id}/{slug}
```
Çekilecek alanlar:
- **Başlık** (`h1`, schema `name`)
- **Görseller:** `https://www.inoksan.com/imagesfolder/products/galeri/{id}/*.png`
- **Özellikler:** üst blok `<li><b>…</b>` listesi
- **Teknik tablolar:** “Genel Özellikler”, “Teknik Özellikler”, “Aksesuar”, “Ürün Hakkında” accordion
- **Breadcrumb** → Equsto `category` / `dept` eşlemesi

### 4.3 Arama API (şu an güvenilmez)
```
GET https://inoksan.com/urunara/?Aranan=...
```
Batch testlerinde **HTTP 500** döndü (curl, UA/Referer ile). SKU bazlı eşleştirme için **birincil yol değil**; kategori crawl + malzeme normalizasyonu kullanılmalı.

---

## 5. Excel ↔ web eşleştirme stratejisi

| Excel `Malzeme` | Web model | Eşleştirme |
|-----------------|-----------|------------|
| `INO-FKE20` | FKE 20 … | `INO-` kaldır → boşluk ekle (`FKE20` → `FKE 20`) → PDP başlık/slug |
| `INO-ABC100` | Banket arabası … | Kısa metin + kategori partial’da fuzzy |
| `202xxxx` aksesuar | Zayıf / yok | Sadece Excel metni + fiyat; görsel opsiyonel |

**Önerilen akış:**
1. Tüm leaf kategorileri crawl → `{malzeme_norm → product_id, slug, title}` indeksi
2. Excel satırını `malzeme` ile indekse bağla
3. Eşleşmeyenler için rapor (`fiyat_bekleniyor` veya manuel)
4. PDP’den teknik özellik + görselleri zenginleştir

Tahmini eşleşme:
- **INO-*** ana ürünler: **~85–95%** (isim normalizasyonu ile)
- **201–209** aksesuarlar: **~30–50%** (sitede ayrı PDP olmayabilir)

---

## 6. Equsto katalog modeli (hedef)

Her ürün için önerilen alanlar (Electrolux/Hoshizaki sync ile uyumlu):

```json
{
  "brand": "İnoksan",
  "name": "{web başlık veya kısa metin}",
  "sku": "INO-FKE20",
  "model": "INO-FKE20",
  "oem_brand": "İnoksan",
  "dept": "pisirme",
  "category": "konveksiyonlu-firinlar",
  "price": "₺… KDV dahil",
  "liste_fiyati_eur": 4982.47,
  "alis_fiyati_eur": 3836.50,
  "satis_fiyati_eur": 4220.15,
  "fiyat_kaynagi": "inoksan-fiyat-listesi-2026-r1",
  "images": ["images/catalog/inoksan/..."],
  "specs": "… teknik tablolar …",
  "olculer": { "genislik_mm": 1180, … }
}
```

### Dept eşlemesi (hiyerarşi 1)

| Excel hiyerarşi 1 | Equsto dept |
|-------------------|-------------|
| Pişirici Cihazlar / Fırınlar | `pisirme` |
| Bulaşık Yıkama Makineleri | `yikama` |
| Soğutucular | `sogutma` |
| Arabalar | `araba` veya `tasima` |
| Servis Hatları | `tezgah` / `market-reyon` |
| Depolama ve İstifleme | `istif` |
| Genel Aksesuar | `hazirlik` / `yardimci-ekipmanlar` |
| Tezgahlar | `tezgah` |

Marka hub: `/shop/marka/inoksan` (mevcut `eq-site-urls.js` tanımı var).

---

## 7. Uygulama planı (sonraki adım)

| # | Script | İş |
|---|--------|-----|
| 1 | `scripts/sync-inoksan-fiyat-2026.py` | Excel parse + fiyat + dept JSON patch |
| 2 | `scripts/fetch-inoksan-catalog.mjs` | Kategori partial + PDP crawl, görsel indir |
| 3 | `scripts/data/inoksan-2026-cache.json` | Eşleşme + ham PDP cache |
| 4 | `npm run catalog:inoksan:sync` | sync + rebuild-ekipmanlar |
| 5 | `npm run assets:s3:sync` | Görseller CDN |

**Tahmini süre:** 1–2 oturum (1306 SKU; crawl rate-limit ~2–4 saat batch).

---

## 8. Riskler

1. **`urunara` 500** — SKU araması batch’te çalışmıyor; kategori indeksi şart.
2. **Aksesuar SKU’ları** (~335) — PDP/görsel eksik kalabilir.
3. **Unicode dosya adı** — path çözümlemesinde NFKD kullanılmalı.
4. **Görsel boyutu** — galeri başına 3–8 PNG; S3 upload gerekir.
5. **Kur** — `EqustoKurLive` / TCMB ile Hoshizaki modeli aynı tutulmalı.

---

## 9. Sonuç

- Fiyat listesi **okunabilir ve 1306 ürün fiyatlandırılabilir**.
- Formül net: **`liste × 0.847 EUR` → KDV dahil TL**.
- Web’den **tanım, teknik özellik ve galeri görselleri** PDP + `urunler-cgty.asp` ile alınabilir.
- Equsto’da İnoksan **henüz yok**; tam import için script + crawl onayı sonrası uygulanabilir.

**Ham veri:** `scripts/data/trial/inoksan-xlsx-stats.json`, `inoksan-2026-xlsx.json`, `inoksan-partial.html`, `inoksan-pdp.html`
