# Atalay döner ocakları (2025 katalog)

Kaynak: `ATALAY 2025 YERLİ.pdf` — **yalnızca Döner Makineleri** (sayfa 129–144).  
Robot, kalıp, lift ve aksesuar **dahil değil**.

## Fiyat kuralı

- Katalog fiyatı: **EURO** (PDF liste)
- Site: **%40 iskonto** → `site_euro = katalog × 0.6`
- TL: `site_tl = site_euro × TCMB efektif satış` — canlı: `GET /api/kur` (bkz. `docs/TCMB-KUR.md`)
- Yedek: `EQUSTO_EUR_TRY_FALLBACK` (TCMB erişilemezse)

Örnek ADG-4S: 690 EUR → 414 EUR → **14.904 TL** (36 kur)

## Veri dosyaları

| Dosya | Açıklama |
|-------|----------|
| `scripts/data/atalay-doner-ocak-source.mjs` | 47 model — elle doğrulanmış tablo |
| `scripts/data/atalay-doner-ocak.json` | Üretilmiş katalog + TL fiyat |
| `public/data/atalay-doner-ocak.json` | Mağaza / referans kopyası |
| `public/data/fiyatlar.json` | Model + slug → TL (yalnız döner) |

## Komutlar

```cmd
cd /d "C:\D Disk\EQUSTO-CURSOR\equsto-v2"
copy .env.local .env
npm run catalog:atalay:pdf
npm run db:seed:doner
```

**Vitrin:** `npm run catalog:atalay:build` — PDF’ten gelen Atalay satırlarını `dept/*.json` içine yazar; `ekipmanlar.json` kullanılmaz. Bkz. `docs/ATALAY-PDF-KATALOG.md`.

Canlı Supabase için aynı seed’i Vercel env ile lokalden çalıştırın veya CI’dan `db:seed:doner`.

## Görseller

PDF’ten çıkarım:

```cmd
pip install pymupdf pillow
npm run catalog:doner:images
```

- Dosyalar: `public/images/catalog/atalay/doner/atalay-{model}.jpg` (47 adet)
- Kaynak: `scripts/extract-atalay-doner-images.py` (sayfa 129–144)

## Eski katalog

`public/data/ekipmanlar.json` → `ekipmanlar.json.legacy-off` (devre dışı).  
`/api/urunler` önce **Supabase DB** döner.

## Alanlar (admin / specs)

- `el_guc` — elektrikli modeller (kW)
- `gaz_guc` — gazlı: `LPG x kW · NG y kW`
- `radyan`, `voltaj`, `section` (specs JSON)
