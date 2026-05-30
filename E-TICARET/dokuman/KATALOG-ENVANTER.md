# Katalog envanteri ve tekrarlar

Otomatik uretim: `scripts/inventory-katalog-tekrarlar.py`

## 1. Ana veri kokleri

| Kok | Dosya | Boyut | dept sayisi |
|-----|-------|-------|-------------|
| `site` | 169 | 125.6 MB | 13 |
| `legacy-public` | 11,748 | 2652.9 MB | 13 |
| `veri-public-data` | 169 | 125.6 MB | 13 |
| `equsto-v2` | 169 | 125.6 MB | 13 |
| `cursor-public` | 11,748 | 2652.9 MB | 13 |

## 2. Birebir kopya ciftleri

- **site = equsto-v2** — ayni dosya sayisi ve boyut (tam kopya)
- **site = veri-public-data** — ayni dosya sayisi ve boyut (tam kopya)
- **legacy-public = cursor-public** — ayni dosya sayisi ve boyut (tam kopya)

## 3. Anahtar katalog dosyalari (hash)

| Dosya | site | legacy-public | veri-public-data | equsto-v2 | cursor-public |
|-------|---|---|---|---|---|
| ekipmanlar.json | ae79a737c156 (5689) | 9df100be622d (581) | ae79a737c156 (5689) | ae79a737c156 (5689) | 9df100be622d (581) |
| ekipmanlar-lite.json | — | — | — | — | — |
| pfos-zone-catalog.json | 9c205566ed5c (keys:5) | 8743e7ba8e8f (keys:5) | 9c205566ed5c (keys:5) | 9c205566ed5c (keys:5) | 8743e7ba8e8f (keys:5) |
| pfos-katalog-olcu-mm.json | 94ca6fcce580 (keys:3) | — | 94ca6fcce580 (keys:3) | 94ca6fcce580 (keys:3) | — |

> `pfos-katalog-olcu-mm.json` — tum kopyalarda **ayni hash**

| vitrum-bars-catalogue.json | 386ef9d9b3be (products:42) | f0bdfcae68c4 (products:42) | 386ef9d9b3be (products:42) | 386ef9d9b3be (products:42) | f0bdfcae68c4 (products:42) |
| pfos-all-day-dining-referanslar.json | d0b247d67283 (referanslar:2) | — | d0b247d67283 (referanslar:2) | d0b247d67283 (referanslar:2) | — |

> `pfos-all-day-dining-referanslar.json` — tum kopyalarda **ayni hash**

| pfos-s13-388-referanslar.json | 54247bcedaf8 (keys:5) | — | 54247bcedaf8 (keys:5) | 54247bcedaf8 (keys:5) | — |

> `pfos-s13-388-referanslar.json` — tum kopyalarda **ayni hash**

| pfos-coffee-shop-referanslar.json | 8d0e9e17628b (referanslar:3) | — | 8d0e9e17628b (referanslar:3) | 8d0e9e17628b (referanslar:3) | — |

> `pfos-coffee-shop-referanslar.json` — tum kopyalarda **ayni hash**


## 4. Dept (kategori) JSON — site vs legacy

**Onemli:** Canli site dept dosyalari legacy'den **daha guncel ve dolu**. Legacy'deki `dept/*.json` cogu bos/eski; asil gorsel havuzu `legacy-public/data/images/` altinda.

| Dept | Site urun | Legacy urun | Not |
|------|-----------|-------------|-----|
| araba | 9 | 9 | esit |
| davlumbaz | 152 | 0 | **site'de var** |
| dolap | 92 | 6 | **site'de var** |
| hazirlik | 93 | 0 | **site'de var** |
| icecek | 34 | 0 | **site'de var** |
| istif | 147 | 0 | **site'de var** |
| kahve | 36 | 0 | **site'de var** |
| pisirme | 1318 | 566 | **site daha guncel** |
| set-ustu-mutfak | 2436 | 1767 | **site daha guncel** |
| sogutma | 288 | 0 | **site'de var** |
| tasima | 138 | 0 | **site'de var** |
| tezgah | 876 | 0 | **site'de var** |
| yikama | 157 | 0 | **site'de var** |

### Sadece site'de olan dosyalar (23) — yukleme/koruma listesi

- PFOS: `pfos-all-day-dining-referanslar.json`, `pfos-s13-388-referanslar.json`, `pfos-coffee-shop-referanslar.json`, `pfos-katalog-olcu-mm.json`, `pfos-zone-proje-kurallari.json`, `pfos-referans-projeler.json`, `pfos-archive-extract.json`
- Atalay: `atalay-pdf-catalog.json`, `atalay-doner-ocak.json`
- Vitrum/Besos: `vitrum-besos-prices.json`, `vitrum-bars-hero-video.json`
- Diger: `proje-akis.json`, `ekipmanlar.json.legacy-off`, `referans-pilot/*`

