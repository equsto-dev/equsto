# Canlı TCMB kuru (mağaza fiyatları)

Atalay vitrin fiyatları artık **JSON’daki sabit TL** yerine (mümkünse) **canlı EUR/TRY** ile hesaplanır.

## Akış

1. Tarayıcı `GET /api/kur` → TCMB efektif satış (sunucuda kısa önbellek, varsayılan **60 sn**).
2. `eq-kur-live.js` varsayılan **10 dakikada** bir kuru yeniler.
3. Ürün satırında: `satis_eur_indirimli` (veya `liste_fiyati_eur` + `iskonto_oran`) × **güncel kur** → TL + KDV metni.
4. Kur değişince `equsto:kur-updated` → PLP / arama / ürün sayfası yeniden çizer.

## Ortam değişkenleri (Vercel / `.env.local`)

| Değişken | Varsayılan | Açıklama |
|----------|------------|----------|
| `TCMB_KUR_REVALIDATE_SEC` | `60` | `/api/kur` önbellek süresi (sn). `0` = her istekte TCMB. |
| `EQUSTO_EUR_TRY_FALLBACK` | `36` | TCMB erişilemezse |
| `EQUSTO_KUR_POLL_MS` | (istemci 600000) | İstemci yenileme aralığı (ms). HTML: `data-eq-kur-poll-ms="3600000"` (1 saat). |

Örnek 10 dk istemci + 10 dk API önbellek:

```
TCMB_KUR_REVALIDATE_SEC=600
```

Sayfada 1 saat:

```html
<html data-eq-kur-poll-ms="3600000">
```

## Dosyalar

- `public/eq-kur-live.js` — mağaza canlı fiyat
- `public/equsto-pricing-core.js` — EUR × iskonto hesabı
- `app/api/kur/route.ts` — kur API
- `theme.js` — shop sayfalarına script yükler (PFOS hariç)

## Meilisearch / arama

Arama sonuçlarında canlı TL için indekste EUR alanları gerekir:

```cmd
npm run search:index
```

(`liste_fiyati_eur`, `satis_eur_indirimli`, `iskonto_oran`)

## Eski davranış

`npm run catalog:atalay:build` hâlâ JSON’a örnek TL yazar (yedek / SEO). Canlı kur yoksa o değer gösterilir.

## PFOS

PFOS’a dokunulmaz; kendi `equsto-eur-try-rate.json` / teklif akışı ayrıdır.
