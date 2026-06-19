# Meilisearch — arama

Motor: **Meilisearch** (açık kaynak, MIT). **Canlıda lisans ücreti yok** — Hetzner sunucusunda Docker ile çalışır.

> Eski Meilisearch Cloud hesabı kullanılmıyor (ücretli; deneme projeleri siliniyor). Cloud’dan “upgrade” maili gelirse yok sayın — canlı site Hetzner’daki container’ı kullanır.

## Ortamlar

| Ortam | Nerede | Env |
|--------|--------|-----|
| **Canlı (equsto.com)** | Hetzner `docker-compose.yml` → `meilisearch` servisi | `MEILISEARCH_HOST=http://meilisearch:7700` |
| **Geliştirme** | Yerel Docker `localhost:7700` | `docker-compose.meilisearch.yml` |

## Yerel geliştirme (Docker)

```cmd
cd E-TICARET/site
npm run search:up
```

`.env.local`:

```env
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=equsto-dev-meili-key
MEILISEARCH_INDEX=equsto_products
```

(`docker-compose.meilisearch.yml` içindeki anahtar ile aynı olmalı.)

## Canlı (Hetzner)

`docker-compose.yml` Meilisearch’i otomatik başlatır. Env: `.env.production` — bkz. [`HETZNER-DEPLOY.md`](HETZNER-DEPLOY.md).

```env
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_MASTER_KEY=equsto-prod-meili-key
MEILISEARCH_INDEX=equsto_products
```

İlk kurulum veya katalog güncellemesi sonrası indeks (sunucuda):

```bash
MEILISEARCH_HOST=http://127.0.0.1:7700 MEILISEARCH_MASTER_KEY=equsto-prod-meili-key npm run search:index
```

## İndeks adı

Varsayılan: **`equsto_products`** (`MEILISEARCH_INDEX`, `lib/meilisearch.ts`).

## İndeks doldurma

Kaynak: `public/data/ekipmanlar.json` (yoksa `public/data/dept/*.json`). `ekipmanlar-full-archive.json` indekse alınmaz.

```cmd
npm run search:index
```

Çıktı: departman ürünleri; `id`, `slug`, `name`, `brand`, `dept`, `category`, `url`.

## Sağlık kontrolü

```cmd
npm run search:health
```

Canlı:

```powershell
curl.exe "https://equsto.com/api/search?health=1"
curl.exe "https://equsto.com/api/search?q=tezgah&limit=3"
```

Beklenen: `ok: true`, `documents` > 0, aramada `source: "meilisearch"`.

## Sorun giderme

1. **Container:** `docker compose ps` → `meilisearch` Running
2. **Env:** Hetzner `.env.production` → `MEILISEARCH_HOST=http://meilisearch:7700`
3. **Yeniden başlat:** `docker compose --env-file .env.production up -d meilisearch app`
4. **İndeks:** `npm run search:health` → `npm run search:index`
5. **Fallback:** Meili yoksa API `ekipmanlar.json` üzerinde arama döner (`source: "fallback"`)

Tarayıcı: `/api/search?q=izgara&limit=5`, `/api/search?health=1`

## API

- `GET /api/search?health=1` — indeks istatistikleri
- `GET /api/search?q=…&limit=20` — sunucu tarafı arama (anahtar sunucuda kalır)

## Üst arama çubuğu (statik mağaza)

- **Öneri kutusu:** `eq-header-search.js` — yazarken `GET /api/search?limit=8`
- **Enter / Ara:** `/arama?q=…` (`arama.html` + `eq-arama-page.js`)

## İlgili dosyalar

- `scripts/index-meilisearch.mjs`, `scripts/meili-health.mjs`
- `docker-compose.yml`, `docker-compose.meilisearch.yml`
- `app/api/search/route.ts`
- `public/eq-header-search.js`, `public/eq-arama-page.js`, `public/arama.html`
