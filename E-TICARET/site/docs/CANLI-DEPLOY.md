# Canlıya alma (equsto.com)

**Hetzner / Docker:** bkz. [`HETZNER-DEPLOY.md`](HETZNER-DEPLOY.md) (Vercel yerine self-hosted).

## Tek kod klasörü (önemli)

| Ne | Yol |
|----|-----|
| **Düzenle / commit** | `E-TICARET/site/` |
| Vercel Root Directory | **`E-TICARET/site`** |
| Kullanmayın (eski kopya) | `EQUSTO-WORK/E-TICARET/site`, `equsto-v2` |

`EQUSTO-WORK/E-TICARET/site` — **kullanmayın** (eski yedek). Next `app/`, `lib/` ve `public/data/dept/*.json` tek kaynakta `E-TICARET/site` içinde olmalı.

## Vercel panel

1. [vercel.com](https://vercel.com) → proje **equsto** → **Settings** → **Build and Deployment**
2. **Root Directory:** `E-TICARET/site` (başında/sonunda `/` yok)
3. **Framework:** Next.js (otomatik)
4. Build / Install: `vercel.json` içindeki `node scripts/vercel-*.mjs` (elle değiştirmeyin)
5. **Deployments** → bekleyen **Queued** işleri **Cancel**
6. Son `main` commit → **Redeploy** → **Build Cache: KAPALI** (ilk düzeltmeden sonra açılabilir)

## Yerel — Next app’i git’ten E-TICARET/site’a almak

Eski `EQUSTO-WORK` kopyasından **dosya kopyalamayın** (junction bozulması). Gerekirse:

```cmd
cd C:\D Disk\EQUSTO-WORK\E-TICARET\site
node scripts/sync-canonical-app-from-git.mjs
```

## Yerel build

```cmd
cd C:\D Disk\EQUSTO-WORK\E-TICARET\site
build.cmd
```

PowerShell `npm` engelliyorsa `build.cmd` veya `npm.cmd run build` kullanın.

## Deploy sonrası

- https://equsto.com/
- https://equsto.com/shop/market-reyonlari
- https://equsto.com/shop/kuvetler
- **Ctrl+F5**

## Build hâlâ Error ise

Deployments → failed satır → **Building** logunun **son 30 satırını** kopyalayın (yalnızca "exited with 1" yetmez).