## 4b. Sadece legacy-public'te olan icerik (site'e yuklenebilir aday)

Toplam **11.602 dosya** site'de yok. Ana gruplar:

| Grup | Dosya | Boyut | Aciklama |
|------|-------|-------|----------|
| `images/` | 7.665 | ~1.490 MB | Genel urun gorsel havuzu |
| `oztiryakiler-images/` | 3.631 | ~801 MB | Oztiryakiler gorselleri |
| `fiyat-listeleri/` | 123 | ~2.7 MB | Fiyat listesi arsivi |
| `caglayan-market/` | 64 | ~3.3 MB | Caglayan sogutma katalog |
| `cocktailstations-images/` | 40 | ~5.2 MB | Bar/cocktail gorseller |
| `images-oztiryakiler-pilot/` | 10 | ~1.4 MB | Ozti pilot gorseller |
| `ekipmanlar.backup-*` | ~15 | ~120 MB | Eski ekipmanlar yedekleri |
| `ekipmanlar1.json`, `.csv` | 2 | — | Alternatif katalog export |

### Sadece legacy-public'te olan dept'ler

| Dept | JSON | Gorsel (~) |
|------|------|------------|

## 5. Site dept ozeti (canli v2 — `dept/*.json`)

| Dept | Urun sayisi | Boyut |
|------|-------------|-------|
| araba.json | 9 | 7 KB |
| davlumbaz.json | 152 | 306 KB |
| dolap.json | 92 | 177 KB |
| hazirlik.json | 93 | 177 KB |
| icecek.json | 34 | 66 KB |
| istif.json | 147 | 302 KB |
| kahve.json | 36 | 74 KB |
| pisirme.json | 1318 | 2043 KB |
| set-ustu-mutfak.json | 2436 | 4640 KB |
| sogutma.json | 288 | 555 KB |
| tasima.json | 138 | 258 KB |
| tezgah.json | 876 | 1916 KB |
| yikama.json | 157 | 304 KB |

