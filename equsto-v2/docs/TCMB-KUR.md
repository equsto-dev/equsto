# TCMB EUR/TRY — Efektif Satış

EQUSTO fiyatlarında TL dönüşümü **TCMB günlük efektif satış** kuruna (`BanknoteSelling`, 1 EUR) dayanır.

## Canlı API

```
GET https://equsto.com/api/kur
```

Örnek yanıt:

```json
{
  "success": true,
  "currency": "EUR",
  "type": "efektif_satis",
  "label": "TCMB Efektif Satış",
  "rate": 52.9424,
  "unit": 1,
  "date": "20.05.2026",
  "source": "tcmb",
  "sourceUrl": "https://www.tcmb.gov.tr/kurlar/today.xml",
  "fetchedAt": "2026-05-20T12:00:00.000Z",
  "fallback": false
}
```

Önbellek: varsayılan **60 sn** (`TCMB_KUR_REVALIDATE_SEC`; `0` = her istekte taze).

**Mağaza (equsto.com):** Her sayfa yüklemesinde TCMB çekilir; TRY = `fiyat_euro_site × kur` (DB’deki eski `priceListTl` yok sayılır, EUR specs varsa).

## Fiyat formülü (Atalay döner)

- Katalog EUR → site EUR = katalog × **0,6** (%40 iskonto)
- Liste TRY = site EUR × **TCMB efektif satış**

Örnek ADG-10S: 1.620 EUR katalog → 972 EUR site → × 52,9424 ≈ **51.460 TRY**

## Vercel Cron (DB senkronu)

`vercel.json` → hafta içi **12:30 UTC** (15:30 TR) → `GET /api/cron/tcmb-kur`

Vercel env:

| Key | Açıklama |
|-----|----------|
| `CRON_SECRET` | Vercel otomatik `Authorization: Bearer …` gönderir |
| `EQUSTO_EUR_TRY_FALLBACK` | TCMB erişilemezse yedek kur (opsiyonel, varsayılan 36) |

Cron, `specs.fiyat_euro_site` olan yayın ürünlerin `priceListTl` alanını günceller. Vitrin sayfaları ayrıca **anlık kur** ile de hesaplar.

## Yerel komutlar

```bash
cd equsto-v2
npm run kur:fetch
npm run catalog:doner:parse
```

`catalog:doner:parse` TCMB’den kuru çeker, JSON katalog + `public/data/equsto-eur-try-rate.json` yazar.

PFOS teklif Excel: önce `/api/kur`, yoksa statik JSON.

## Kaynak kod

- `lib/tcmb-kur.ts` — XML parse
- `lib/equsto-pricing.ts` — TL hesabı
- `app/api/kur/route.ts`
- `app/api/cron/tcmb-kur/route.ts`
