# Pimak.com ürün verisi

Kaynak: https://www.pimak.com/

## Çekme

```powershell
node "C:\D Disk\EQUSTO-WORK\PFOS\veri\pimak\scrape-pimak.mjs"
```

Seçenekler:

| Flag | Açıklama |
|------|----------|
| `--limit 20` | İlk N ürün (test) |
| `--resume` | Sadece eksik/hatalı JSON’ları çek (checkpoint’te “done” olsa bile) |
| `--fresh` | Checkpoint sıfırla |
| `--no-images` | Görsel indirme yok |
| `--delay 500` | İstek arası ms (varsayılan 400) |

## Çıktılar

| Dosya | İçerik |
|-------|--------|
| `products-tr.json` | Tüm ürünlerin özeti |
| `urun-sayfalari/{slug}.json` | Tam detay: açıklama, teknik tablo, görseller |
| `media/images/` | İndirilen ürün görselleri |
| `scrape-checkpoint.json` | Yarım kalan çekim için |

## Not

Siteye saygılı tarama: sitemap + gecikme. Ticari kullanım için Pimak ile lisans/izin kontrol edin.