**Toplam dept urun:** ~5.676 satir (bazi urunler coklu dept'te olabilir)  
**Ana indeks:** `ekipmanlar.json` = **5.689 urun** (site/legacy farkli surum)

## 6. Disk tekrar ozeti

| Konum | Dosya | MB | Rol |
|-------|-------|-----|-----|
| `site/public/data` | 169 | 126 | **Canli katalog (tek kaynak)** |
| `veri/public-data` | 169 | 126 | site ile birebir kopya — silinebilir |
| `equsto-v2/public/data` | 169 | 126 | eski yol — Faz 3 |
| `legacy-public/data` | 11.748 | 2.653 | **Gorsel + arsiv havuzu** |
| `CURSOR/public/data` | 11.748 | 2.653 | legacy ile birebir kopya |
| `.deploy-stage*` + paketler | ~34.000 | ~8.119 | deploy anlik kopyalari — silinebilir |
| `arşiv/Equsto-ömer` | 4 | 2.169 | Omer/Ozti arsiv zip |
| `caglayan-sogutma-catalog-export` | 697 | 455 | Caglayan import adayi |
| `external/` | 886 | 311 | Dis kaynak dosyalar |

## 7. Eski deploy / paket klasorleri (CURSOR kok)

| Klasor | Dosya | MB | ekipmanlar.json |
|--------|-------|-----|----------------|
| `EQUSTO-SITE-PAKET` | 21,620 | 4155.4 | evet |
| `EQUSTO16052026` | 6,482 | 1561.8 | evet |
| `.deploy-stage (7)` | 748 | 298.6 | evet |
| `.deploy-stage (6)` | 479 | 190.2 | evet |
| `.deploy-stage (3)` | 468 | 189.7 | evet |
| `.deploy-stage (2)` | 468 | 189.7 | evet |
| `.deploy-stage (5)` | 461 | 189.6 | evet |
| `.deploy-stage (4)` | 463 | 189.6 | evet |
| `.deploy-stage (1)` | 456 | 189.4 | evet |
| `.deploy-stage (11)` | 332 | 151.2 | evet |
| `.deploy-stage` | 344 | 144.7 | evet |
| `.deploy-stage (8)` | 209 | 138.0 | evet |
| `bar-design` | 217 | 92.6 | evet |
| `.deploy-stage (9)` | 169 | 92.3 | evet |
| `.deploy-stage (10)` | 156 | 79.7 | hayir |
| `deploy-live-pfos-besos` | 165 | 77.6 | hayir |
| `.besos-deploy-stage` | 93 | 54.0 | hayir |
| `.deploy-stage (16)` | 143 | 50.4 | hayir |
| `.deploy-stage (12)` | 187 | 49.7 | hayir |
| `.deploy-stage (15)` | 93 | 31.9 | hayir |
| `.deploy-stage (14)` | 103 | 25.4 | hayir |
| `.deploy-stage (13)` | 46 | 21.0 | hayir |
| `.deploy-stage-api (8)` | 8 | 2.7 | hayir |
| `.deploy-stage-api (12)` | 8 | 2.7 | hayir |
| `.deploy-stage-api (10)` | 8 | 2.7 | hayir |
| `.deploy-stage-api (9)` | 8 | 2.7 | hayir |
| `.deploy-stage-api (11)` | 8 | 2.7 | hayir |
| `.deploy-stage-api (7)` | 9 | 2.6 | hayir |
| `.deploy-stage-canli-guncel` | 12 | 2.1 | hayir |
| `.deploy-market-reyon` | 51 | 2.1 | hayir |
| `.mobil-patch-stage` | 6 | 1.9 | hayir |
| `.deploy-stage-mutbex-home` | 4 | 1.8 | hayir |
| `.deploy-stage-sepet-sync (5)` | 10 | 1.8 | hayir |
| `.deploy-stage-sepet-sync (4)` | 7 | 1.7 | hayir |
| `.deploy-stage-sepet-sync (2)` | 7 | 1.7 | hayir |

## 8. ekipmanlar.json kopyalari (hash gruplari)


### Grup 1 — hash `6cc889d4e8d2` (9 kopya)

- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (9)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (8)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (7)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (6)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (5)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (4)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (3)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (2)\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (11)\data\ekipmanlar.json`

### Grup 2 — hash `ae79a737c156` (5 kopya)

- `C:\D Disk\EQUSTO-CURSOR\EQUSTO-WORK\E-TICARET\veri\public-data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\EQUSTO-WORK\E-TICARET\site\public\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\equsto-v2\public\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-WORK\E-TICARET\veri\public-data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\ekipmanlar.json`

### Grup 3 — hash `5393be414f5a` (4 kopya)

- `C:\D Disk\EQUSTO-CURSOR\EQUSTO-WORK\BESOS\kaynaklar\bar-design\EQUSTO-BAR-DESIGN-PAKET\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\EQUSTO-SITE-PAKET\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\bar-design\EQUSTO-BAR-DESIGN-PAKET\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-WORK\BESOS\kaynaklar\bar-design\EQUSTO-BAR-DESIGN-PAKET\data\ekipmanlar.json`

### Grup 4 — hash `9df100be622d` (3 kopya)

- `C:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\EQUSTO-WORK\E-TICARET\legacy-public\data\ekipmanlar.json`
- `C:\D Disk\EQUSTO-WORK\E-TICARET\legacy-public\data\ekipmanlar.json`

### Grup 5 — hash `795678d2538a` (3 kopya)

- `C:\D Disk\EQUSTO-CURSOR\EQUSTO16052026\EQUSTO-CURSOR\.tmp-ozti-import\Equsto\Öztiryakiler\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\arşiv\Equsto-ömer\Öztiryakiler\ekipmanlar.json`
- `C:\D Disk\EQUSTO-CURSOR\.tmp-ozti-import\Equsto\Öztiryakiler\ekipmanlar.json`

### Grup 6 — hash `252d5e839d76` (1 kopya)

- `C:\D Disk\EQUSTO-CURSOR\dist\data\ekipmanlar.json`

### Grup 7 — hash `b27100b546af` (1 kopya)

- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage (1)\data\ekipmanlar.json`

### Grup 8 — hash `2084b67da4e2` (1 kopya)

- `C:\D Disk\EQUSTO-CURSOR\.deploy-stage\data\ekipmanlar.json`

## 9. Onerilen tek kaynaklar (Faz 3 oncesi)

| Amac | Tek kaynak | Not |
|------|------------|-----|
| Canli Next.js katalog | `E-TICARET/site/public/data` | Vercel buradan |
| Tam statik arsiv (dept+gorsel) | `E-TICARET/legacy-public/data` | 2,6 GB, yukleme havuzu |
| PFOS listeler | `PFOS/listeler` + site `public/data/pfos-*` | ayna |
| Silinebilir aday | `.deploy-stage*`, `EQUSTO-SITE-PAKET`, `veri/public-data` | ~8+ GB tekrar |
| Yukleme adaylari | `legacy-public/data/images`, `oztiryakiler-images`, `caglayan-market`, `caglayan-sogutma-catalog-export`, `external/` | site'e import oncesi incele |
| Eski kod kopyasi | `EQUSTO-CURSOR/equsto-v2` | Faz 3 |