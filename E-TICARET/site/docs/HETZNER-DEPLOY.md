# Hetzner — equsto.com (Docker)

Vercel yerine kendi sunucunuzda Next.js + Caddy + **Meilisearch (Docker, ücretsiz)**. Veritabanı (Supabase) ve medya (CloudFront) dışarıda kalır.

## Sunucu önerisi

| Kaynak | Öneri |
|--------|--------|
| Tip | **CX32** (4 vCPU, 8 GB) — yoğun build için **CX42** |
| OS | **Ubuntu 24.04 LTS** |
| Disk | 80 GB+ (Docker image + log) |
| Bölge | Falkenstein veya Nuremberg (TR gecikmesi için iyi) |

## İlk kurulum

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# yeni oturum açın

# Repo
sudo mkdir -p /opt/equsto && sudo chown $USER:$USER /opt/equsto
git clone <repo-url> /opt/equsto
cd /opt/equsto/E-TICARET/site

cp .env.production.example .env
# Vercel Production env değerlerini yapıştırın (bkz. docs/VERCEL-ENV-VE-DOMAIN.md)

docker compose --env-file .env.production up -d --build
```

Meilisearch `docker-compose.yml` ile otomatik başlar. İlk indeks (bir kez):

```bash
MEILISEARCH_HOST=http://127.0.0.1:7700 MEILISEARCH_MASTER_KEY=equsto-prod-meili-key npm run search:index
```

## Güncelleme

```bash
cd /opt/equsto/E-TICARET/site
bash scripts/hetzner-deploy.sh
```

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `Dockerfile` | Multi-stage, `output: standalone` |
| `docker-compose.yml` | `app` + `caddy` (+ `meili` profili) |
| `deploy/Caddyfile` | HTTPS + www → apex |
| `deploy/nginx-equsto.conf` | Nginx alternatifi |
| `.env` | Runtime + build args (`.env.production.example` şablonu; git'e girmesin) |
| `scripts/docker-ci.mjs` | Build pipeline (Vercel `.next` kopyası yok) |

## Vercel'den farklar

- `vercel-ci.mjs` → repo köküne `.next` kopyalamaz; `docker-ci.mjs` kullanılır.
- `NEXT_PUBLIC_*` değişkenleri **image build** sırasında gömülür — değişince `docker compose build` gerekir.
- `CRON_SECRET` + harici cron: `GET https://equsto.com/api/cron/tcmb-kur` (Authorization: Bearer …) — Vercel Cron yerine sunucu crontab veya Uptime Kuma.
- `www` yönlendirmesi: `deploy/Caddyfile` (Vercel `vercel.json` redirects yerine).

## DNS kesimi (Vercel → Hetzner)

1. Hetzner sunucuda site çalışsın; geçici test: `curl -H 'Host: equsto.com' http://SUNUCU_IP/`
2. Alan adı panelinde **eski Vercel kayıtlarını** kaldırın:
   - A `@` → `76.76.21.21` (Vercel)
   - CNAME `www` → `cname.vercel-dns.com`
3. Yeni kayıtlar (Hetzner sunucu IPv4):
   - **A** `@` → `SUNUCU_IP`
   - **A** veya **CNAME** `www` → `SUNUCU_IP` veya `equsto.com`
4. TTL düşürün (300 sn), değişiklikten önce.
5. Caddy 443 açık olsun: `ufw allow 80,443/tcp`
6. DNS yayılımı sonrası https://equsto.com/ , `/api/kur` , `/api/search?q=test`
7. Vercel projesini silmeyin — önce 24–48 saat paralel izleyin; geri dönüş için eski DNS not alın.

## Vercel panelinden kopyalanacak env listesi

Production (+ gerekiyorsa Preview) — `docs/VERCEL-ENV-VE-DOMAIN.md` ile aynı:

| Değişken | Not |
|----------|-----|
| `DATABASE_URL` | Port 6543, tırnak yok |
| `DIRECT_URL` | Port 5432 |
| `EQUSTO_ADMIN_BEARER` | |
| `EQUSTO_ADMIN_RECOVERY_CODE` | |
| `LEGACY_DATA_BASE` | `https://equsto.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://equsto.com` |
| `NEXT_PUBLIC_ASSET_CDN_URL` | CloudFront |
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `MEILISEARCH_HOST` | `http://meilisearch:7700` (Hetzner Docker) |
| `MEILISEARCH_MASTER_KEY` | |
| `MEILISEARCH_INDEX` | `equsto_products` |
| `CRON_SECRET` | |
| `TCMB_KUR_REVALIDATE_SEC` | opsiyonel |
| `EQUSTO_EUR_TRY_FALLBACK` | opsiyonel |
| `GOOGLE_CLIENT_ID` / `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | üye girişi |
| `ANTHROPIC_API_KEY` | PFOS import |
| `TELEGRAM_*`, `RESEND_*`, `EQUSTO_NOTIFY_*` | bildirim |
| `EQUSTO_WHATSAPP_*`, `GREEN_API_*`, `WHATSAPP_*` | WhatsApp modu |
| `NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_GOOGLE_ADS_ID` | analitik |

**Gerekmez (yalnızca yerel upload):** `AWS_S3_BUCKET`, `AWS_REGION`, `BLOB_READ_WRITE_TOKEN`, `VERCEL_*`

## Sorun giderme

```bash
docker compose logs -f app
docker compose exec app node --import ./scripts/load-env.mjs scripts/meili-health.mjs
curl -sS http://127.0.0.1:3000/api/kur
```

Build bellek hatası: sunucuda swap veya daha büyük CX tipi; `NODE_OPTIONS=--max-old-space-size=4096` Dockerfile'da ayarlı.

## İlgili

- `docs/DEPLOY-MIMARI.md` — genel mimari (Vercel satırını Hetzner ile değiştirin)
- `docs/VERCEL-ENV-VE-DOMAIN.md` — env detayları
- `docs/MEILISEARCH.md` — arama
