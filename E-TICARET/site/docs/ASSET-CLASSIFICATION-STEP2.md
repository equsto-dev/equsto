# Adım 2 — Git / CDN / Repodan çıkar

Oluşturulma: 2026-05-30T12:26:47.443Z

Katalog JSON'dan tespit edilen görsel/PDF yolu: **8**

## public/ sınıflandırması (2159 MB toplam)

| Sepet | Dosya | MB | Açıklama |
|-------|------:|---:|----------|
| **GIT_KEEP** (Vercel deploy) | 199 | 52.8 | Kod, legacy JS/CSS, kritik JSON, i18n, sitemap |
| **CDN_MIGRATE** | 12955 | 2083.3 | images/ + büyük PDF/medya — object storage'a taşınacak |
| **REPO_REMOVE** | 10 | 23.3 | Yedek/arşiv/kilit dosyaları — repoda tutulmamalı |

## Repoda var, canlı deploy dışı (çıkarılacak)

| Yol | Dosya | MB | Not |
|-----|------:|---:|-----|
| `EQUSTO-WORK/E-TICARET/site` | 66267 | 3555.9 | Workspace mirror (deploy kökü değil) |
| `EQUSTO-WORK/PFOS/kaynaklar` | 449 | 437.6 | PFOS kaynak arşivi (.dwg, .bak, Excel) |
| `equsto-v2` | 10771 | 2696.8 | Eski alternatif site |
| `E-TICARET/veri` | 315 | 165.9 | Kaynak medya (prosogutma vb.) |

## CDN'e taşınacak — en büyük 20 dosya

- `data/caglayan-market/nergis-fg/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lb-fg/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lb-fg-sky/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lb-lm/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lb-tp/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lb-tp-sky/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-lm/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-sky/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-tp/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/nergis-tp-sky/Nergis.pdf` (10.34 MB)
- `data/caglayan-market/fulya-hf-fg/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-fg-sky/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-fl/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-lm/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-pn/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-tp/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-hf-tp-sky/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-nv-fg/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-nv-fg-sky/Fulya.pdf` (9.96 MB)
- `data/caglayan-market/fulya-nv-lm/Fulya.pdf` (9.96 MB)

## Repodan çıkar — public içi (ilk 15)

- `data/ekipmanlar.json.legacy-off` (12.2 MB)
- `data/ekipmanlar-full-archive.json` (10.46 MB)
- `data/pfos-archive-extract.json` (0.56 MB)
- `pdp-epdp-KILIT.txt` (0 MB)
- `prod-card-ambient-KILIT.txt` (0 MB)
- `footer-brand-KILIT.txt` (0 MB)
- `topnav-bar-design-KILIT.txt` (0 MB)
- `buzdolap-nav-KILIT.txt` (0 MB)
- `data/atalay-merge-log.json` (0 MB)
- `data/admin-auth.json` (0 MB)

## Uygulama fazları

### Faz A — Hemen (risk düşük, repo küçülür ~6856+ MB dış klasör)
- Repodan çıkar: mirror, PFOS arşiv, legacy-off/full-archive JSON, KILIT.txt dosyaları
- .gitignore güncelle; git rm --cached ile history'den kademeli temizlik (opsiyonel git filter-repo)

### Faz B — CDN (canlı davranış değişir, URL migration gerekir)
- CDN (Vercel Blob / R2): public/images/ (~1.5 GB) + büyük PDF klasörleri
- ekipmanlar.json içindeki image path'leri CDN base URL ile güncelle

### Faz C — Git'te kalır (değişmez)
- Git'te kal: app/, lib/, legacy JS/CSS, ekipmanlar.json, geo/proje-akis/i18n, küçük data JSON
- Build çıktıları: sitemap, en.json — commit veya CI artifact

---
JSON: `docs/asset-classification-step2.json`
