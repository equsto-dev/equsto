# Wizard akışı ve API tasarımı

---

## Detay seviyesi sorusu (PFOS’ta sorulacak)

**Soru:**

> Bu bilgiler yeterli mi, yoksa projeyi senin için detaylandırayım mı?

| UI seçenek | `detaySeviyesi` | Ne açılır |
|------------|-----------------|-----------|
| Evet, yeterli — hızlı teklif | `hizli` | Segment/konsept + m² → `referansId` otomatik → teklif |
| Projeyi detaylandır | `detayli` | Zone m², teşhir toggles, referans seçimi, eksik zorunlu listesi |
| (opsiyonel) Standart | `standart` | m² + 2–3 segment sorusu |

### Akış

```
Üst kategori → Segment → Konsept (veya otomatik)
        ↓
      m² girişi
        ↓
[Detay sorusu]
        ↓
   hizli / detayli
        ↓
POST quote → proforma + Excel
```

### Henüz yapılmadı

- `PFOSRequestSchema` → `detaySeviyesi`, `referansId`, `segment`, `ustKategori`
- `components/pfos/steps/DetaySeviyesiStep.tsx` (veya Pro wizard adımı)

---

## API-esnek mimari

### Kimlik hiyerarşisi

```
ustKategori: restaurant-cafe
  └── segment: turkish-cuisine
        └── konsept: turk-restoran
              └── referansId: s13-388-turk-220
```

Geriye uyumluluk: yalnızca `konsept` + `m2` gönderilince çalışmaya devam.

### Hedef endpoint’ler

| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/pfos/taxonomy` | Üst + segment + konsept ağacı |
| GET | `/api/pfos/concepts` | Konsept meta (m², kalem sayısı) — **mevcut** |
| GET | `/api/pfos/referanslar` | `?konsept=&segment=` |
| POST | `/api/pfos/quote` | Teklif — **mevcut** |
| POST | `/api/pfos/quote/preview` | Eksik zorunlu + önerilen detay |

### Örnek istek (hedef)

```json
{
  "ustKategori": "restaurant-cafe",
  "segment": "turkish-cuisine",
  "konsept": "turk-restoran",
  "referansId": "s13-388-turk-220",
  "detaySeviyesi": "hizli",
  "m2": 220,
  "sehir": "istanbul",
  "fiyatStratejisi": "orta"
}
```

### Örnek yanıt meta (hedef)

```json
{
  "detaySeviyesi": "hizli",
  "kullanilanReferansId": "s13-388-turk-220",
  "eksikZorunlu": ["Tandır Fırını", "..."],
  "tavsiyeKalemler": ["Börek Teşhir Dolabı", "..."],
  "onerilenDetaySeviyesi": "detayli"
}
```

### Versiyonlu sözlük (hedef dosya)

`public/data/pfos-sektor-taksonomisi.json`:

- `version`, `locale`
- `ustKategoriler[]`, `segments[]`, `konseptler[]`
- `referansProfilleri[]`, `m2Bands`
- `aliases[]` (slug stabilitesi)

---

## Mevcut API (bugün)

**Schema:** `lib/pfos/schemas/pfos.schema.ts`

```ts
konsept, m2, sehir, lokasyon?, fiyatStratejisi,
bolumM2?, teslimatAdresi?, projeAdi?, musteri?
```

**Handler:** `lib/pfos/api-handlers.ts` → `pfosPostQuote`, `pfosGetConcepts`

**Kur:** `GET /api/kur` (TCMB)
