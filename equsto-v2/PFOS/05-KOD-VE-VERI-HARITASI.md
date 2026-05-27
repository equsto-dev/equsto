# Kod ve veri haritası

---

## `lib/pfos/` — motor

```
lib/pfos/
├── api-handlers.ts          # GET concepts, POST quote
├── schemas/pfos.schema.ts   # Konsept enum, PFOSRequest
├── core/
│   ├── templates/index.ts   # 6 konsept registry
│   ├── unified-motor.ts     # Tek motor (template + zone)
│   ├── shop-catalog-match.ts
│   ├── rules/
│   │   ├── all-day-dining-cafe/template.ts  → buildAllDayDiningTemplate()
│   │   ├── turk-restoran/template.ts        → buildTurkRestoranTemplate()
│   │   ├── coffee-shop/template.ts
│   │   └── …
│   └── …
├── referans/
│   ├── referans-types.ts
│   ├── build-template-items.ts
│   ├── s13-388.ts
│   ├── all-day-dining/
│   ├── turk-restoran/
│   └── coffee-shop-espressolab.ts
├── teklif/
│   ├── format-v14.ts
│   ├── fetch-kur.client.ts
│   ├── export-teklif-v14.client.ts
│   └── constants.ts
└── wizard/
    └── profiles.ts          # pfosZones per konsept
```

---

## `components/pfos/` — UI

```
components/pfos/
├── pro/PfosProWizard.tsx      # Ana wizard (/yonetim/pfos)
├── TeklifV14Proforma.tsx      # Proforma tablosu + Excel
├── pro/PfosTeklifProTable.tsx
├── steps/KonseptStep.tsx
├── steps/BolumM2Step.tsx
└── PFOSWizard.tsx             # Legacy wizard
```

**Sayfa:** `app/yonetim/(panel)/pfos/page.tsx`

---

## `public/data/pfos-*.json`

| Dosya | Rol |
|-------|-----|
| `pfos-all-day-dining-referanslar.json` | THC Bakü, Kayseri |
| `pfos-s13-388-referanslar.json` | S13-388 turk + all-day |
| `pfos-coffee-shop-referanslar.json` | Espressolab yedek |
| `pfos-referans-projeler.json` | Arşiv zone özeti |
| `pfos-zone-proje-kurallari.json` | Konsept → zone kuralları |
| `pfos-zone-catalog.json` | Zone ürün şablonları |
| `pfos-katalog-olcu-mm.json` | SKU → mm |
| `pfos-tip-shop-links.json` | urunTipi → shop link |
| `pfos-konseptler.json` | Legacy konsept meta |
| `pfos-catalog.json` | Katalog |
| `ekipmanlar.json` | (shop) ekipman listesi |

---

## `scripts/`

| Script | npm |
|--------|-----|
| `extract-pfos-referans-projeler.py` | `pfos:referans:extract` |
| `build-pfos-zone-kurallari.mjs` | `pfos:referans:build` |
| `build-all-day-dining-referanslar.py` | `pfos:referans:all-day-dining` |
| `build-s13-388-referanslar.py` | `pfos:referans:s13-388` |
| `test-pfos-motor.mjs` | `pfos:motor:test` |

---

## API route’lar (Next.js)

| Route | İşlev |
|-------|--------|
| `/api/pfos/concepts` | Konsept listesi |
| `/api/pfos/quote` | Teklif hesaplama |
| `/api/kur` | TCMB EUR kuru |

`app/api/` altında ilgili route dosyalarına bakın.
