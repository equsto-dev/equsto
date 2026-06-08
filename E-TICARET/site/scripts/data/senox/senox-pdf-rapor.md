# Senox PDF katalog çıkarım raporu

Kaynak: `c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf` (55 sayfa, ~221 MB)  
Web karşılaştırma: [senox.com.tr/tr](https://senox.com.tr/tr) — **63 ürün**

Tarih: 2026-06-08

---

## Özet

| Kaynak | Ürün | Görsel | Ölçü | Fiyat |
|--------|------|--------|------|-------|
| Web scrape | 63 | 63 | 45 | 0 (EUR/TL yok) |
| **PDF 2026-1** | **115** | **106** (xref söküm) | **68** | **73** (EUR) |

PDF, web sitesinin yaklaşık **2×** üstünde SKU içeriyor; fiyat ve teknik tablo verisi de burada.

---

## Görsel formülü — kırpım değil, xref sökümü

Öztiryakiler/Atalay scriptlerindeki sayfa `clip` kırpımı **kullanılmıyor**. Yüksel PDF pipeline'ındaki yöntem uyarlandı:

```
1. Filtre   → page.get_image_info(xrefs=True)
              • Tam sayfa arka planları at (alan > %55 sayfa)
              • Banner şeritleri at (en/boy > 6.5)
              • Min 70×70 px, min 8000 px²

2. Anchor   → search_for(model) + katalog anchorY
              • Model metninin bbox'ı

3. Eşleşme  → Skor = yatay mesafe + dikey boşluk
              • Foto modelin solunda/üstünde
              • Metnin sağındaki tablo görselleri cezalandırılır
              • Aynı sayfada N model × M foto → yatay sıra eşlemesi

4. Söküm    → doc.extract_image(xref)
              • PDF stream'inden orijinal JPEG/PNG
              • Sayfa render / clip YOK
              • embed/x{xref}.jpg + senox-{model}_1.jpg kopyası
```

**Neden kırpım değil?** Katalog sayfalarında ürün fotoğrafları ayrı xref olarak gömülü; `extract_image` tam çözünürlüklü dosyayı verir. Sayfa kırpımı caption/tabloyu keser veya komşu ürünle karışır.

---

## Kategori dağılımı (PDF)

| Kategori | Adet |
|----------|------|
| Genel (iç sayfa — başlık eşlemesi iyileştirilebilir) | 75 |
| Mikser / hazırlık | 12 |
| Dondurma reyonları | 8 |
| Su sebilleri | 7 |
| Derin dondurucular | 4 |
| Minibar / otel | 3 |
| El blenderleri | 3 |
| Kahve | 3 |

---

## Görseli eşleşmeyen (9 SKU)

- BBCS-350
- SNX12R
- 3 raflı / 2 raflı pasta teşhir modülleri (metin anchor zayıf)
- Selex tartım terazisi

Bunlar çoğunlukla aynı sayfada çoklu varyant veya görsel olmayan tablo satırı.

---

## Çıktı dosyaları

| Dosya | İçerik |
|-------|--------|
| `scripts/data/senox/senox-pdf-catalog.json` | 115 ürün — model, ölçü, EUR fiyat, açıklama, sayfa |
| `scripts/data/senox/pdf-images-map.json` | Model → xref eşleme manifest |
| `scripts/data/senox/images/embed/x*.jpg` | 104 benzersiz gömülü görsel |
| `scripts/data/senox/images/senox-*_1.jpg` | Model alias dosyaları |
| `scripts/extract-senox-pdf-catalog.py` | Metin + spec parser |
| `scripts/extract-senox-pdf-images.py` | Xref söküm + eşleme |

---

## Komutlar

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"

# 1) Katalog metni + fiyat + ölçü
python scripts/extract-senox-pdf-catalog.py

# 2) Gömülü görseller (xref)
python scripts/extract-senox-pdf-images.py

# Test (görsel yazmadan)
python scripts/extract-senox-pdf-images.py --dry-run
```

PDF yolu override:

```powershell
$env:SENOX_PDF = "c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf"
```

---

## Sonraki adımlar (onay gerekir)

1. Kategori başlık eşlemesini iyileştir (içindekiler sayfa numaraları → bölüm adı)
2. `public/data/dept` veya fiyat listesi JSON'a import
3. Web scrape (63) + PDF (115) birleşik master katalog
4. 9 eksik görsel için komşu xref veya manuel eşleme
