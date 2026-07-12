# Hetzner — equsto.com (Docker) — **tek canlı ortam**

> **Vercel kullanılmıyor** (2026-06). Tüm production deploy bu sunucuya yapılır.

## Canlıya alma (3 yol)

| Yol | Ne zaman |
|-----|----------|
| **Otomatik** | `main` dalına push → GitHub Actions deploy (~3–5 dk) |
| **Tek komut** | `npm run deploy:canli` (GH Actions tetikler + izler) |
| **SSH** | `npm run deploy:canli -- --ssh` veya sunucuda `bash scripts/hetzner-deploy.sh` |

### Tek komut (önerilen)

```bash
cd E-TICARET/site
npm run deploy:canli
```

Windows PowerShell:

```powershell
cd "C:\D Disk\EQUSTO-WORK\E-TICARET\site"
npm run deploy:canli
# veya
.\scripts\deploy-canli.ps1
```

İlk kurulum (bir kez):

```bash
gh auth login
```

GitHub repo secret'ları (Settings → Secrets → Actions):

| Secret | Açıklama |
|--------|----------|
| `HETZNER_SSH_KEY` | Deploy private key (`equsto_deploy_new`) |
| `HETZNER_HOST` | `167.233.86.144` (opsiyonel, varsayılan aynı) |
| `HETZNER_SSH_PASSPHRASE` | Anahtar parolalıysa (opsiyonel) |

### Otomatik deploy

`main` dalına `E-TICARET/site/**` altında değişiklik push edilince workflow çalışır:

- GitHub → **Actions** → **Hetzner deploy**
- Manuel tetik: **Run workflow**

## Sunucu

| Kaynak | Değer |
|--------|--------|
| IP | `167.233.86.144` |
| Repo yolu | `/opt/equsto/E-TICARET/site` |
| Deploy script | `scripts/hetzner-deploy.sh` |

SSH config örneği (`~/.ssh/config`):

```
Host equsto-hetzner
  HostName 167.233.86.144
  User root
  IdentityFile ~/.ssh/equsto_deploy_new
  IdentitiesOnly yes
```

## İlk kurulum (sunucu)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

sudo mkdir -p /opt/equsto && sudo chown $USER:$USER /opt/equsto
git clone <repo-url> /opt/equsto
cd /opt/equsto/E-TICARET/site

cp .env.production.example .env.production
# env değerlerini doldurun

docker compose --env-file .env.production up -d --build
```

Meilisearch ilk indeks:

```bash
MEILISEARCH_HOST=http://127.0.0.1:7700 MEILISEARCH_MASTER_KEY=... npm run search:index
```

## Güncelleme (sunucuda elle)

```bash
cd /opt/equsto/E-TICARET/site
bash scripts/hetzner-deploy.sh
```

## Dosyalar

| Dosya | Açıklama |
|-------|----------|
| `scripts/deploy-canli.mjs` | Yerel tek komut (GH Actions / SSH) |
| `scripts/deploy-canli.ps1` | Windows sarmalayıcı |
| `deploy-canli.cmd` | Windows çift tık |
| `scripts/hetzner-deploy.sh` | Sunucu tarafı pull + docker build |
| `.github/workflows/hetzner-deploy.yml` | CI deploy |

## Deploy sonrası kontrol

- https://equsto.com/
- https://equsto.com/api/kur
- Tarayıcıda **Ctrl+F5**

## Ajan cron'ları (Hetzner)

Sunucuda bir kez (`.env.production` içinde `CRON_SECRET` ve isteğe bağlı `ANTHROPIC_API_KEY` tanımlı olmalı):

```bash
cd /opt/equsto/E-TICARET/site
bash scripts/hetzner-install-cron.sh
```

| Endpoint | Zamanlama |
|----------|-----------|
| `/api/cron/tcmb-kur` | Her gün 12:30 UTC |
| `/api/cron/catalog-agent` | Pazartesi 03:00 UTC |
| `/api/cron/mobile-agent` | Pazartesi 03:15 UTC |
| `/api/cron/google-ads-agent` | Pazartesi 03:30 UTC |
| `/api/cron/en-agent` | Pazartesi 03:45 UTC |
| `/api/cron/blog-agent` | Pazartesi 04:00 UTC (haftada 1 yazı taslağı) |

Manuel test:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://equsto.com/api/cron/blog-agent
```

## Sorun giderme

```bash
docker compose logs -f app
docker compose exec app node --import ./scripts/load-env.mjs scripts/meili-health.mjs
curl -sS http://127.0.0.1:3000/api/kur
```

Build bellek hatası: swap veya daha büyük sunucu; `NODE_OPTIONS=--max-old-space-size=4096` Dockerfile'da ayarlı.

Container çakışması:

```bash
docker ps -a | grep equsto
docker rm -f <eski-container-id>
docker compose --env-file .env.production up -d
```

## İlgili

- `docs/CANLI-DEPLOY.md` — kısa özet
- `docs/DEPLOY-MIMARI.md` — mimari
