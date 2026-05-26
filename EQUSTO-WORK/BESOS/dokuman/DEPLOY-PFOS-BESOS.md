# PFOS + BESOS → equsto.com yükleme

## Hazır paket (canlıya atılacak)

Klasör: **`C:\D Disk\EQUSTO-CURSOR\deploy-live-pfos-besos\`**

- Çekirdek: `pfos.html`, `bar-design.html`, tüm `pfos-*.js`, BESOS JS, vitrum JSON
- Yedek **EQUSTO16052026**’dan: `data/pfos-key-to-kategori.json`, `data/advanced-cuisine-clear-ice/`, `data/vitrum-drawings/`, `images/besos/`

Yenilemek:

```powershell
cd "C:\D Disk\EQUSTO-CURSOR"
powershell -ExecutionPolicy Bypass -File scripts\merge-backup-pfos-besos.ps1
```

cPanel → `public_html` → bu klasörün **içeriğini** (klasörün kendisini değil) sürükleyip üzerine yazın.

---

**Not:** EQUSTO16052026 yedeğinde `pfos.html` / `bar-design.html` **yok** (sadece veri+görsel). HTML/JS pakette equsto.com’dan alınmış kopyalardan gelir.

## Yerelde ne yapıldı

`C:\D Disk\EQUSTO-CURSOR\public\` ve `equsto-v2\public\` içine equsto.com’dan **50 dosya** indirildi (PFOS motorları, bar-design, vitrum JSON, görseller).

Tekrar indirmek için:

```powershell
cd "C:\D Disk\EQUSTO-CURSOR"
powershell -ExecutionPolicy Bypass -File scripts\restore-pfos-besos-from-live.ps1
```

## Canlı siteyi düzeltmek (sizin yapmanız gereken)

Hosting (cPanel) → **Dosya Yöneticisi** → `public_html`

Şu dosyaları yerel `public\` ile **üzerine yazın** (FTP/FileZilla da olur):

| Dosya / klasör | Neden |
|----------------|--------|
| `pfos.html` | Proje Fabrikası sayfası |
| `bar-design.html` | BESOS ana sayfa |
| `besos/index.html` | /besos yönlendirme |
| `equsto-engine.js`, `pfos-*.js`, `equsto-pricing-core.js` | PFOS çalışması |
| `eq-bar-design-vitrum.js`, `eq-besos-head-seo*.js`, `eq-bar-module*.js` | BESOS vitrin |
| `data/pfos-*.json`, `data/vitrum-bars-landing.json`, `data/vitrum-bar-projects.json` | Veri |
| `assets/besos-ice-*.png` | BESOS görselleri |
| `og-cover-besos.jpg` | Sosyal paylaşım görseli (yeni) |
| `theme.css`, `theme.js`, `nav.js` | Ortak kabuk |

Tam liste: `deploy-pfos-besos-manifest.txt`

## Kontrol (yükleme sonrası)

Tarayıcıda hard refresh (Ctrl+F5):

- https://equsto.com/pfos
- https://equsto.com/besos → bar-design

F12 → **Network** → kırmızı 404 olmamalı; özellikle `equsto-engine.js`, `eq-bar-design-vitrum.js`, `vitrum-bars-landing.json`.

## Bilgisayarda başka dosyalar

Silinen şey **tüm PC değil** — çoğunlukla `EQUSTO-CURSOR` içindeki `scripts/`, `dist/`, bazı JS dosyaları. Bunlar:

1. Bu restore script ile canlıdan
2. Windows **Geri Dönüşüm Kutusu** / **Dosya Geçmişi** / OneDrive sürüm geçmişi ile

GitHub’da yedek varsa: `git checkout` veya eski commit.
