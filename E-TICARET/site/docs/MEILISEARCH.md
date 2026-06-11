# Meilisearch — arama

Motor: **Meilisearch** (açık kaynak). **Canlıda ücret yok** — Hetzner sunucusunda Docker ile çalışır.

## Seçenekler

| Ortam | Nerede | Env |
|--------|--------|-----|
| **Canlı (equsto.com)** | Hetzner `docker-compose.yml` → `meilisearch` servisi | `MEILISEARCH_HOST=http://meilisearch:7700` |
| **Geliştirme** | Docker yerelde `localhost:7700` | `docker-compose.meilisearch.yml` |
| ~~Cloud~~ | ~~meilisearch.com/cloud~~ | Kullanmayın (ücretli / eski kurulum) |

## 1) Yerel (Docker)

```cmd
cd equsto-v2
docker compose -f docker-compose.meilisearch.yml up -d
```

`.env.local`:

```env
MEILISEARCH_HOST=http://127.0.0.1:7700
MEILISEARCH_MASTER_KEY=equsto-dev-meili-key
```

(`docker-compose.meilisearch.yml` içindeki anahtar ile aynı olmalı.)

## İndeks adı (Cloud)

Dashboard → **Create an index** alanına şunu yazın:

```
equsto_products
```

`products` tek başına Cloud’da çoğu hesapta **kabul edilmez** (rezerve/şablon). Kod varsayılanı artık `equsto_products`; farklı ad kullanırsanız Vercel’de `MEILISEARCH_INDEX` ile aynı yapın.

## 2) Meilisearch Cloud (canlı)

1. https://www.meilisearch.com/cloud → proje oluştur
2. **Settings → API Keys** → **Admin** (indeks yazma + arama)
3. Vercel → Environment Variables:

| Key | Değer |
|-----|--------|
| `MEILISEARCH_HOST` | `https://xxxx.meilisearch.io` (dashboard) |
| `MEILISEARCH_MASTER_KEY` | Admin API key |
| `MEILISEARCH_INDEX` | `equsto_products` (dashboard’da oluşturduğunuz indeks adı) |

4. **Redeploy**

## 3) İndeks doldurma

Canlı vitrin `public/data/ekipmanlar.json` (yoksa `public/data/dept/*.json`) → indeks **`equsto_products`** (Cloud’da `products` adı genelde kabul edilmez). `ekipmanlar-full-archive.json` **indekse alınmaz** (eski ~12k yedek).

```cmd
cd equsto-v2
npm run search:index
```

Çıktı: ~tüm departman ürünleri; `id`, `slug`, `name`, `brand`, `dept`, `category`, `url`.

## Sorun: Pencere açılıp hemen kapanıyor

Cloud arayüzü hata alınca modalı anında kapatır («unable to reach your instance» ile birlikte görülür). **UI’ye güvenmeyin.**

1. Farklı tarayıcı veya **Gizli pencere** (reklam engelleyici kapalı).
2. Dashboard’da proje **Running** olana kadar bekleyin.
3. Yerel test (UI olmadan):
   ```cmd
   cd equsto-v2
   npm run search:health
   npm run search:index
   ```

## Sorun: Arama çubuğu hiç sonuç vermiyor

1. **Next.js çalışıyor mu?** Statik `index.html` tek başına `/api/search` sunmaz → `npm run dev` veya Vercel deploy.
2. **Meilisearch erişimi:** `npm run search:health` — HATA ise Cloud instance kapalı/yanlış anahtar.
3. **Geçici çözüm (kod):** Meili yoksa veya hata verirse API `ekipmanlar.json` üzerinde **fallback** arama döner (`source: "fallback"`). Öneri kutusunda uyarı görünür.
4. **Kalıcı:** Cloud **Running** → `npm run search:index` → Vercel env + Redeploy.

Tarayıcıda test: `/api/search?q=izgara&limit=5` ve `/api/search?check=1`

## Sorun: «Index creation failed — unable to reach your instance»

Bu hata **sizin kodunuzdan değil**; Meilisearch Cloud, size açılan sunucuya (instance) henüz bağlanamıyor.

1. **10–20 dk bekleyin** — yeni proje bazen «Provisioning» durumunda kalır; sayfayı yenileyin.
2. Dashboard’da proje durumu **Active / Running** mi kontrol edin (Pending ise indeks oluşturmayın).
3. **Settings → API Keys** bölümünde **Host URL** görünüyor mu? Görünmüyorsa instance hazır değildir.
4. Host görünüyorsa tarayıcıda veya PowerShell’de:
   ```powershell
   curl.exe "https://SIZIN-HOST.meilisearch.io/health"
   ```
   `{"status":"available"}` dönmeli. Dönmüyorsa Cloud tarafı sorunu — **Support** veya projeyi silip yeniden oluşturun.
5. Instance **healthy** olduktan sonra indeks:
   - UI: `equsto_products`, veya
   - Yerel: `.env.local` dolu iken `npm run search:index` (indeksi API ile oluşturur).

Durum sayfası: https://status.meilisearch.com/

## 4) Test

```cmd
curl "http://127.0.0.1:7700/health"
curl "http://localhost:3000/api/search?q=izgara"
```

Tarayıcı: `http://localhost:3000/arama?q=fırın`

## API

- `GET /api/search?q=…&limit=20` — sunucu tarafı (anahtar Vercel’de kalır)
- İndeks adı: `equsto_products` (`MEILISEARCH_INDEX`, `lib/meilisearch.ts`)

## Üst arama çubuğu (statik mağaza)

- **Öneri kutusu:** `eq-header-search.js` — yazarken `GET /api/search?limit=8`
- **Enter / Ara:** `/arama?q=…` (`arama.html` + `eq-arama-page.js`)
- **Ana sayfa:** yazarken hâlâ `__eqHomeSearch` (vitrin içi filtre); Enter → Meilisearch sonuç sayfası

## İlgili dosyalar

- `scripts/index-meilisearch.mjs`
- `docker-compose.meilisearch.yml`
- `app/api/search/route.ts`
- `public/eq-header-search.js`, `public/eq-arama-page.js`, `public/arama.html`
- `next.config.ts` — `/arama` → `arama.html`
