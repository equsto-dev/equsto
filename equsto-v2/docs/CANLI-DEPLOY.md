# Canlıya alma (equsto.com)

Kod `main` branch’te; site **Vercel Production** deploy edilince güncellenir.

## Hızlı (panel — 1 dakika)

1. [vercel.com](https://vercel.com) → proje **equsto**
2. **Settings → General → Root Directory** = `equsto-v2`
3. **Deployments** → en üstteki `main` commit (ör. `fix(kahve): bust script cache`)
4. **⋯ → Redeploy** → **Use existing Build Cache: KAPALI** → Redeploy
5. **Ready** olunca: `https://equsto.com/data/dept/kahve.json` → ~19 ürün, çay yok
6. `https://equsto.com/shop/kahve` → Ctrl+F5

## Otomatik (GitHub Actions)

Repo → **Settings → Secrets → Actions** → ekle:

| Secret | Nereden |
|--------|---------|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | Vercel → Project → Settings → General (veya `.vercel/project.json`) |
| `VERCEL_PROJECT_ID` | Aynı |

Sonra **Actions → Vercel Production → Run workflow** veya `main`’e push.

## Doğrulama

- `kahve.json` canlıda **19** ürün, **0** çay
- `kahve.html` içinde `eq-dept-plp.js?v=20260521cay-v2`
