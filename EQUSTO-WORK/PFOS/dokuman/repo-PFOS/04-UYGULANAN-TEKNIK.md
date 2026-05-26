# Uygulanan teknik değişiklikler (repo)

Bu bölüm **kodda yapılmış** işleri listeler (plan değil).

---

## Referans motoru

| Değişiklik | Dosya |
|------------|--------|
| THC Bakü + Kayseri JSON | `public/data/pfos-all-day-dining-referanslar.json` |
| S13-388 JSON (turk + all-day) | `public/data/pfos-s13-388-referanslar.json` |
| All day referans loader | `lib/pfos/referans/all-day-dining/` |
| Türk restoran → S13 şablon | `lib/pfos/referans/turk-restoran/index.ts` |
| `turk-restoran` template | `lib/pfos/core/rules/turk-restoran/template.ts` |
| S13 shared loader | `lib/pfos/referans/s13-388.ts` |
| `ReferansKalem.tip` | `lib/pfos/referans/referans-types.ts` |
| Template’e tip aktarımı | `lib/pfos/referans/build-template-items.ts` |
| Türk restoran zone kapatma | `lib/pfos/wizard/profiles.ts` → `pfosZones: []` |

---

## Ölçü / katalog

| SKU / tip | Düzeltme |
|-----------|----------|
| `7890.60400.3T` combi | 805×828×471 mm |
| `9584.00MDX.00` | 240×390×620 mm |
| `9805.ODB14.0A` buz | mm map |
| `8919.BBC35.00` bar şişe soğutucu | 1350×505×850 mm |
| `bar_buzdolabi` eşleşme | şişe soğutucu kuralları |

Dosyalar: `pfos-katalog-olcu-mm.json`, `olcu-mm.ts`, `shop-catalog-match.ts`, `pfos-tip-shop-links.json`, `format-v14.ts`

Tepsi kapasitesi metni ölçü sütunundan filtrelenir (`isTepsiKapasiteMetni`).

---

## Kur

- `TEKLIF_V14_EUR_TRY_URL = "/api/kur"`
- `fetch-kur.client.ts` — wizard + Excel export
- `PfosProWizard` — kur banner, yenile

---

## UI (yönetim / teklif)

| Öğe | Değişiklik |
|-----|------------|
| v14 kullanıcı metni | Kaldırıldı |
| Katalog alt satırı / Kaynak kolonu | Kaldırıldı |
| kW 0 | Boş gösterim |
| Bölüm satırları | `#e6f4ea` |
| Form no | `EQS-TKL-001` |

Bileşenler: `TeklifV14Proforma.tsx`, `PfosTeklifProTable.tsx`, `pfos/page.tsx`, `BolumM2Step.tsx`

---

## Script’ler

| Script | Çıktı |
|--------|--------|
| `build-all-day-dining-referanslar.py` | `pfos-all-day-dining-referanslar.json` |
| `build-s13-388-referanslar.py` | `pfos-s13-388-referanslar.json` |
| `extract-pfos-referans-projeler.py` | `pfos-referans-projeler.json` (+ 2017-073) |

---

## Motor test (örnek)

```bash
npm run pfos:motor:test
```

- `all-day-dining-cafe` @ 280 m² → 42 kalem, ~41 eşleşme  
- `turk-restoran` @ 200 m² → 40 kalem (32 zorunlu + 8 tavsiye), shop+zone eşleşme kısmi (MEVCUT satırlar, özel ekipman)

---

## İç adlandırma (geliştirici)

Dosya/tip adlarında hâlâ `TeklifV14*`, `v14` geçebilir; **kullanıcı arayüzünde** v14 yok.
